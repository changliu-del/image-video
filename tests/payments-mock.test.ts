import { describe, expect, it } from 'vitest';

import {
  MOCK_CREDIT_PACKAGES,
  MOCK_MONTHLY_PLANS,
  getMockCreditPackageByPriceId,
  getMockMonthlyPlanByPriceId,
  getMockStripePrices,
  getMockStripeProducts,
  isPaymentMockEnabled,
} from '../lib/payments/mock';

describe('payment mock mode', () => {
  it('defaults to enabled outside production', () => {
    expect(isPaymentMockEnabled({})).toBe(true);
    expect(isPaymentMockEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(isPaymentMockEnabled({ NODE_ENV: 'test' })).toBe(true);
    expect(isPaymentMockEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('allows an explicit env override', () => {
    expect(
      isPaymentMockEnabled({
        NODE_ENV: 'production',
        PAYMENTS_MOCK: 'true',
      })
    ).toBe(true);
    expect(
      isPaymentMockEnabled({
        NODE_ENV: 'development',
        PAYMENTS_MOCK: 'false',
      })
    ).toBe(false);
  });

  it('maps mock prices and products to credit packages', () => {
    const prices = getMockStripePrices();
    const products = getMockStripeProducts();

    expect(prices).toHaveLength(
      MOCK_CREDIT_PACKAGES.length + MOCK_MONTHLY_PLANS.length
    );
    expect(products).toHaveLength(
      MOCK_CREDIT_PACKAGES.length + MOCK_MONTHLY_PLANS.length
    );

    for (const creditPackage of MOCK_CREDIT_PACKAGES) {
      expect(getMockCreditPackageByPriceId(creditPackage.priceId)).toEqual(
        creditPackage
      );
      expect(prices).toContainEqual(
        expect.objectContaining({
          id: creditPackage.priceId,
          productId: creditPackage.productId,
          credits: creditPackage.credits,
          unitAmount: creditPackage.unitAmount,
        })
      );
      expect(products).toContainEqual(
        expect.objectContaining({
          id: creditPackage.productId,
          defaultPriceId: creditPackage.priceId,
        })
      );
    }

    for (const plan of MOCK_MONTHLY_PLANS) {
      expect(getMockMonthlyPlanByPriceId(plan.priceId)).toEqual(plan);
      expect(prices).toContainEqual(
        expect.objectContaining({
          id: plan.priceId,
          productId: plan.productId,
          credits: plan.credits,
          unitAmount: plan.unitAmount,
          interval: 'month',
        })
      );
      expect(products).toContainEqual(
        expect.objectContaining({
          id: plan.productId,
          defaultPriceId: plan.priceId,
        })
      );
    }
  });
});
