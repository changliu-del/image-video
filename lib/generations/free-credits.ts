import { IMAGE_TO_VIDEO_CREDIT_COST } from './credit-costs';

type EnvMap = Record<string, string | undefined>;

export const SIGNUP_FREE_CREDITS_ENV = 'GENERATION_SIGNUP_FREE_CREDITS';
export const DEFAULT_SIGNUP_FREE_CREDITS = IMAGE_TO_VIDEO_CREDIT_COST * 3;

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

export function getSignupFreeCreditsAmount(
  env: EnvMap = process.env
) {
  return readPositiveIntegerEnv(
    env,
    SIGNUP_FREE_CREDITS_ENV,
    DEFAULT_SIGNUP_FREE_CREDITS
  );
}
