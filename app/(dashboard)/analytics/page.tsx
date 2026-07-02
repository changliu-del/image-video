import { redirect } from 'next/navigation';
import { firstDashboardParam, withDashboardLocale } from '@/lib/dashboard/locale-url';
import { productAnalyticsRankConfig } from '@/lib/product-analytics/catalog';

type AnalyticsPageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const params = await searchParams;
  redirect(
    withDashboardLocale(
      productAnalyticsRankConfig.sales.path,
      firstDashboardParam(params?.locale)
    )
  );
}
