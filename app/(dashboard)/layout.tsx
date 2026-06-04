import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { getCachedUser } from '@/lib/db/queries';
import {
  DashboardHeader,
  type DashboardHeaderUser,
} from './dashboard-header';
import { AppShell } from './app-shell';

function toHeaderUser(user: Awaited<ReturnType<typeof getCachedUser>>) {
  if (!user) return null;

  const userId = user?.id;

  if (typeof userId !== 'number') return null;

  return {
    id: userId,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    role: user.role,
    creditBalance: user.creditBalance,
    planName: user.planName,
    subscriptionStatus: user.subscriptionStatus,
  } satisfies DashboardHeaderUser;
}

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCachedUser();
  const headerUser = toHeaderUser(user);
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
