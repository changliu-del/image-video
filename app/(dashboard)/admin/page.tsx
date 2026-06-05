import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/auth/session';
import {
  firstDashboardParam,
  withDashboardLocale,
} from '@/lib/dashboard/locale-url';
import { AdminShell } from './components/admin-shell';

export const dynamic = 'force-dynamic';

type AdminPageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const locale = firstDashboardParam(params?.locale);
  const userId = await getSessionUserId();
  if (!userId) redirect(withDashboardLocale('/sign-in', locale));
  return <AdminShell />;
}
