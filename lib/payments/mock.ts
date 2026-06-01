type EnvMap = Record<string, string | undefined>;

export type MockCreditPackage = {
  key: string;
  name: string;
  description: string;
  credits: number;
  unitAmount: number;
  currency: string;
  productId: string;
  priceId: string;
};

export type MockMonthlyPlan = MockCreditPackage & {
  interval: 'month';
};

export const MOCK_CREDIT_PACKAGES: MockCreditPackage[] = [
  {
    key: 'starter',
    name: 'Starter Credits',
    description: '50 credits for ecommerce video generation',
    credits: 50,
    unitAmount: 999,
    currency: 'usd',
    productId: 'mock_prod_starter',
    priceId: 'mock_price_starter',
  },
  {
    key: 'pro',
    name: 'Pro Credits',
    description: '300 credits for ecommerce video generation',
    credits: 300,
    unitAmount: 3999,
    currency: 'usd',
    productId: 'mock_prod_pro',
    priceId: 'mock_price_pro',
  },
  {
    key: 'business',
    name: 'Business Credits',
    description: '1000 credits for ecommerce video generation',
    credits: 1000,
    unitAmount: 9999,
    currency: 'usd',
    productId: 'mock_prod_business',
    priceId: 'mock_price_business',
  },
];

export const MOCK_MONTHLY_PLANS: MockMonthlyPlan[] = [
  {
    key: 'monthly_starter',
    name: 'Monthly Starter',
    description: '150 credits every month for regular ecommerce campaigns',
    credits: 150,
    unitAmount: 1999,
    currency: 'usd',
    productId: 'mock_prod_monthly_starter',
    priceId: 'mock_price_monthly_starter',
    interval: 'month',
  },
  {
    key: 'monthly_pro',
    name: 'Monthly Pro',
    description: '600 credits every month for weekly product video batches',
    credits: 600,
    unitAmount: 6999,
    currency: 'usd',
    productId: 'mock_prod_monthly_pro',
    priceId: 'mock_price_monthly_pro',
    interval: 'month',
  },
  {
    key: 'monthly_business',
    name: 'Monthly Business',
    description: '2000 credits every month for catalog-scale ecommerce teams',
    credits: 2000,
    unitAmount: 17999,
    currency: 'usd',
    productId: 'mock_prod_monthly_business',
    priceId: 'mock_price_monthly_business',
    interval: 'month',
  },
];

export function isPaymentMockEnabled(env: EnvMap = process.env) {
  const explicitValue = env.PAYMENTS_MOCK?.trim().toLowerCase();

  if (explicitValue) {
    return ['1', 'true', 'yes', 'on'].includes(explicitValue);
  }

  return env.NODE_ENV !== 'production';
}

export function getMockCreditPackageByPriceId(priceId: string) {
  return MOCK_CREDIT_PACKAGES.find((creditPackage) => creditPackage.priceId === priceId) ?? null;
}

export function getMockMonthlyPlanByPriceId(priceId: string) {
  return MOCK_MONTHLY_PLANS.find((plan) => plan.priceId === priceId) ?? null;
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
    ...MOCK_MONTHLY_PLANS.map((plan) => ({
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
  return [...MOCK_CREDIT_PACKAGES, ...MOCK_MONTHLY_PLANS].map((item) => ({
    id: item.productId,
    name: item.name,
    description: item.description,
    defaultPriceId: item.priceId,
  }));
}
