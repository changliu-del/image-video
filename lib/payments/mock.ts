import {
  CREDIT_PACKAGES,
  MONTHLY_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLANS,
  type CreditPackage,
  type SubscriptionPlan,
  getCreditPackageByPriceId,
  getSubscriptionPlanByPriceId,
} from './catalog';

type EnvMap = Record<string, string | undefined>;

export type MockCreditPackage = CreditPackage;
export type MockSubscriptionPlan = SubscriptionPlan;
export type MockMonthlyPlan = SubscriptionPlan & { interval: 'month' };

export const MOCK_CREDIT_PACKAGES: MockCreditPackage[] = CREDIT_PACKAGES;
export const MOCK_SUBSCRIPTION_PLANS: MockSubscriptionPlan[] = SUBSCRIPTION_PLANS;
export const MOCK_MONTHLY_PLANS: MockMonthlyPlan[] = MONTHLY_SUBSCRIPTION_PLANS;

export function isPaymentMockEnabled(env: EnvMap = process.env) {
  const explicitValue = env.PAYMENTS_MOCK?.trim().toLowerCase();

  if (explicitValue) {
    return ['1', 'true', 'yes', 'on'].includes(explicitValue);
  }

  return env.NODE_ENV !== 'production';
}

export function getMockCreditPackageByPriceId(priceId: string) {
  return getCreditPackageByPriceId(priceId);
}

export function getMockSubscriptionPlanByPriceId(priceId: string) {
  return getSubscriptionPlanByPriceId(priceId);
}

export function getMockMonthlyPlanByPriceId(priceId: string) {
  const plan = getSubscriptionPlanByPriceId(priceId);
  return plan?.interval === 'month' ? plan : null;
}

export function getMockStripePrices() {
  return [
    ...MOCK_CREDIT_PACKAGES.map((creditPackage) => ({
      id: creditPackage.priceId,
      productId: creditPackage.productId,
      unitAmount: creditPackage.unitAmount,
      currency: creditPackage.currency,
      interval: null,
      trialPeriodDays: null,
      credits: creditPackage.credits,
    })),
    ...MOCK_SUBSCRIPTION_PLANS.map((plan) => ({
      id: plan.priceId,
      productId: plan.productId,
      unitAmount: plan.unitAmount,
      currency: plan.currency,
      interval: plan.interval,
      trialPeriodDays: null,
      credits: plan.credits,
    })),
  ];
}

export function getMockStripeProducts() {
  return [...MOCK_CREDIT_PACKAGES, ...MOCK_SUBSCRIPTION_PLANS].map((item) => ({
    id: item.productId,
    name: item.name,
    description: item.description,
    defaultPriceId: item.priceId,
  }));
}
