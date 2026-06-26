import {
  BILLING_CURRENCY,
  type BillingCurrency,
  getAmountForCredits,
  getDiscountedAnnualAmount,
} from './pricing';

export const SUBSCRIPTION_INTERVALS = ['month', 'year'] as const;
export type SubscriptionInterval = (typeof SUBSCRIPTION_INTERVALS)[number];

export const SUBSCRIPTION_TIERS = ['basic', 'plus', 'pro'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export type CreditPackage = {
  key: string;
  name: string;
  shortName: string;
  description: string;
  credits: number;
  unitAmount: number;
  currency: BillingCurrency;
  productId: string;
  priceId: string;
  features: string[];
};

export type SubscriptionPlan = {
  key: string;
  tier: SubscriptionTier;
  interval: SubscriptionInterval;
  name: string;
  displayName: string;
  description: string;
  credits: number;
  monthlyCredits: number;
  unitAmount: number;
  currency: BillingCurrency;
  productId: string;
  priceId: string;
  features: string[];
  savePercent?: number;
};

type SubscriptionTierDefinition = {
  tier: SubscriptionTier;
  displayName: string;
  description: string;
  monthlyCredits: number;
  monthlyUnitAmount: number;
  annualUnitAmount: number;
  features: string[];
};

const subscriptionTierDefinitions: SubscriptionTierDefinition[] = [
  {
    tier: 'basic',
    displayName: 'Basic',
    description: 'For testing product videos, campaign images, and try-on flows.',
    monthlyCredits: 60,
    monthlyUnitAmount: getAmountForCredits(60),
    annualUnitAmount: getDiscountedAnnualAmount(getAmountForCredits(60)),
    features: [
      '60 credits refresh every billing month',
      'All ecommerce image and video tools',
      'Good for 12 basic 5s videos',
    ],
  },
  {
    tier: 'plus',
    displayName: 'Plus',
    description: 'For weekly launches and repeat ad creative production.',
    monthlyCredits: 180,
    monthlyUnitAmount: getAmountForCredits(180),
    annualUnitAmount: getDiscountedAnnualAmount(getAmountForCredits(180)),
    features: [
      '180 credits refresh every billing month',
      'Priority queue in future production mode',
      'Good for 36 basic 5s videos',
    ],
  },
  {
    tier: 'pro',
    displayName: 'Pro',
    description: 'For brands producing SKU batches and frequent video tests.',
    monthlyCredits: 480,
    monthlyUnitAmount: getAmountForCredits(480),
    annualUnitAmount: getDiscountedAnnualAmount(getAmountForCredits(480)),
    features: [
      '480 credits refresh every billing month',
      'Highest mock subscription allowance',
      'Good for 96 basic 5s videos',
    ],
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] =
  subscriptionTierDefinitions.flatMap((definition) => {
    const common = {
      tier: definition.tier,
      displayName: definition.displayName,
      description: definition.description,
      credits: definition.monthlyCredits,
      monthlyCredits: definition.monthlyCredits,
      currency: BILLING_CURRENCY as BillingCurrency,
      features: definition.features,
    };

    return [
      {
        ...common,
        key: `${definition.tier}_monthly`,
        interval: 'month' as const,
        name: `${definition.displayName} Monthly`,
        unitAmount: definition.monthlyUnitAmount,
        productId: `mock_prod_subscription_${definition.tier}_monthly`,
        priceId: `mock_price_subscription_${definition.tier}_monthly`,
      },
      {
        ...common,
        key: `${definition.tier}_annual`,
        interval: 'year' as const,
        name: `${definition.displayName} Annual`,
        unitAmount: definition.annualUnitAmount,
        productId: `mock_prod_subscription_${definition.tier}_annual`,
        priceId: `mock_price_subscription_${definition.tier}_annual`,
        savePercent: 20,
      },
    ];
  });

export const MONTHLY_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter(
  (plan): plan is SubscriptionPlan & { interval: 'month' } =>
    plan.interval === 'month'
);

export const ANNUAL_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter(
  (plan): plan is SubscriptionPlan & { interval: 'year' } =>
    plan.interval === 'year'
);

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    key: 'starter',
    name: 'Starter Credits',
    shortName: 'Starter',
    description: 'A small top-up for prompt tests and product experiments.',
    credits: 20,
    unitAmount: getAmountForCredits(20),
    currency: BILLING_CURRENCY,
    productId: 'mock_prod_credits_starter',
    priceId: 'mock_price_credits_starter',
    features: [
      '20 purchased credits',
      'Never expire in mock mode',
      'Good for 4 basic 5s videos',
    ],
  },
  {
    key: 'creator',
    name: 'Creator Credits',
    shortName: 'Creator',
    description: 'Extra room for a weekly batch of product images and clips.',
    credits: 80,
    unitAmount: getAmountForCredits(80),
    currency: BILLING_CURRENCY,
    productId: 'mock_prod_credits_creator',
    priceId: 'mock_price_credits_creator',
    features: [
      '80 purchased credits',
      'Never expire in mock mode',
      'Good for 16 basic 5s videos',
    ],
  },
  {
    key: 'scale',
    name: 'Scale Credits',
    shortName: 'Scale',
    description: 'A larger reserve for catalog batches and campaign tests.',
    credits: 240,
    unitAmount: getAmountForCredits(240),
    currency: BILLING_CURRENCY,
    productId: 'mock_prod_credits_scale',
    priceId: 'mock_price_credits_scale',
    features: [
      '240 purchased credits',
      'Never expire in mock mode',
      'Good for 48 basic 5s videos',
    ],
  },
];

export function normalizeSubscriptionInterval(
  value: string | null | undefined
): SubscriptionInterval {
  return value === 'year' || value === 'yearly' || value === 'annual'
    ? 'year'
    : 'month';
}

export function getSubscriptionPlanByPriceId(priceId: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.priceId === priceId) ?? null;
}

export function getCreditPackageByPriceId(priceId: string) {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.priceId === priceId) ?? null;
}

export function getSubscriptionPlansByInterval(interval: SubscriptionInterval) {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.interval === interval);
}

export function getEffectiveMonthlyAmount(plan: SubscriptionPlan) {
  return plan.interval === 'year'
    ? Math.round(plan.unitAmount / 12)
    : plan.unitAmount;
}
