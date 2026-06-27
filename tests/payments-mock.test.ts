import { describe, expect, it } from 'vitest';

import {
  MOCK_CREDIT_PACKAGES,
  MOCK_MONTHLY_PLANS,
  MOCK_SUBSCRIPTION_PLANS,
  getMockCreditPackageByPriceId,
  getMockMonthlyPlanByPriceId,
  getMockSubscriptionPlanByPriceId,
  getMockStripePrices,
  getMockStripeProducts,
  isPaymentMockEnabled,
} from '../lib/payments/mock';
import {
  BILLING_CURRENCY,
  CREDIT_UNIT_AMOUNT,
  getAmountForCredits,
  getCreditsForAmount,
} from '../lib/payments/pricing';

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
      MOCK_CREDIT_PACKAGES.length + MOCK_SUBSCRIPTION_PLANS.length
    );
    expect(products).toHaveLength(
      MOCK_CREDIT_PACKAGES.length + MOCK_SUBSCRIPTION_PLANS.length
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

    for (const plan of MOCK_SUBSCRIPTION_PLANS) {
      expect(getMockSubscriptionPlanByPriceId(plan.priceId)).toEqual(plan);
      expect(prices).toContainEqual(
        expect.objectContaining({
          id: plan.priceId,
          productId: plan.productId,
          credits: plan.credits,
          unitAmount: plan.unitAmount,
          interval: plan.interval,
        })
      );
      expect(products).toContainEqual(
        expect.objectContaining({
          id: plan.productId,
          defaultPriceId: plan.priceId,
        })
      );
    }

    for (const plan of MOCK_MONTHLY_PLANS) {
      expect(getMockMonthlyPlanByPriceId(plan.priceId)).toEqual(plan);
    }
  });

  it('keeps Brazilian credit packages on the exact R$0.10 credit conversion', () => {
    expect(CREDIT_UNIT_AMOUNT).toBe(10);

    for (const creditPackage of MOCK_CREDIT_PACKAGES) {
      expect(creditPackage.currency).toBe(BILLING_CURRENCY);
      expect(creditPackage.unitAmount).toBe(
        getAmountForCredits(creditPackage.credits)
      );
      expect(getCreditsForAmount(creditPackage.unitAmount)).toBe(
        creditPackage.credits
      );
    }
  });

  it('uses tiered monthly subscription credit pricing', () => {
    expect(
      MOCK_MONTHLY_PLANS.map((plan) => ({
        tier: plan.tier,
        credits: plan.monthlyCredits,
        unitAmount: plan.unitAmount,
      }))
    ).toEqual([
      { tier: 'basic', credits: 480, unitAmount: getAmountForCredits(480) },
      { tier: 'plus', credits: 2000, unitAmount: 16000 },
      { tier: 'pro', credits: 6200, unitAmount: 37200 },
    ]);

    for (const plan of MOCK_SUBSCRIPTION_PLANS) {
      expect(plan.currency).toBe(BILLING_CURRENCY);
      if (plan.interval === 'year') {
        const monthlyPlan = MOCK_MONTHLY_PLANS.find(
          (monthly) => monthly.tier === plan.tier
        );

        expect(monthlyPlan).toBeDefined();
        expect(plan.unitAmount).toBe(monthlyPlan!.unitAmount * 12);
      }
    }
  });
});
