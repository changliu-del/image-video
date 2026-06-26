'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
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
  getEffectiveMonthlyAmount,
  getSubscriptionPlansByInterval,
  type SubscriptionInterval,
  type SubscriptionPlan,
} from '@/lib/payments/catalog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SubmitButton } from '@/app/(dashboard)/pricing/submit-button';
import { useDashboardLocale, withDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { billingCopy, subscriptionStatusLabels } from '@/components/dashboard/account-copy';

type BillingAccount = {
  user: {
    creditBalance: number;
    planName: string | null;
    subscriptionStatus: string | null;
    stripeCustomerId: string | null;
  };
  activePlan: SubscriptionPlan | null;
  hasActivePlan: boolean;
};

type BillingClientProps = {
  initialInterval: SubscriptionInterval;
  checkoutState?: string | null;
  subscriptionState?: string | null;
};

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error('Failed to load billing account');
  }
  return response.json() as Promise<BillingAccount>;
};

function getCurrencyLocale(locale: string) {
  if (locale === 'pt') return 'pt-BR';
  if (locale === 'zh') return 'zh-CN';
  return 'en-US';
}

function formatCurrency(amount: number, currency: string, locale: string) {
  return new Intl.NumberFormat(getCurrencyLocale(locale), {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function AccountValue({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading) {
    return <span className="inline-block h-7 w-24 animate-pulse rounded bg-gray-200" />;
  }

  return <>{children}</>;
}

export function BillingClient({
  initialInterval,
  checkoutState,
  subscriptionState,
}: BillingClientProps) {
  const locale = useDashboardLocale();
  const copy = billingCopy[locale];
  const [selectedInterval, setSelectedInterval] = useState(initialInterval);
  const { data, error, isLoading, mutate } = useSWR('/api/account/billing', fetcher, {
    revalidateOnFocus: false,
  });
  const visiblePlans = useMemo(
    () => getSubscriptionPlansByInterval(selectedInterval),
    [selectedInterval]
  );
  const activePlan = data?.activePlan ?? null;
  const hasActivePlan = Boolean(data?.hasActivePlan);
  const subscriptionStatus = data?.user.subscriptionStatus;
  const subscriptionStatusLabel = subscriptionStatus
    ? subscriptionStatusLabels[locale][subscriptionStatus] ?? subscriptionStatus
    : copy.inactive;
  const activePlanLabel = activePlan
    ? `${activePlan.displayName} · ${copy.intervalTabs[activePlan.interval]}`
    : data?.user.planName ?? copy.noActivePlan;

  return (
    <main className="flex-1 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  <CreditCard className="size-3.5" />
                  {copy.badge}
                </div>
                <h1 className="mt-4 text-2xl font-semibold text-gray-950">
                  {copy.title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                  {copy.intro}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full md:w-auto">
                <Link href={withDashboardLocale('/dashboard/credits', locale)}>
                  <Wallet className="size-4" />
                  {copy.buyExtra}
                </Link>
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <Gem className="size-3.5 text-indigo-500" />
                  {copy.balance}
                </div>
                <p className="mt-3 text-3xl font-semibold text-gray-950">
                  <AccountValue loading={isLoading}>
                    {data?.user.creditBalance ?? 0}
                  </AccountValue>
                </p>
                <p className="mt-1 text-xs text-gray-500">{copy.balanceHint}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <BadgeCheck className="size-3.5 text-emerald-500" />
                  {copy.currentPlan}
                </div>
                <p className="mt-3 truncate text-lg font-semibold text-gray-950">
                  <AccountValue loading={isLoading}>
                    {activePlanLabel}
                  </AccountValue>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {subscriptionStatusLabel}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <CalendarDays className="size-3.5 text-cyan-600" />
                  {copy.cadence}
                </div>
                <p className="mt-3 text-lg font-semibold text-gray-950">
                  <AccountValue loading={isLoading}>
                    {activePlan ? copy.intervalLabels[activePlan.interval] : copy.selectPlan}
                  </AccountValue>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {copy.cadenceHint}
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
                <h2 className="text-base font-semibold">{copy.mockTitle}</h2>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {copy.mockBody}
                </p>
              </div>
            </div>
            {checkoutState === 'mock_subscription_success' ? (
              <div className="mt-5 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                {copy.mockSuccess}
              </div>
            ) : null}
            {subscriptionState === 'mock_canceled' ? (
              <div className="mt-5 rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/75">
                {copy.mockCanceled}
              </div>
            ) : null}
            {error ? (
              <div className="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                {copy.loadError}
                <button
                  type="button"
                  onClick={() => void mutate()}
                  className="ml-2 font-semibold underline"
                >
                  {copy.retry}
                </button>
              </div>
            ) : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {data?.user.stripeCustomerId ? (
                <form action={customerPortalAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <Button type="submit" variant="secondary" className="w-full sm:w-auto">
                    {copy.manageBilling}
                  </Button>
                </form>
              ) : null}
              {hasActivePlan ? (
                <form action={cancelMockSubscriptionAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                  >
                    <RotateCcw className="size-4" />
                    {copy.cancelPlan}
                  </Button>
                </form>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-1 rounded-md bg-gray-100 p-1 sm:w-[320px]">
            {[
              { interval: 'month' as const, label: copy.intervalTabs.month },
              { interval: 'year' as const, label: copy.intervalTabs.year },
            ].map((tab) => (
              <button
                key={tab.interval}
                type="button"
                onClick={() => setSelectedInterval(tab.interval)}
                className={cn(
                  'inline-flex h-9 items-center justify-center rounded-md text-sm font-semibold transition',
                  selectedInterval === tab.interval
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-500 hover:text-gray-950'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="px-2 text-xs font-medium text-gray-500">
            {copy.intervalHint}
          </p>
        </div>

        <section className="grid gap-4 lg:grid-cols-3">
          {visiblePlans.map((plan) => {
            const current =
              hasActivePlan &&
              (activePlan?.key === plan.key || data?.user.planName === plan.name);
            const effectiveMonthly = getEffectiveMonthlyAmount(plan);
            const planCopy = copy.plans[plan.tier];

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
                      {copy.intervalLabels[plan.interval]}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-gray-950">
                      {plan.displayName}
                    </h2>
                  </div>
                  {plan.tier === 'plus' ? (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {copy.recommended}
                    </span>
                  ) : null}
                  {current ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {copy.current}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 min-h-12 text-sm leading-6 text-gray-600">
                  {planCopy.description}
                </p>

                <div className="mt-6">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-tight text-gray-950">
                      {formatCurrency(plan.unitAmount, plan.currency, locale)}
                    </span>
                    <span className="pb-1 text-sm font-medium text-gray-500">
                      / {copy.pricePeriod[plan.interval]}
                    </span>
                  </div>
                  {plan.interval === 'year' ? (
                    <p className="mt-2 text-sm text-gray-500">
                      {formatCurrency(effectiveMonthly, plan.currency, locale)} {copy.effectiveMonthly}
                      {plan.savePercent ? `, ${copy.save} ${plan.savePercent}%` : ''}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">{copy.switchLater}</p>
                  )}
                  <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                    {plan.monthlyCredits} {copy.creditsPerMonth}
                  </p>
                </div>

                <ul className="mt-6 grid gap-3 text-sm text-gray-700">
                  {planCopy.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <form action={checkoutAction} className="mt-auto pt-6">
                  <input type="hidden" name="priceId" value={plan.priceId} />
                  <input type="hidden" name="locale" value={locale} />
                  <SubmitButton
                    disabled={current}
                    label={current ? copy.currentButton : `${copy.choose} ${plan.displayName}`}
                    loadingLabel={copy.activating}
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
