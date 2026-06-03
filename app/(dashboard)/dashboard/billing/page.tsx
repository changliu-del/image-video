import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BadgeCheck,
  CalendarDays,
  Check,
  CreditCard,
  Gem,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  cancelMockSubscriptionAction,
  checkoutAction,
  customerPortalAction,
} from '@/lib/payments/actions';
import {
  SUBSCRIPTION_PLANS,
  getEffectiveMonthlyAmount,
  getSubscriptionPlansByInterval,
  normalizeSubscriptionInterval,
  type SubscriptionInterval,
  type SubscriptionPlan,
} from '@/lib/payments/catalog';
import { getStripePrices } from '@/lib/payments/stripe';
import { getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SubmitButton } from '../../pricing/submit-button';

export const dynamic = 'force-dynamic';

type BillingPageProps = {
  searchParams?: Promise<{
    interval?: string | string[];
    checkout?: string | string[];
    subscription?: string | string[];
  }>;
};

type StripePrice = Awaited<ReturnType<typeof getStripePrices>>[number];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatCurrency(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function findActivePlan({
  planName,
  stripeProductId,
}: {
  planName?: string | null;
  stripeProductId?: string | null;
}) {
  return (
    SUBSCRIPTION_PLANS.find(
      (plan) => plan.name === planName || plan.productId === stripeProductId
    ) ?? null
  );
}

function resolvePlanPrice(plan: SubscriptionPlan, prices: StripePrice[]) {
  const price = prices.find(
    (item) =>
      item.id === plan.priceId ||
      (item.interval === plan.interval && item.credits === plan.credits)
  );

  return {
    unitAmount: price?.unitAmount ?? plan.unitAmount,
    priceId: price?.id,
    currency: price?.currency ?? plan.currency,
  };
}

function billingLabel(interval: SubscriptionInterval) {
  return interval === 'year' ? 'Yearly billing' : 'Monthly billing';
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const params = await searchParams;
  const selectedInterval = normalizeSubscriptionInterval(
    firstParam(params?.interval)
  );
  const checkoutState = firstParam(params?.checkout);
  const subscriptionState = firstParam(params?.subscription);
  const prices = await getStripePrices();
  const visiblePlans = getSubscriptionPlansByInterval(selectedInterval).map((plan) => ({
    ...plan,
    resolvedPrice: resolvePlanPrice(plan, prices),
  }));
  const activePlan = findActivePlan({
    planName: user.planName,
    stripeProductId: user.stripeProductId,
  });
  const hasActivePlan = user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';

  return (
    <main className="flex-1 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <CreditCard className="size-3.5" />
                  Plans and balance
                </div>
                <h1 className="mt-4 text-2xl font-semibold text-gray-950">
                  Choose the plan for your creative workload
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                  Payments are mocked in this phase. Subscriptions grant the monthly
                  credit allowance immediately, and real billing can be wired later
                  through the same price ids.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full md:w-auto">
                <Link href="/dashboard/credits">
                  <Wallet className="size-4" />
                  Buy extra credits
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <Gem className="size-3.5 text-indigo-500" />
                  Balance
                </div>
                <p className="mt-3 text-3xl font-semibold text-gray-950">
                  {user.creditBalance}
                </p>
                <p className="mt-1 text-xs text-gray-500">available credits</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <BadgeCheck className="size-3.5 text-emerald-500" />
                  Current plan
                </div>
                <p className="mt-3 truncate text-lg font-semibold text-gray-950">
                  {activePlan?.name ?? user.planName ?? 'No active plan'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {user.subscriptionStatus ?? 'subscription inactive'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <CalendarDays className="size-3.5 text-cyan-600" />
                  Cadence
                </div>
                <p className="mt-3 text-lg font-semibold text-gray-950">
                  {activePlan ? billingLabel(activePlan.interval) : 'Select a plan'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  credits are shown as monthly allowance
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-gray-950 p-5 text-white shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <ShieldCheck className="size-5 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Mock payment mode</h2>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  Checkout does not charge money yet. It updates the account plan,
                  adds credits, and writes a ledger entry so the workspace flow is
                  testable end to end.
                </p>
              </div>
            </div>
            {checkoutState === 'mock_subscription_success' ? (
              <div className="mt-5 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                Mock subscription activated and credits were added.
              </div>
            ) : null}
            {subscriptionState === 'mock_canceled' ? (
              <div className="mt-5 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/75">
                Mock subscription was canceled. Your remaining credit balance stays available.
              </div>
            ) : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {user.stripeCustomerId ? (
                <form action={customerPortalAction}>
                  <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                    Manage billing
                  </Button>
                </form>
              ) : null}
              {hasActivePlan ? (
                <form action={cancelMockSubscriptionAction}>
                  <Button type="submit" variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto">
                    <RotateCcw className="size-4" />
                    Cancel mock plan
                  </Button>
                </form>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-1 rounded-md bg-gray-100 p-1 sm:w-[320px]">
            {[
              { interval: 'month' as const, label: 'Monthly' },
              { interval: 'year' as const, label: 'Annual' },
            ].map((tab) => (
              <Link
                key={tab.interval}
                href={`/dashboard/billing?interval=${tab.interval}`}
                className={cn(
                  'inline-flex h-9 items-center justify-center rounded-md text-sm font-semibold transition',
                  selectedInterval === tab.interval
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-500 hover:text-gray-950'
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <p className="px-2 text-xs font-medium text-gray-500">
            Annual plans keep monthly credit refresh semantics and use a lower effective monthly price.
          </p>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {visiblePlans.map((plan) => {
            const price = plan.resolvedPrice;
            const current =
              hasActivePlan &&
              (activePlan?.key === plan.key || user.planName === plan.name);
            const effectiveMonthly = getEffectiveMonthlyAmount(plan);

            return (
              <div
                key={plan.key}
                className={cn(
                  'flex min-h-[430px] flex-col rounded-lg border bg-white p-5 shadow-sm transition',
                  plan.tier === 'plus'
                    ? 'border-indigo-200 shadow-indigo-100'
                    : 'border-gray-200',
                  current && 'border-emerald-300'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase text-gray-500">
                      {billingLabel(plan.interval)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-gray-950">
                      {plan.displayName}
                    </h2>
                  </div>
                  {plan.tier === 'plus' ? (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      Recommended
                    </span>
                  ) : null}
                  {current ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Current
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 text-gray-600">
                  {plan.description}
                </p>

                <div className="mt-6">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-tight text-gray-950">
                      {formatCurrency(price.unitAmount ?? plan.unitAmount, price.currency)}
                    </span>
                    <span className="pb-1 text-sm font-medium text-gray-500">
                      / {plan.interval === 'year' ? 'year' : 'month'}
                    </span>
                  </div>
                  {plan.interval === 'year' ? (
                    <p className="mt-2 text-sm text-gray-500">
                      {formatCurrency(effectiveMonthly, price.currency)} effective monthly
                      {plan.savePercent ? `, save ${plan.savePercent}%` : ''}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">cancel or switch later in billing</p>
                  )}
                  <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                    {plan.monthlyCredits} credits per billing month
                  </p>
                </div>

                <ul className="mt-6 grid gap-3 text-sm text-gray-700">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <form action={checkoutAction} className="mt-auto pt-6">
                  <input type="hidden" name="priceId" value={price.priceId ?? ''} />
                  <SubmitButton
                    disabled={!price.priceId || current}
                    label={current ? 'Current plan' : `Choose ${plan.displayName}`}
                    loadingLabel="Activating..."
                  />
                </form>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
