import { describe, expect, it, vi } from 'vitest';

import { getLegacyLoginHref } from '../app/(login)/legacy-login-url';

vi.mock('@/lib/marketing/content', () => ({
  isLocale: (value: string) => ['pt', 'en', 'zh'].includes(value),
}));

describe('getLegacyLoginHref', () => {
  it('uses the locale search param for legacy sign-in redirects', () => {
    const href = getLegacyLoginHref('signin', {
      locale: 'zh',
      redirect: '/create/video?locale=zh',
    });

    expect(href).toBe(
      '/zh/login?locale=zh&redirect=%2Fcreate%2Fvideo%3Flocale%3Dzh'
    );
  });

  it('keeps sign-up mode while dropping legacy invite params', () => {
    const href = getLegacyLoginHref('signup', {
      locale: 'en',
      invite: 'invite-123',
    });

    expect(href).toBe('/en/login?locale=en&mode=signup');
  });
});
