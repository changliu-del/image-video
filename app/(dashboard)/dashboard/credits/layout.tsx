import type { ReactNode } from 'react';

import { requireDashboardAuth } from '../require-dashboard-auth';

export default async function CreditsLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireDashboardAuth();
  return children;
}
