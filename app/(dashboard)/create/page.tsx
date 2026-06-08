import { WorkbenchHome } from '@/components/create/workbench-home';
import { normalizeDashboardLocale } from '@/lib/dashboard/content';
import { firstDashboardParam } from '@/lib/dashboard/locale-url';

type CreatePageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  const locale = normalizeDashboardLocale(firstDashboardParam(params?.locale));

  return <WorkbenchHome locale={locale} />;
}
