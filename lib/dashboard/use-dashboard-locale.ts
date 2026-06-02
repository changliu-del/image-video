'use client';

import { useSearchParams } from 'next/navigation';
import {
  normalizeDashboardLocale,
  type DashboardLocale,
} from '@/lib/dashboard/content';

export function useDashboardLocale(): DashboardLocale {
  const searchParams = useSearchParams();
  return normalizeDashboardLocale(searchParams.get('locale'));
}

export function withDashboardLocale(href: string, locale: DashboardLocale) {
  if (
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:') ||
    href.startsWith('#')
  ) {
    return href;
  }

  const [pathname, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('locale', locale);
  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
