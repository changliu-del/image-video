import { checkoutAction } from '@/lib/payments/actions';
import { Check, Coins } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

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

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const packages = creditPackages.map((creditPackage) => {
    const product = products.find(
      (item) =>
        item.name.toLowerCase() === creditPackage.name.toLowerCase() ||
        item.name.toLowerCase().includes(creditPackage.key)
    );
    const price = prices.find(
      (item) =>
        item.productId === product?.id ||
        item.credits === creditPackage.credits
    );

    return {
      ...creditPackage,
      price: price?.unitAmount ?? creditPackage.fallbackPrice,
      priceId: price?.id,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 md:grid-cols-3">
        {packages.map((creditPackage) => (
          <PricingCard
            key={creditPackage.key}
            name={creditPackage.name}
            credits={creditPackage.credits}
            price={creditPackage.price}
            features={creditPackage.features}
            priceId={creditPackage.priceId}
          />
        ))}
      </div>
    </main>
  );
}

function PricingCard({
  name,
  credits,
  price,
  features,
  priceId,
}: {
  name: string;
  credits: number;
  price: number;
  features: string[];
  priceId?: string;
}) {
  return (
    <div className="pt-6">
      <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Coins className="size-5" />
      </div>
      <h2 className="mb-2 text-2xl font-medium text-gray-900">{name}</h2>
      <p className="mb-4 text-sm text-gray-600">{credits} platform credits</p>
      <p className="mb-6 text-4xl font-medium text-gray-900">
        ${(price / 100).toFixed(2)}
      </p>
      <ul className="mb-8 space-y-4">
        {features.map((feature) => (
          <li key={feature} className="flex items-start">
            <Check className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId ?? ''} />
        <SubmitButton disabled={!priceId} />
      </form>
    </div>
  );
}
