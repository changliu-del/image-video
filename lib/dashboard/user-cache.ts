'use client';

import { mutate } from 'swr';

export const DASHBOARD_USER_CACHE_KEY = '/api/user';

export function refreshDashboardUser() {
  return mutate(DASHBOARD_USER_CACHE_KEY);
}
