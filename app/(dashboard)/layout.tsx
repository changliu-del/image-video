import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import {
  DashboardHeader,
} from './dashboard-header';
import { AppShell } from './app-shell';

export const dynamic = 'force-dynamic';

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const sessionCookie = (await cookies()).get('session');
  const templateAdminUrl = process.env.TEMPLATE_ADMIN_URL ?? null;

  return (
    <section className="flex flex-col min-h-screen">
      <DashboardHeader
        user={null}
        shouldLoadUser={Boolean(sessionCookie)}
        templateAdminUrl={templateAdminUrl}
      />
      <AppShell user={null} templateAdminUrl={templateAdminUrl}>
        {children}
      </AppShell>
    </section>
  );
}
