import { getCreditPackageByPriceId } from './catalog';

type EnvMap = Record<string, string | undefined>;

const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off']);

function normalizeCheckoutLocale(locale: string | null | undefined) {
  return locale === 'pt' || locale === 'en' ? locale : 'en';
}

function withCheckoutLocale(href: string, locale: string | null | undefined) {
  const [pathname, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('locale', normalizeCheckoutLocale(locale));
  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

export function isPaymentCheckoutEnabled(env: EnvMap = process.env) {
  const explicitValue = env.PAYMENTS_CHECKOUT_ENABLED?.trim().toLowerCase();

  if (!explicitValue) {
    return false;
  }

  if (ENABLED_VALUES.has(explicitValue)) {
    return true;
  }

  if (DISABLED_VALUES.has(explicitValue)) {
    return false;
  }

  return false;
}

export function getPaymentCheckoutDisabledRedirect(
  priceId: string | null | undefined,
  locale?: string | null
) {
  const normalizedPriceId = priceId?.trim() ?? '';
  const isCreditTopUp = Boolean(getCreditPackageByPriceId(normalizedPriceId));
  const disabledPath = isCreditTopUp
    ? '/dashboard/profile?checkout=payments_disabled'
    : '/dashboard/billing?checkout=payments_disabled';

  return withCheckoutLocale(disabledPath, locale);
}
