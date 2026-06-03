import { redirect } from 'next/navigation';
import { firstDashboardParam, withDashboardLocale } from '@/lib/dashboard/locale-url';

type PricingPageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  redirect(withDashboardLocale('/dashboard/billing', firstDashboardParam(params?.locale)));
}
