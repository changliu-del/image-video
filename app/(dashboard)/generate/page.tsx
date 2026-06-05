import { redirect } from 'next/navigation';
import { firstDashboardParam, withDashboardLocale } from '@/lib/dashboard/locale-url';

type GeneratePageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
    templateId?: string | string[];
  }>;
};

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const params = await searchParams;
  const templateId = firstDashboardParam(params?.templateId);
  const path = templateId
    ? `/create/video?templateId=${encodeURIComponent(templateId)}`
    : '/create/video';
  redirect(withDashboardLocale(path, firstDashboardParam(params?.locale)));
}
