export const BILLING_CURRENCY = 'brl';
export type BillingCurrency = typeof BILLING_CURRENCY;

export const CREDIT_UNIT_AMOUNT = 50;
export const CREDIT_UNIT_LABEL = 'R$0.50';
export const PROVIDER_COST_MARKUP_MULTIPLIER = 3;
export const CNY_TO_BRL_EXCHANGE_RATE = 0.7609;

function assertPositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
}

export function getAmountForCredits(credits: number) {
  assertPositiveInteger(credits, 'credits');
  return credits * CREDIT_UNIT_AMOUNT;
}

export function getCreditsForAmount(unitAmount: number) {
  assertPositiveInteger(unitAmount, 'unit amount');

  if (unitAmount % CREDIT_UNIT_AMOUNT !== 0) {
    throw new Error(
      `unit amount must be divisible by ${CREDIT_UNIT_AMOUNT} for exact credit conversion`
    );
  }

  return unitAmount / CREDIT_UNIT_AMOUNT;
}

export function getDiscountedAnnualAmount(
  monthlyUnitAmount: number,
  savePercent = 20
) {
  assertPositiveInteger(monthlyUnitAmount, 'monthly unit amount');

  const annualAmount = monthlyUnitAmount * 12;
  return Math.round((annualAmount * (100 - savePercent)) / 100);
}

export function getCreditCostForProviderCnyCost(costCny: number) {
  if (!Number.isFinite(costCny) || costCny <= 0) {
    throw new Error('provider CNY cost must be positive');
  }

  const sellAmountInMinorUnits =
    costCny *
    CNY_TO_BRL_EXCHANGE_RATE *
    PROVIDER_COST_MARKUP_MULTIPLIER *
    100;

  return Math.max(1, Math.ceil(sellAmountInMinorUnits / CREDIT_UNIT_AMOUNT));
}
