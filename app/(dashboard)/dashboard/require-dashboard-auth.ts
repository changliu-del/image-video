import { redirect } from 'next/navigation';

import { getSessionUserId } from '@/lib/auth/session';
import { withDashboardLocale } from '@/lib/dashboard/locale-url';

export async function requireDashboardAuth() {
  const userId = await getSessionUserId();

  if (!userId) {
    redirect(withDashboardLocale('/sign-in', 'pt'));
  }

  return userId;
}
