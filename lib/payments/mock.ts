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

export function getMockStripePrices() {
  return MOCK_CREDIT_PACKAGES.map((creditPackage) => ({
    id: creditPackage.priceId,
    productId: creditPackage.productId,
    unitAmount: creditPackage.unitAmount,
    currency: creditPackage.currency,
    interval: null,
    trialPeriodDays: null,
    credits: creditPackage.credits,
  }));
}

export function getMockStripeProducts() {
  return MOCK_CREDIT_PACKAGES.map((creditPackage) => ({
    id: creditPackage.productId,
    name: creditPackage.name,
    description: creditPackage.description,
    defaultPriceId: creditPackage.priceId,
  }));
}
