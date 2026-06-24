import { isLocale, type Locale } from '@/lib/marketing/content';

export type LegacyLoginSearchParams = Record<
  string,
  string | string[] | undefined
>;

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSearchLocale(searchParams: LegacyLoginSearchParams) {
  const locale = getFirstParam(searchParams.locale);
  return locale && isLocale(locale) ? locale : null;
}

function normalizeInternalRedirect(value: string, locale: Locale) {
  try {
    const url = new URL(value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid') return value;
    if (url.searchParams.has('locale')) {
      url.searchParams.set('locale', locale);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return value;
  }
}

export function getLegacyLoginHref(
  mode: 'signin' | 'signup',
  searchParams: LegacyLoginSearchParams,
  locale: Locale = 'en'
) {
  const params = new URLSearchParams();
  const resolvedLocale = getSearchLocale(searchParams) ?? locale;
  const ignoredParams = new Set(['invite', 'inviteId', 'inviteCode']);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (ignoredParams.has(key)) {
      return;
    }

    if (typeof value === 'string') {
      params.set(
        key,
        key === 'redirect'
          ? normalizeInternalRedirect(value, resolvedLocale)
          : value
      );
      return;
    }

    value?.forEach((item) =>
      params.append(
        key,
        key === 'redirect'
          ? normalizeInternalRedirect(item, resolvedLocale)
          : item
      )
    );
  });
  params.set('locale', resolvedLocale);

  if (mode === 'signup') {
    params.set('mode', 'signup');
  } else {
    params.delete('mode');
  }

  const query = params.toString();
  return `/${resolvedLocale}/login${query ? `?${query}` : ''}`;
}
