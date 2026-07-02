import { redirect } from 'next/navigation';
import { ProductAnalyticsPage } from '@/components/product-analytics/product-analytics-page';
import {
  isProductAnalyticsRank,
  productAnalyticsRankConfig,
} from '@/lib/product-analytics/catalog';
import { firstDashboardParam, withDashboardLocale } from '@/lib/dashboard/locale-url';

type AnalyticsRankPageProps = {
  params: Promise<{
    rank?: string;
  }>;
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function AnalyticsRankPage({
  params,
  searchParams,
}: AnalyticsRankPageProps) {
  const [{ rank }, query] = await Promise.all([params, searchParams]);

  if (!isProductAnalyticsRank(rank)) {
    redirect(
      withDashboardLocale(
        productAnalyticsRankConfig.sales.path,
        firstDashboardParam(query?.locale)
      )
    );
  }

  return <ProductAnalyticsPage initialRank={rank} />;
}
