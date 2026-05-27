import { describe, expect, it } from 'vitest';

import {
  getGenerationLimitConfig,
  getGenerationLimitViolation,
} from '../lib/generations/limits';

describe('generation limits', () => {
  it('uses conservative defaults that allow one active generation', () => {
    expect(getGenerationLimitConfig({})).toEqual({
      dailyLimit: 100,
      activeConcurrencyLimit: 1,
      freeQuotaLimit: 3,
    });
  });

  it('blocks active concurrency before reserving more credits', () => {
    const violation = getGenerationLimitViolation(
      {
        activeCount: 1,
        dailyCount: 0,
        totalCount: 0,
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

  it('blocks unpaid users after the free quota while allowing paid users', () => {
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
          hasPurchasedCredits: true,
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
