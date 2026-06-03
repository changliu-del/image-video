import { redirect } from 'next/navigation';
import { firstDashboardParam, withDashboardLocale } from '@/lib/dashboard/locale-url';

type CreatePageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function CreatePage({ searchParams }: CreatePageProps) {
  const params = await searchParams;
  redirect(withDashboardLocale('/create/video', firstDashboardParam(params?.locale)));
}
