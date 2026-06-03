'use client';

import { useSearchParams } from 'next/navigation';
import {
  normalizeDashboardLocale,
  type DashboardLocale,
} from '@/lib/dashboard/content';
export { withDashboardLocale } from '@/lib/dashboard/locale-url';

export function useDashboardLocale(): DashboardLocale {
  const searchParams = useSearchParams();
  return normalizeDashboardLocale(searchParams.get('locale'));
}
