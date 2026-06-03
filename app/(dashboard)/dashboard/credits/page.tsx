import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import {
  ArrowUpRight,
  Check,
  Coins,
  CreditCard,
  Gem,
  ReceiptText,
  Wallet,
} from 'lucide-react';
import { checkoutAction } from '@/lib/payments/actions';
import { CREDIT_PACKAGES } from '@/lib/payments/catalog';
import { getStripePrices } from '@/lib/payments/stripe';
import { db } from '@/lib/db/drizzle';
import { creditLedger } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SubmitButton } from '../../pricing/submit-button';

export const dynamic = 'force-dynamic';

type StripePrice = Awaited<ReturnType<typeof getStripePrices>>[number];

function formatCurrency(amount: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function resolvePackagePrice(
  creditPackage: (typeof CREDIT_PACKAGES)[number],
  prices: StripePrice[]
) {
  const price = prices.find(
    (item) =>
      item.id === creditPackage.priceId ||
      (!item.interval && item.credits === creditPackage.credits)
  );

  return {
    unitAmount: price?.unitAmount ?? creditPackage.unitAmount,
    priceId: price?.id,
    currency: price?.currency ?? creditPackage.currency,
  };
}

function ledgerTone(reason: string) {
  if (reason === 'purchase' || reason === 'refund') return 'text-emerald-700 bg-emerald-50';
  if (reason === 'reserve') return 'text-amber-700 bg-amber-50';
  if (reason === 'capture') return 'text-gray-700 bg-gray-100';
  return 'text-indigo-700 bg-indigo-50';
}

export default async function CreditsPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [prices, ledger] = await Promise.all([
    getStripePrices(),
    db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.userId, user.id))
      .orderBy(desc(creditLedger.createdAt))
      .limit(12),
  ]);

  const packages = CREDIT_PACKAGES.map((creditPackage) => ({
    ...creditPackage,
    resolvedPrice: resolvePackagePrice(creditPackage, prices),
  }));

  return (
    <main className="flex-1 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                <Wallet className="size-3.5" />
                Credit wallet
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-gray-950">
                Buy extra credits when a campaign needs more room
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Top-up credits are separate from the subscription plan allowance.
                In this mock phase they are added immediately and remain in the
                same available balance used by generation jobs.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <Gem className="size-3.5 text-indigo-500" />
                  Available balance
                </div>
                <p className="mt-3 text-3xl font-semibold text-gray-950">
                  {user.creditBalance}
                </p>
                <p className="mt-1 text-xs text-gray-500">credits ready to spend</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                  <CreditCard className="size-3.5 text-cyan-600" />
                  Subscription
                </div>
                <p className="mt-3 truncate text-lg font-semibold text-gray-950">
                  {user.planName ?? 'No active plan'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {user.subscriptionStatus ?? 'subscription inactive'}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/dashboard/billing">
                <CreditCard className="size-4" />
                View subscription plans
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/create/video">
                Create a video
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {packages.map((creditPackage) => {
            const price = creditPackage.resolvedPrice;

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
                      Flexible
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-5 text-xl font-semibold text-gray-950">
                  {creditPackage.shortName}
                </h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-gray-600">
                  {creditPackage.description}
                </p>
                <div className="mt-5">
                  <p className="text-4xl font-semibold tracking-tight text-gray-950">
                    {formatCurrency(price.unitAmount, price.currency)}
                  </p>
                  <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700">
                    {creditPackage.credits} purchased credits
                  </p>
                </div>
                <ul className="mt-5 grid gap-3 text-sm text-gray-700">
                  {creditPackage.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <form action={checkoutAction} className="mt-auto pt-6">
                  <input type="hidden" name="priceId" value={price.priceId ?? ''} />
                  <SubmitButton
                    disabled={!price.priceId}
                    label={`Buy ${creditPackage.shortName}`}
                    loadingLabel="Adding credits..."
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
              <h2 className="text-base font-semibold text-gray-950">Credit ledger</h2>
              <p className="text-sm text-gray-500">Latest balance changes for this account.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Delta</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-gray-500">
                      No credit activity yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-5 py-4">
                        <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', ledgerTone(entry.reason))}>
                          {entry.reason}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-950">
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{entry.balanceAfter}</td>
                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(entry.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
