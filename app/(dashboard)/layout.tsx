import type { ReactNode } from 'react';
import { getUser } from '@/lib/db/queries';
import {
  DashboardHeader,
  type DashboardHeaderUser,
} from './dashboard-header';

function toHeaderUser(user: Awaited<ReturnType<typeof getUser>>) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    role: user.role,
  } satisfies DashboardHeaderUser;
}

export default async function Layout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUser();

  return (
    <section className="flex flex-col min-h-screen">
      <DashboardHeader
        user={toHeaderUser(user)}
        templateAdminUrl={process.env.TEMPLATE_ADMIN_URL ?? null}
      />
      {children}
    </section>
  );
}
