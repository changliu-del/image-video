'use client';

import Link from 'next/link';
import useSWR from 'swr';
import {
  ArrowUpRight,
  Check,
  Coins,
  Gem,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { checkoutAction } from '@/lib/payments/actions';
import { CREDIT_PACKAGES } from '@/lib/payments/catalog';
import {
  BILLING_CURRENCY,
  DIRECT_TOP_UP_CREDITS_PER_UNIT,
  DIRECT_TOP_UP_UNIT_AMOUNT,
} from '@/lib/payments/pricing';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SubmitButton } from '@/app/(dashboard)/pricing/submit-button';
import { useDashboardLocale, withDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { creditsCopy } from '@/components/dashboard/account-copy';

type CreditLedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
};

type CreditsAccount = {
  user: {
    creditBalance: number;
  };
  ledger: CreditLedgerEntry[];
};

type CreditsClientProps = {
  embedded?: boolean;
};

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error('Failed to load credit account');
  }
  return response.json() as Promise<CreditsAccount>;
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

function formatDate(value: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function ledgerTone(reason: string) {
  if (reason === 'purchase' || reason === 'refund') return 'text-emerald-700 bg-emerald-50';
  if (reason === 'reserve') return 'text-amber-700 bg-amber-50';
  if (reason === 'capture') return 'text-gray-700 bg-gray-100';
  return 'text-indigo-700 bg-indigo-50';
}

function BalanceValue({
  loading,
  value,
}: {
  loading: boolean;
  value: React.ReactNode;
}) {
  if (loading) {
    return <span className="inline-block h-8 w-20 animate-pulse rounded bg-gray-200" />;
  }

  return <>{value}</>;
}

export function CreditsClient({ embedded = false }: CreditsClientProps = {}) {
  const locale = useDashboardLocale();
  const copy = creditsCopy[locale];
  const { data, error, isLoading, mutate } = useSWR('/api/account/credits', fetcher, {
    revalidateOnFocus: false,
  });
  const ledger = data?.ledger ?? [];
  const Title = embedded ? 'h2' : 'h1';

  const content = (
    <>
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Wallet className="size-3.5" />
                {copy.badge}
              </div>
              <Title className="mt-4 text-2xl font-semibold text-gray-950">
                {copy.title}
              </Title>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                {copy.intro}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <Gem className="size-3.5 text-indigo-500" />
                  {copy.balance}
                </div>
                <p className="mt-3 text-3xl font-semibold text-gray-950">
                  <BalanceValue loading={isLoading} value={data?.user.creditBalance ?? 0} />
                </p>
                <p className="mt-1 text-xs text-gray-500">{copy.balanceHint}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <Coins className="size-3.5 text-cyan-600" />
                  {copy.topUpRate}
                </div>
                <p className="mt-3 text-lg font-semibold text-gray-950">
                  {formatCurrency(
                    DIRECT_TOP_UP_UNIT_AMOUNT,
                    BILLING_CURRENCY,
                    locale
                  )}{' '}
                  = {DIRECT_TOP_UP_CREDITS_PER_UNIT} {copy.purchasedCredits}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {copy.rateHint}
                </p>
              </div>
            </div>
          </div>
          {error ? (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="ghost">
              <Link
                href={withDashboardLocale('/create/video', locale)}
                prefetch={false}
              >
                {copy.createVideo}
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {CREDIT_PACKAGES.map((creditPackage) => {
            const packageCopy = copy.packages[creditPackage.key] ?? {
              description: creditPackage.description,
              features: creditPackage.features,
            };

            return (
              <div
                key={creditPackage.key}
                className={cn(
                  'flex min-h-[360px] flex-col rounded-lg border bg-white p-5 shadow-sm',
                  creditPackage.key === 'creator'
                    ? 'border-indigo-200 shadow-indigo-100'
                    : 'border-gray-200'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-gray-950 text-white">
                    <Coins className="size-5" />
                  </div>
                  {creditPackage.key === 'creator' ? (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {copy.flexible}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-5 text-xl font-semibold text-gray-950">
                  {creditPackage.shortName}
                </h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-gray-600">
                  {packageCopy.description}
                </p>
                <div className="mt-5">
                  <p className="text-4xl font-semibold tracking-tight text-gray-950">
                    {formatCurrency(
                      creditPackage.unitAmount,
                      creditPackage.currency,
                      locale
                    )}
                  </p>
                  <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                    {creditPackage.credits} {copy.purchasedCredits}
                  </p>
                </div>
                <ul className="mt-5 grid gap-3 text-sm text-gray-700">
                  {packageCopy.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <form action={checkoutAction} className="mt-auto pt-6">
                  <input type="hidden" name="priceId" value={creditPackage.priceId} />
                  <input type="hidden" name="locale" value={locale} />
                  <SubmitButton
                    label={`${copy.buy} ${creditPackage.shortName}`}
                    loadingLabel={copy.adding}
                  />
                </form>
              </div>
            );
          })}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
            <ReceiptText className="size-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-950">{copy.ledgerTitle}</h2>
              <p className="text-sm text-gray-500">{copy.ledgerSubtitle}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">{copy.ledgerColumns.reason}</th>
                  <th className="px-5 py-3">{copy.ledgerColumns.delta}</th>
                  <th className="px-5 py-3">{copy.ledgerColumns.balance}</th>
                  <th className="px-5 py-3">{copy.ledgerColumns.created}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-5 py-4">
                        <span className="inline-block h-6 w-20 animate-pulse rounded-full bg-gray-100" />
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block h-5 w-12 animate-pulse rounded bg-gray-100" />
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block h-5 w-12 animate-pulse rounded bg-gray-100" />
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block h-5 w-36 animate-pulse rounded bg-gray-100" />
                      </td>
                    </tr>
                  ))
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-gray-500">
                      {copy.emptyLedger}
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-5 py-4">
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', ledgerTone(entry.reason))}>
                          {copy.reasons[entry.reason] ?? entry.reason}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-950">
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{entry.balanceAfter}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(entry.createdAt, locale)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
    </>
  );

  if (embedded) {
    return (
      <div id="credits" className="space-y-6">
        {content}
      </div>
    );
  }

  return (
    <main className="flex-1 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">{content}</div>
    </main>
  );
}
