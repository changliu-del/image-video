import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import {
  DashboardHeader,
  type DashboardHeaderUser,
} from './dashboard-header';
import { AppShell } from './app-shell';

function toHeaderUser(session: Awaited<ReturnType<typeof getSession>>) {
  const userId = session?.user?.id;

  if (typeof userId !== 'number') return null;

  return {
    id: userId,
  } satisfies DashboardHeaderUser;
}

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const headerUser = toHeaderUser(session);
  const templateAdminUrl = process.env.TEMPLATE_ADMIN_URL ?? null;

  if (!headerUser) {
    redirect('/sign-in');
  }

  return (
    <section className="flex flex-col min-h-screen">
      <DashboardHeader
        user={headerUser}
        templateAdminUrl={templateAdminUrl}
      />
      <AppShell user={headerUser} templateAdminUrl={templateAdminUrl}>
        {children}
      </AppShell>
    </section>
  );
}
