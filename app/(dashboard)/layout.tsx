import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/auth/session';
import {
  DashboardHeader,
  type DashboardHeaderUser,
} from './dashboard-header';
import { AppShell } from './app-shell';

export const dynamic = 'force-dynamic';

function toHeaderUser(userId: number) {
  return {
    id: userId,
  } satisfies DashboardHeaderUser;
}

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const userId = await getSessionUserId();
  const templateAdminUrl = process.env.TEMPLATE_ADMIN_URL ?? null;

  if (!userId) {
    redirect('/sign-in');
  }

  const headerUser = toHeaderUser(userId);

  return (
    <section className="flex flex-col min-h-screen">
      <DashboardHeader
        user={headerUser}
        templateAdminUrl={templateAdminUrl}
      />
      <AppShell user={null} templateAdminUrl={templateAdminUrl}>
        {children}
      </AppShell>
    </section>
  );
}
