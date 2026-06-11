export type BillableGenerationDurationSeconds = number;
export type BillableTryOnMode = 'single' | 'multi';

export const IMAGE_TO_VIDEO_DURATION_SECONDS = 5;
export const IMAGE_TO_VIDEO_CREDIT_COST = 10;

export function getCreditCostForDuration(
  durationSeconds: BillableGenerationDurationSeconds
) {
  if (durationSeconds !== IMAGE_TO_VIDEO_DURATION_SECONDS) {
    throw new Error(`Unsupported generation duration: ${durationSeconds}`);
  }

  return IMAGE_TO_VIDEO_CREDIT_COST;
}

export function getApparelImageCreditCost() {
  return 5;
}

export function getTryOnCreditCost(mode: BillableTryOnMode) {
  return mode === 'multi' ? 10 : 5;
}
