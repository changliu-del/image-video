import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { POSTHOG_EVENTS, captureServerEvent } from '@/lib/analytics/posthog';
import { db } from '@/lib/db/drizzle';
import { grantPurchasedCredits } from '@/lib/credits';
import {
  getMockCreditPackageByPriceId,
  getMockStripePrices,
  getMockStripeProducts,
  isPaymentMockEnabled,
} from '@/lib/payments/mock';
import { teamMembers, type Team } from '@/lib/db/schema';
import {
  getTeamByStripeCustomerId,
  getUser,
  updateTeamSubscription
} from '@/lib/db/queries';

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  {
    apiVersion: '2025-04-30.basil'
  }
);

type ProductRef = string | Stripe.Product | Stripe.DeletedProduct | null | undefined;

type CreditsResolution = {
  credits: number;
  source: string;
};

const CREDIT_PACKAGES_BY_AMOUNT_CENTS = new Map<number, number>([
  [999, 50],
  [3999, 300],
  [9999, 1000]
]);

const CREDIT_PACKAGES_BY_NAME: Array<{
  pattern: RegExp;
  credits: number;
}> = [
  { pattern: /\bbusiness\b/i, credits: 1000 },
  { pattern: /\bpro\b/i, credits: 300 },
  { pattern: /\bstarter\b/i, credits: 50 }
];

function parsePositiveInteger(value: string | number | null | undefined) {
  if (value == null || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getStripeObjectId(value: string | { id: string } | null | undefined) {
  return typeof value === 'string' ? value : value?.id ?? null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  return getStripeObjectId(invoice.parent?.subscription_details?.subscription);
}

function getInvoicePaymentIntentIds(invoice: Stripe.Invoice) {
  return (
    invoice.payments?.data
      .map((payment) => getStripeObjectId(payment.payment.payment_intent))
      .filter((value): value is string => Boolean(value)) ?? []
  );
}

function isExpandedProduct(product: ProductRef): product is Stripe.Product {
  return typeof product === 'object' && product !== null && !('deleted' in product);
}

function getProductName(product: ProductRef) {
  return isExpandedProduct(product) ? product.name : null;
}

function getCreditsFromMetadata(
  metadata: Stripe.Metadata | null | undefined
) {
  return parsePositiveInteger(metadata?.credits);
}

function getCreditsFromName(packageName: string) {
  for (const packageMapping of CREDIT_PACKAGES_BY_NAME) {
    if (packageMapping.pattern.test(packageName)) {
      return packageMapping.credits;
    }
  }

  return null;
}

function getCreditsFromLineItemMetadata(lineItems: Stripe.LineItem[]) {
  for (const item of lineItems) {
    const priceCredits = getCreditsFromMetadata(item.price?.metadata);
    if (priceCredits != null) {
      return {
        credits: priceCredits * (item.quantity ?? 1),
        source: 'price_metadata'
      } satisfies CreditsResolution;
    }
  }

  for (const item of lineItems) {
    const product = item.price?.product;
    const productCredits = isExpandedProduct(product)
      ? getCreditsFromMetadata(product.metadata)
      : null;

    if (productCredits != null) {
      return {
        credits: productCredits * (item.quantity ?? 1),
        source: 'product_metadata'
      } satisfies CreditsResolution;
    }
  }

  return null;
}

function getCreditsFromFallbackMapping(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[]
) {
  const packageName = [
    session.metadata?.package,
    session.metadata?.packageName,
    session.metadata?.plan,
    ...lineItems.map((item) => item.description),
    ...lineItems.map((item) => getProductName(item.price?.product))
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  if (packageName) {
    const creditsByName = getCreditsFromName(packageName);
    if (creditsByName != null) {
      return {
        credits: creditsByName,
        source: 'package_name'
      } satisfies CreditsResolution;
    }
  }

  const amountTotal = session.amount_total;
  if (amountTotal != null && session.currency?.toLowerCase() === 'usd') {
    const creditsByAmount = CREDIT_PACKAGES_BY_AMOUNT_CENTS.get(amountTotal);
    if (creditsByAmount != null) {
      return {
        credits: creditsByAmount,
        source: 'amount_total'
      } satisfies CreditsResolution;
    }
  }

  return null;
}

function resolveCheckoutCredits(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[]
) {
  const sessionCredits = getCreditsFromMetadata(session.metadata);
  if (sessionCredits != null) {
    return {
      credits: sessionCredits,
      source: 'session_metadata'
    } satisfies CreditsResolution;
  }

  return (
    getCreditsFromLineItemMetadata(lineItems) ??
    getCreditsFromFallbackMapping(session, lineItems)
  );
}

async function resolveCheckoutUserId(session: Stripe.Checkout.Session) {
  const clientReferenceUserId = parsePositiveInteger(session.client_reference_id);
  if (clientReferenceUserId != null) {
    return clientReferenceUserId;
  }

  const metadataUserId =
    parsePositiveInteger(session.metadata?.userId) ??
    parsePositiveInteger(session.metadata?.user_id);
  if (metadataUserId != null) {
    return metadataUserId;
  }

  const customerId = getStripeObjectId(session.customer);
  if (!customerId) {
    return null;
  }

  const team = await getTeamByStripeCustomerId(customerId);
  if (!team) {
    return null;
  }

  const members = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, team.id))
    .limit(1);

  return members[0]?.userId ?? null;
}

function getCheckoutLineItemMetadata(lineItems: Stripe.LineItem[]) {
  return lineItems.map((item) => ({
    lineItemId: item.id,
    priceId: item.price?.id ?? null,
    productId: getStripeObjectId(item.price?.product),
    productName: getProductName(item.price?.product),
    quantity: item.quantity,
    amountTotal: item.amount_total,
    currency: item.currency
  }));
}

async function getProductDetails(productRef: ProductRef) {
  const productId = getStripeObjectId(productRef);

  if (!productId) {
    return { id: null, name: null };
  }

  if (isExpandedProduct(productRef)) {
    return { id: productRef.id, name: productRef.name };
  }

  const product = await stripe.products.retrieve(productId);
  if ('deleted' in product) {
    return { id: product.id, name: null };
  }

  return { id: product.id, name: product.name };
}

export async function createCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  if (isPaymentMockEnabled()) {
    return createMockCheckoutSession({ team, priceId });
  }

  const user = await getUser();

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  const price = await stripe.prices.retrieve(priceId);
  const isSubscription = Boolean(price.recurring);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: isSubscription ? 'subscription' : 'payment',
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer: team.stripeCustomerId || undefined,
    client_reference_id: user.id.toString(),
    allow_promotion_codes: true,
    metadata: {
      userId: String(user.id),
      credits: price.metadata.credits ?? ''
    },
    ...(isSubscription
      ? {
          subscription_data: {
            trial_period_days: 14
          }
        }
      : {
          customer_creation: 'always' as const
        })
  });

  await captureServerEvent({
    distinctId: String(user.id),
    event: POSTHOG_EVENTS.CHECKOUT_STARTED,
    properties: {
      userId: user.id,
      priceId,
      source: 'stripe_checkout'
    }
  });

  redirect(session.url!);
}

async function createMockCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  const creditPackage = getMockCreditPackageByPriceId(priceId);

  if (!creditPackage) {
    throw new Error(`Unknown mock payment price id: ${priceId}`);
  }

  await captureServerEvent({
    distinctId: String(user.id),
    event: POSTHOG_EVENTS.CHECKOUT_STARTED,
    properties: {
      userId: user.id,
      priceId,
      source: 'mock_checkout'
    }
  });

  const stripeEventId = `mock_checkout:${user.id}:${priceId}:${randomUUID()}`;
  const result = await grantPurchasedCredits({
    userId: user.id,
    credits: creditPackage.credits,
    stripeEventId,
    metadata: {
      source: 'mock_checkout',
      packageKey: creditPackage.key,
      packageName: creditPackage.name,
      priceId,
      amountTotal: creditPackage.unitAmount,
      currency: creditPackage.currency
    }
  });

  await captureServerEvent({
    distinctId: String(user.id),
    event: POSTHOG_EVENTS.CHECKOUT_COMPLETED,
    properties: {
      userId: user.id,
      stripeCheckoutSessionId: stripeEventId,
      stripeEventId,
      credits: creditPackage.credits,
      balance: result.balance,
      source: 'mock_checkout'
    }
  });

  redirect('/dashboard?checkout=mock_success');
}

export async function createCustomerPortalSession(team: Team) {
  if (isPaymentMockEnabled()) {
    return { url: '/pricing?billing=mock' };
  }

  if (!team.stripeCustomerId || !team.stripeProductId) {
    redirect('/pricing');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    const product = await stripe.products.retrieve(team.stripeProductId);
    if (!product.active) {
      throw new Error("Team's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the team's product");
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id)
            }
          ]
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        payment_method_update: {
          enabled: true
        }
      }
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
    configuration: configuration.id
  });
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = getStripeObjectId(subscription.customer);
  const subscriptionId = subscription.id;
  const status = subscription.status;

  if (!customerId) {
    console.error('Subscription is missing a Stripe customer:', subscriptionId);
    return;
  }

  const team = await getTeamByStripeCustomerId(customerId);

  if (!team) {
    console.error('Team not found for Stripe customer:', customerId);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    const item = subscription.items.data[0];
    const productRef = item?.price?.product ?? item?.plan?.product;
    const product = await getProductDetails(productRef);

    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: product.id,
      planName: product.name,
      subscriptionStatus: status
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status
    });
  }
}

export async function handleCheckoutSessionCompleted(
  stripeEventId: string,
  session: Stripe.Checkout.Session
) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 10,
    expand: ['data.price.product']
  });
  const creditsResolution = resolveCheckoutCredits(session, lineItems.data);

  if (!creditsResolution) {
    console.warn('Checkout session completed without a credits package', {
      stripeEventId,
      checkoutSessionId: session.id,
      amountTotal: session.amount_total,
      currency: session.currency,
      mode: session.mode
    });
    return { granted: false, reason: 'unrecognized_credits_package' as const };
  }

  const userId = await resolveCheckoutUserId(session);

  if (!userId) {
    console.warn('Checkout session completed without a resolvable user', {
      stripeEventId,
      checkoutSessionId: session.id,
      customerId: getStripeObjectId(session.customer)
    });
    return { granted: false, reason: 'user_not_found' as const };
  }

  const result = await grantPurchasedCredits({
    userId,
    credits: creditsResolution.credits,
    stripeEventId,
    metadata: {
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: getStripeObjectId(session.customer),
      stripePaymentIntentId: getStripeObjectId(session.payment_intent),
      amountTotal: session.amount_total,
      currency: session.currency,
      mode: session.mode,
      creditsSource: creditsResolution.source,
      lineItems: getCheckoutLineItemMetadata(lineItems.data)
    }
  });

  if (!result.alreadyProcessed) {
    await captureServerEvent({
      distinctId: String(userId),
      event: POSTHOG_EVENTS.CHECKOUT_COMPLETED,
      properties: {
        userId,
        stripeCheckoutSessionId: session.id,
        stripeEventId,
        credits: creditsResolution.credits,
        balance: result.balance,
        source: 'stripe_webhook'
      }
    });
  }

  return {
    granted: !result.alreadyProcessed,
    reason: result.alreadyProcessed ? ('duplicate_event' as const) : null,
    credits: creditsResolution.credits,
    balance: result.balance
  };
}

export async function handlePaymentIntentSucceeded(
  stripeEventId: string,
  paymentIntent: Stripe.PaymentIntent
) {
  // Checkout session completion is the only credit grant path. Stripe emits
  // payment_intent.succeeded for the same one-time payment, so this handler
  // audits the event without touching the credit ledger.
  console.info('Stripe payment_intent.succeeded audited without granting credits', {
    stripeEventId,
    paymentIntentId: paymentIntent.id,
    customerId: getStripeObjectId(paymentIntent.customer),
    latestChargeId: getStripeObjectId(paymentIntent.latest_charge),
    amount: paymentIntent.amount,
    amountReceived: paymentIntent.amount_received,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    metadataUserId:
      paymentIntent.metadata.userId ?? paymentIntent.metadata.user_id ?? null,
    metadataCredits: paymentIntent.metadata.credits ?? null
  });

  return { granted: false, reason: 'credits_granted_by_checkout' as const };
}

export async function handleInvoicePaymentSucceeded(
  stripeEventId: string,
  invoice: Stripe.Invoice
) {
  // Subscription invoices can represent renewals or prorations. Granting
  // credits here would double-count with checkout purchases unless the ledger
  // model introduces a separate invoice-based entitlement key.
  console.info('Stripe invoice.payment_succeeded audited without granting credits', {
    stripeEventId,
    invoiceId: invoice.id ?? null,
    customerId: getStripeObjectId(invoice.customer),
    subscriptionId: getInvoiceSubscriptionId(invoice),
    paymentIntentIds: getInvoicePaymentIntentIds(invoice),
    amountDue: invoice.amount_due,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    billingReason: invoice.billing_reason,
    status: invoice.status,
    metadataUserId: invoice.metadata?.userId ?? invoice.metadata?.user_id ?? null,
    metadataCredits: invoice.metadata?.credits ?? null
  });

  return { granted: false, reason: 'invoice_payment_audited' as const };
}

export async function getStripePrices() {
  if (isPaymentMockEnabled()) {
    return getMockStripePrices();
  }

  if (isPlaceholderStripeKey()) {
    return [];
  }

  let prices: Stripe.ApiList<Stripe.Price>;
  try {
    prices = await stripe.prices.list({
      expand: ['data.product'],
      active: true
    });
  } catch (error) {
    if (isStripeConfigurationError(error)) {
      console.warn('Stripe prices unavailable during build/runtime bootstrap');
      return [];
    }
    throw error;
  }

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval ?? null,
    trialPeriodDays: price.recurring?.trial_period_days ?? null,
    credits: parsePositiveInteger(price.metadata.credits)
  }));
}

export async function getStripeProducts() {
  if (isPaymentMockEnabled()) {
    return getMockStripeProducts();
  }

  if (isPlaceholderStripeKey()) {
    return [];
  }

  let products: Stripe.ApiList<Stripe.Product>;
  try {
    products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    });
  } catch (error) {
    if (isStripeConfigurationError(error)) {
      console.warn('Stripe products unavailable during build/runtime bootstrap');
      return [];
    }
    throw error;
  }

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}

function isPlaceholderStripeKey() {
  const key = process.env.STRIPE_SECRET_KEY ?? '';
  return !key || key.includes('placeholder') || key.includes('***');
}

function isStripeConfigurationError(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeAuthenticationError ||
    error instanceof Stripe.errors.StripePermissionError ||
    error instanceof Stripe.errors.StripeConnectionError
  );
}
