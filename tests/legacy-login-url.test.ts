import { describe, expect, it, vi } from 'vitest';

import { getLegacyLoginHref } from '../app/(login)/legacy-login-url';

vi.mock('@/lib/marketing/content', () => ({
  isLocale: (value: string) => ['pt', 'en'].includes(value),
}));

describe('getLegacyLoginHref', () => {
  it('normalizes invalid legacy locale params for sign-in redirects', () => {
    const href = getLegacyLoginHref('signin', {
      locale: 'zh',
      redirect: '/create/video?locale=zh',
    });

    expect(href).toBe(
      '/en/login?locale=en&redirect=%2Fcreate%2Fvideo%3Flocale%3Den'
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
