export const SUBSCRIPTION_INTERVALS = ['month', 'year'] as const;
export type SubscriptionInterval = (typeof SUBSCRIPTION_INTERVALS)[number];

export const SUBSCRIPTION_TIERS = ['basic', 'plus', 'pro'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export type CreditPackage = {
  key: string;
  name: string;
  shortName: string;
  description: string;
  credits: number;
  unitAmount: number;
  currency: 'usd';
  productId: string;
  priceId: string;
  features: string[];
};

export type SubscriptionPlan = {
  key: string;
  tier: SubscriptionTier;
  interval: SubscriptionInterval;
  name: string;
  displayName: string;
  description: string;
  credits: number;
  monthlyCredits: number;
  unitAmount: number;
  currency: 'usd';
  productId: string;
  priceId: string;
  features: string[];
  savePercent?: number;
};

type SubscriptionTierDefinition = {
  tier: SubscriptionTier;
  displayName: string;
  description: string;
  monthlyCredits: number;
  monthlyUnitAmount: number;
  annualUnitAmount: number;
  features: string[];
};

const subscriptionTierDefinitions: SubscriptionTierDefinition[] = [
  {
    tier: 'basic',
    displayName: 'Basic',
    description: 'For testing product videos, campaign images, and try-on flows.',
    monthlyCredits: 150,
    monthlyUnitAmount: 1200,
    annualUnitAmount: 11500,
    features: [
      '150 credits refresh every billing month',
      'All ecommerce image and video tools',
      'Good for 15 standard 5s videos',
    ],
  },
  {
    tier: 'plus',
    displayName: 'Plus',
    description: 'For weekly launches and repeat ad creative production.',
    monthlyCredits: 600,
    monthlyUnitAmount: 3900,
    annualUnitAmount: 37400,
    features: [
      '600 credits refresh every billing month',
      'Priority queue in future production mode',
      'Good for 60 standard 5s videos',
    ],
  },
  {
    tier: 'pro',
    displayName: 'Pro',
    description: 'For brands producing SKU batches and frequent video tests.',
    monthlyCredits: 1500,
    monthlyUnitAmount: 9900,
    annualUnitAmount: 95000,
    features: [
      '1500 credits refresh every billing month',
      'Highest mock subscription allowance',
      'Good for 150 standard 5s videos',
    ],
  },
];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] =
  subscriptionTierDefinitions.flatMap((definition) => {
    const common = {
      tier: definition.tier,
      displayName: definition.displayName,
      description: definition.description,
      credits: definition.monthlyCredits,
      monthlyCredits: definition.monthlyCredits,
      currency: 'usd' as const,
      features: definition.features,
    };

    return [
      {
        ...common,
        key: `${definition.tier}_monthly`,
        interval: 'month' as const,
        name: `${definition.displayName} Monthly`,
        unitAmount: definition.monthlyUnitAmount,
        productId: `mock_prod_subscription_${definition.tier}_monthly`,
        priceId: `mock_price_subscription_${definition.tier}_monthly`,
      },
      {
        ...common,
        key: `${definition.tier}_annual`,
        interval: 'year' as const,
        name: `${definition.displayName} Annual`,
        unitAmount: definition.annualUnitAmount,
        productId: `mock_prod_subscription_${definition.tier}_annual`,
        priceId: `mock_price_subscription_${definition.tier}_annual`,
        savePercent: 20,
      },
    ];
  });

export const MONTHLY_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter(
  (plan): plan is SubscriptionPlan & { interval: 'month' } =>
    plan.interval === 'month'
);

export const ANNUAL_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter(
  (plan): plan is SubscriptionPlan & { interval: 'year' } =>
    plan.interval === 'year'
);

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    key: 'starter',
    name: 'Starter Credits',
    shortName: 'Starter',
    description: 'A small top-up for prompt tests and product experiments.',
    credits: 100,
    unitAmount: 900,
    currency: 'usd',
    productId: 'mock_prod_credits_starter',
    priceId: 'mock_price_credits_starter',
    features: [
      '100 purchased credits',
      'Never expire in mock mode',
      'Good for 10 standard 5s videos',
    ],
  },
  {
    key: 'creator',
    name: 'Creator Credits',
    shortName: 'Creator',
    description: 'Extra room for a weekly batch of product images and clips.',
    credits: 500,
    unitAmount: 3900,
    currency: 'usd',
    productId: 'mock_prod_credits_creator',
    priceId: 'mock_price_credits_creator',
    features: [
      '500 purchased credits',
      'Never expire in mock mode',
      'Good for 50 standard 5s videos',
    ],
  },
  {
    key: 'scale',
    name: 'Scale Credits',
    shortName: 'Scale',
    description: 'A larger reserve for catalog batches and campaign tests.',
    credits: 1500,
    unitAmount: 9900,
    currency: 'usd',
    productId: 'mock_prod_credits_scale',
    priceId: 'mock_price_credits_scale',
    features: [
      '1500 purchased credits',
      'Never expire in mock mode',
      'Good for 150 standard 5s videos',
    ],
  },
];

export function normalizeSubscriptionInterval(
  value: string | null | undefined
): SubscriptionInterval {
  return value === 'year' || value === 'yearly' || value === 'annual'
    ? 'year'
    : 'month';
}

export function getSubscriptionPlanByPriceId(priceId: string) {
  return SUBSCRIPTION_PLANS.find((plan) => plan.priceId === priceId) ?? null;
}

export function getCreditPackageByPriceId(priceId: string) {
  return CREDIT_PACKAGES.find((creditPackage) => creditPackage.priceId === priceId) ?? null;
}

export function getSubscriptionPlansByInterval(interval: SubscriptionInterval) {
  return SUBSCRIPTION_PLANS.filter((plan) => plan.interval === interval);
}

export function getEffectiveMonthlyAmount(plan: SubscriptionPlan) {
  return plan.interval === 'year'
    ? Math.round(plan.unitAmount / 12)
    : plan.unitAmount;
}
