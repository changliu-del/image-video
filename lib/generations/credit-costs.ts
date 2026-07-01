import { getCreditCostForProviderCnyCost } from '../payments/pricing';
import {
  DEFAULT_IMAGE_VIDEO_MODEL_MODE,
  getImageToVideoModelConfig,
  type ImageVideoModelMode,
} from './video-models';

export type BillableGenerationDurationSeconds = number;
export type BillableTryOnMode = 'single' | 'multi';

export const IMAGE_TO_VIDEO_DURATION_SECONDS = 5;
export const IMAGE_TO_VIDEO_MIN_DURATION_SECONDS = 5;
export const IMAGE_TO_VIDEO_MAX_DURATION_SECONDS = 15;
export const IMAGE_TO_VIDEO_CREDIT_COST =
  getCreditCostForDuration(IMAGE_TO_VIDEO_DURATION_SECONDS);
export const WANXIANG_IMAGE_EDIT_PROVIDER_COST_CNY_PER_IMAGE = 0.5;
export const WANXIANG_IMAGE_EDIT_CREDIT_COST =
  getCreditCostForProviderCnyCost(
    WANXIANG_IMAGE_EDIT_PROVIDER_COST_CNY_PER_IMAGE
  );

export function getCreditCostForDuration(
  durationSeconds: BillableGenerationDurationSeconds,
  options: { videoModelMode?: ImageVideoModelMode | string | null } = {}
) {
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < IMAGE_TO_VIDEO_MIN_DURATION_SECONDS ||
    durationSeconds > IMAGE_TO_VIDEO_MAX_DURATION_SECONDS
  ) {
    throw new Error(`Unsupported generation duration: ${durationSeconds}`);
  }

  const config = getImageToVideoModelConfig(
    options.videoModelMode ?? DEFAULT_IMAGE_VIDEO_MODEL_MODE
  );
  return getCreditCostForProviderCnyCost(
    config.providerUnitCostCnyPerSecond * durationSeconds,
    {
      markupMultiplier: config.providerCostMarkupMultiplier,
    }
  );
}

export function getApparelImageCreditCost() {
  return WANXIANG_IMAGE_EDIT_CREDIT_COST;
}

export function getTryOnCreditCost(mode: BillableTryOnMode) {
  void mode;
  return WANXIANG_IMAGE_EDIT_CREDIT_COST;
}
