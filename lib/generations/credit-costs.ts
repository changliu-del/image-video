export type BillableGenerationDurationSeconds = number;
export type BillableTryOnMode = 'single' | 'multi';

export const IMAGE_TO_VIDEO_DURATION_SECONDS = 5;
export const IMAGE_TO_VIDEO_MIN_DURATION_SECONDS = 5;
export const IMAGE_TO_VIDEO_MAX_DURATION_SECONDS = 15;
export const IMAGE_TO_VIDEO_CREDITS_PER_SECOND = 2;
export const IMAGE_TO_VIDEO_CREDIT_COST =
  IMAGE_TO_VIDEO_DURATION_SECONDS * IMAGE_TO_VIDEO_CREDITS_PER_SECOND;

export function getCreditCostForDuration(
  durationSeconds: BillableGenerationDurationSeconds
) {
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < IMAGE_TO_VIDEO_MIN_DURATION_SECONDS ||
    durationSeconds > IMAGE_TO_VIDEO_MAX_DURATION_SECONDS
  ) {
    throw new Error(`Unsupported generation duration: ${durationSeconds}`);
  }

  return durationSeconds * IMAGE_TO_VIDEO_CREDITS_PER_SECOND;
}

export function getApparelImageCreditCost() {
  return 5;
}

export function getTryOnCreditCost(mode: BillableTryOnMode) {
  return mode === 'multi' ? 10 : 5;
}
