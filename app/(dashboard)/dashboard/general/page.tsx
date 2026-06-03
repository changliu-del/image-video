import { redirect } from 'next/navigation';
import { firstDashboardParam, withDashboardLocale } from '@/lib/dashboard/locale-url';

type GeneralPageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function GeneralPage({ searchParams }: GeneralPageProps) {
  const params = await searchParams;
  redirect(withDashboardLocale('/dashboard/profile', firstDashboardParam(params?.locale)));
}
