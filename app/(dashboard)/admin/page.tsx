import { redirect } from 'next/navigation';
import { getUser, hasAdminAccess, hasOpsAccess } from '@/lib/db/queries';
import { getAdminContent } from '@/lib/admin/content';
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
  const content = getAdminContent(locale);
  const user = await getUser();
  if (!user) redirect(withDashboardLocale('/sign-in', locale));
  if (!hasOpsAccess(user)) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-950">
          {content.shell.forbiddenTitle}
        </h1>
        <p className="mt-2 text-gray-600">
          {content.shell.forbiddenDescription}
        </p>
      </main>
    );
  }
  return <AdminShell canManageUsers={hasAdminAccess(user)} />;
}
