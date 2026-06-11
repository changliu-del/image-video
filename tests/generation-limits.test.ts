import { describe, expect, it } from 'vitest';

import {
  getGenerationLimitConfig,
  getGenerationLimitViolation,
} from '../lib/generations/limits';

describe('generation limits', () => {
  it('defaults to no active concurrency cap', () => {
    expect(getGenerationLimitConfig({})).toEqual({
      dailyLimit: 100,
      activeConcurrencyLimit: null,
      freeQuotaLimit: 3,
    });
  });

  it('allows multiple active generations when no active cap is configured', () => {
    expect(
      getGenerationLimitViolation(
        {
          activeCount: 10,
          dailyCount: 10,
          totalCount: 10,
          creditBalance: 0,
          hasPurchasedCredits: true,
        },
        {
          dailyLimit: 100,
          activeConcurrencyLimit: null,
          freeQuotaLimit: 3,
        }
      )
    ).toBeNull();
  });

  it('blocks active concurrency before reserving more credits when configured', () => {
    const violation = getGenerationLimitViolation(
      {
        activeCount: 1,
        dailyCount: 0,
        totalCount: 0,
        creditBalance: 0,
        hasPurchasedCredits: true,
      },
      {
        dailyLimit: 100,
        activeConcurrencyLimit: 1,
        freeQuotaLimit: 3,
      }
    );

    expect(violation?.code).toBe('active_generation_limit_exceeded');
    expect(violation?.status).toBe(429);
  });

  it('blocks zero-balance free users after the free quota while allowing funded users', () => {
    const config = {
      dailyLimit: 100,
      activeConcurrencyLimit: 2,
      freeQuotaLimit: 3,
    };

    expect(
      getGenerationLimitViolation(
        {
          activeCount: 0,
          dailyCount: 3,
          totalCount: 3,
          creditBalance: 0,
          hasPurchasedCredits: false,
        },
        config
      )?.code
    ).toBe('free_generation_quota_exceeded');

    expect(
      getGenerationLimitViolation(
        {
          activeCount: 0,
          dailyCount: 3,
          totalCount: 3,
          creditBalance: 0,
          hasPurchasedCredits: true,
        },
        config
      )
    ).toBeNull();

    expect(
      getGenerationLimitViolation(
        {
          activeCount: 0,
          dailyCount: 3,
          totalCount: 3,
          creditBalance: 10,
          hasPurchasedCredits: false,
        },
        config
      )
    ).toBeNull();
  });

  it('blocks all users at the daily generation limit', () => {
    const violation = getGenerationLimitViolation(
      {
        activeCount: 0,
        dailyCount: 10,
        totalCount: 10,
        creditBalance: 100,
        hasPurchasedCredits: true,
      },
      {
        dailyLimit: 10,
        activeConcurrencyLimit: 2,
        freeQuotaLimit: 3,
      }
    );

    expect(violation?.code).toBe('daily_generation_limit_exceeded');
    expect(violation?.status).toBe(429);
  });
});
