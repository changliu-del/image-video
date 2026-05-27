export type GenerationLimitConfig = {
  dailyLimit: number;
  activeConcurrencyLimit: number;
  freeQuotaLimit: number;
};

export type GenerationLimitCounts = {
  activeCount: number;
  dailyCount: number;
  totalCount: number;
  hasPurchasedCredits: boolean;
};

export type GenerationLimitViolation = {
  status: number;
  code:
    | 'active_generation_limit_exceeded'
    | 'daily_generation_limit_exceeded'
    | 'free_generation_quota_exceeded';
  message: string;
};

type EnvMap = Record<string, string | undefined>;

const DEFAULT_DAILY_GENERATION_LIMIT = 100;
const DEFAULT_ACTIVE_CONCURRENCY_LIMIT = 1;
const DEFAULT_FREE_GENERATION_QUOTA = 3;

function readPositiveIntegerEnv(
  env: EnvMap,
  name: string,
  fallback: number
) {
  const value = env[name];

  if (value == null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getGenerationLimitConfig(
  env: EnvMap = process.env
): GenerationLimitConfig {
  return {
    dailyLimit: readPositiveIntegerEnv(
      env,
      'GENERATION_DAILY_LIMIT',
      DEFAULT_DAILY_GENERATION_LIMIT
    ),
    activeConcurrencyLimit: readPositiveIntegerEnv(
      env,
      'GENERATION_ACTIVE_CONCURRENCY_LIMIT',
      DEFAULT_ACTIVE_CONCURRENCY_LIMIT
    ),
    freeQuotaLimit: readPositiveIntegerEnv(
      env,
      'GENERATION_FREE_QUOTA_LIMIT',
      DEFAULT_FREE_GENERATION_QUOTA
    ),
  };
}

export function getGenerationLimitViolation(
  counts: GenerationLimitCounts,
  config: GenerationLimitConfig = getGenerationLimitConfig()
): GenerationLimitViolation | null {
  if (counts.activeCount >= config.activeConcurrencyLimit) {
    return {
      status: 429,
      code: 'active_generation_limit_exceeded',
      message: `You already have ${config.activeConcurrencyLimit} active generation${config.activeConcurrencyLimit === 1 ? '' : 's'}. Wait for one to finish before starting another.`,
    };
  }

  if (
    !counts.hasPurchasedCredits &&
    counts.totalCount >= config.freeQuotaLimit
  ) {
    return {
      status: 403,
      code: 'free_generation_quota_exceeded',
      message:
        'Free generation quota reached. Add credits to continue generating videos.',
    };
  }

  if (counts.dailyCount >= config.dailyLimit) {
    return {
      status: 429,
      code: 'daily_generation_limit_exceeded',
      message:
        'Daily generation limit reached. Try again after the 24-hour window resets.',
    };
  }

  return null;
}
