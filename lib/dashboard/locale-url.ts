import {
  normalizeDashboardLocale,
  type DashboardLocale,
} from '@/lib/dashboard/content';

export function firstDashboardParam(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function withDashboardLocale(href: string, locale: DashboardLocale | string | null | undefined) {
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
  params.set('locale', normalizeDashboardLocale(locale));
  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
