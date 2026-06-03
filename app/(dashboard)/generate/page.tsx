import { redirect } from 'next/navigation';
import { firstDashboardParam, withDashboardLocale } from '@/lib/dashboard/locale-url';

type GeneratePageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function GeneratePage({ searchParams }: GeneratePageProps) {
  const params = await searchParams;
  redirect(withDashboardLocale('/create/video', firstDashboardParam(params?.locale)));
}
