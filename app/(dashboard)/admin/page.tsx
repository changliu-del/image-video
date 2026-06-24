import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/auth/session';
import { withDashboardLocale } from '@/lib/dashboard/locale-url';
import { AdminShell } from './components/admin-shell';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect(withDashboardLocale('/sign-in', 'en'));
  return <AdminShell />;
}
