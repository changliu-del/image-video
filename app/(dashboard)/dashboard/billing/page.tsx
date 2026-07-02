import { BillingClient } from '@/components/dashboard/billing-client';
import { normalizeSubscriptionInterval } from '@/lib/payments/catalog';

type BillingPageProps = {
  searchParams?: Promise<{
    interval?: string | string[];
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams;

  return (
    <BillingClient
      initialInterval={getInitialBillingInterval(params?.interval)}
    />
  );
}

function getInitialBillingInterval(value: string | string[] | undefined) {
  return normalizeSubscriptionInterval(firstParam(value));
}
