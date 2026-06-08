export type BillableGenerationDurationSeconds = number;
export type BillableTryOnMode = 'single' | 'multi';

export function getCreditCostForDuration(
  durationSeconds: BillableGenerationDurationSeconds
) {
  if (!Number.isInteger(durationSeconds) || durationSeconds < 4 || durationSeconds > 15) {
    throw new Error(`Unsupported generation duration: ${durationSeconds}`);
  }

  return Math.max(8, Math.round(durationSeconds * 3 - 5));
}

export function getApparelImageCreditCost() {
  return 5;
}

export function getTryOnCreditCost(mode: BillableTryOnMode) {
  return mode === 'multi' ? 10 : 5;
}
