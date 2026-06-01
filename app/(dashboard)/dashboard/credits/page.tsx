import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Check, Coins, ReceiptText } from 'lucide-react';
import { checkoutAction } from '@/lib/payments/actions';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { db } from '@/lib/db/drizzle';
import { creditLedger } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SubmitButton } from '../../pricing/submit-button';

export const dynamic = 'force-dynamic';

const creditPackages = [
  {
    key: 'starter',
    name: 'Starter Credits',
    credits: 50,
    fallbackPrice: 999,
    features: ['50 credits', '5 standard 5s videos', 'Good for product tests'],
  },
  {
    key: 'pro',
    name: 'Pro Credits',
    credits: 300,
    fallbackPrice: 3999,
    features: ['300 credits', 'Up to 30 standard 5s videos', 'Best for weekly campaigns'],
  },
  {
    key: 'business',
    name: 'Business Credits',
    credits: 1000,
    fallbackPrice: 9999,
    features: ['1000 credits', 'Up to 100 standard 5s videos', 'Built for SKU batches'],
  },
];

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default async function CreditsPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [prices, products, ledger] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
    db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.userId, user.id))
      .orderBy(desc(creditLedger.createdAt))
      .limit(12),
  ]);

  const packages = creditPackages.map((creditPackage) => {
    const product = products.find(
      (item) =>
        item.name.toLowerCase() === creditPackage.name.toLowerCase() ||
        item.name.toLowerCase().includes(creditPackage.key)
    );
    const price = prices.find(
      (item) =>
        !item.interval &&
        (item.productId === product?.id || item.credits === creditPackage.credits)
    );

    return {
      ...creditPackage,
      price: price?.unitAmount ?? creditPackage.fallbackPrice,
      priceId: price?.id,
    };
  });

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">Credits</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-950">
              Recharge platform credits
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Current balance: <span className="font-semibold text-gray-950">{user.creditBalance}</span>
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/billing">View monthly plans</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {packages.map((creditPackage) => (
            <Card key={creditPackage.key} className="rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="h-5 w-5 text-orange-600" />
                  {creditPackage.name}
                </CardTitle>
                <CardDescription>{creditPackage.credits} credits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6 text-4xl font-semibold text-gray-950">
                  ${(creditPackage.price / 100).toFixed(2)}
                </p>
                <ul className="mb-8 space-y-3">
                  {creditPackage.features.map((feature) => (
                    <li key={feature} className="flex items-start text-sm text-gray-700">
                      <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <form action={checkoutAction}>
                  <input type="hidden" name="priceId" value={creditPackage.priceId ?? ''} />
                  <SubmitButton disabled={!creditPackage.priceId} />
                </form>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="h-5 w-5 text-orange-600" />
              Credit ledger
            </CardTitle>
            <CardDescription>Latest balance changes for this account.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Delta</th>
                  <th className="py-2 pr-4">Balance</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-gray-500">
                      No credit activity yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3 pr-4">{entry.reason}</td>
                      <td className="py-3 pr-4 font-medium">
                        {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                      </td>
                      <td className="py-3 pr-4">{entry.balanceAfter}</td>
                      <td className="py-3">{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
