export type BillableGenerationDurationSeconds = 5 | 8 | 10;
export type BillableTryOnMode = 'single' | 'multi';

export function getCreditCostForDuration(
  durationSeconds: BillableGenerationDurationSeconds
) {
  switch (durationSeconds) {
    case 5:
      return 10;
    case 8:
      return 18;
    case 10:
      return 25;
  }
}

export function getApparelImageCreditCost() {
  return 5;
}

export function getTryOnCreditCost(mode: BillableTryOnMode) {
  return mode === 'multi' ? 10 : 5;
}
