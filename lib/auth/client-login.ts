import type { DashboardLocale } from '@/lib/dashboard/content';
import { withDashboardLocale } from '@/lib/dashboard/locale-url';

export class AuthenticationRequiredError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'AuthenticationRequiredError';
  }
}

export function isAuthenticationRequiredError(
  error: unknown
): error is AuthenticationRequiredError {
  return error instanceof AuthenticationRequiredError;
}

export function signInHrefForCurrentPage(locale: DashboardLocale) {
  if (typeof window === 'undefined') {
    return withDashboardLocale('/sign-in', locale);
  }

  const redirect = `${window.location.pathname}${window.location.search}`;
  const query = new URLSearchParams({ redirect });
  return withDashboardLocale(`/sign-in?${query.toString()}`, locale);
}

export function redirectToSignIn(locale: DashboardLocale) {
  window.location.assign(signInHrefForCurrentPage(locale));
}
