import type { Locale } from '@/lib/marketing/content';

export type LegacyLoginSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function getLegacyLoginHref(
  mode: 'signin' | 'signup',
  searchParams: LegacyLoginSearchParams,
  locale: Locale = 'pt'
) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      params.set(key, value);
      return;
    }

    value?.forEach((item) => params.append(key, item));
  });

  if (mode === 'signup') {
    params.set('mode', 'signup');
  } else {
    params.delete('mode');
  }

  const query = params.toString();
  return `/${locale}/login${query ? `?${query}` : ''}`;
}
