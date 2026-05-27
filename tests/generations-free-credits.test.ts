import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SIGNUP_FREE_CREDITS,
  SIGNUP_FREE_CREDITS_ENV,
  getSignupFreeCreditsAmount,
} from '../lib/generations/free-credits';

describe('getSignupFreeCreditsAmount', () => {
  it('defaults to enough credits for three 5s generations', () => {
    expect(getSignupFreeCreditsAmount({})).toBe(DEFAULT_SIGNUP_FREE_CREDITS);
    expect(DEFAULT_SIGNUP_FREE_CREDITS).toBe(30);
  });

  it('uses a positive integer env override', () => {
    expect(
      getSignupFreeCreditsAmount({
        [SIGNUP_FREE_CREDITS_ENV]: '45',
      })
    ).toBe(45);
  });

  it('falls back for invalid env overrides', () => {
    expect(
      getSignupFreeCreditsAmount({
        [SIGNUP_FREE_CREDITS_ENV]: '0',
      })
    ).toBe(DEFAULT_SIGNUP_FREE_CREDITS);
  });
});
