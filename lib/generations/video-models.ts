export const IMAGE_VIDEO_MODEL_MODES = [
  'wanxiang_2_6_first_frame',
  'wanxiang_2_7',
] as const;

export type ImageVideoModelMode = (typeof IMAGE_VIDEO_MODEL_MODES)[number];

export const DEFAULT_IMAGE_VIDEO_MODEL_MODE: ImageVideoModelMode =
  'wanxiang_2_6_first_frame';

type ImageToVideoModelConfig = {
  mode: ImageVideoModelMode;
  providerModelId: string;
  resolution: '720P' | '1080P';
  audio: boolean;
  providerUnitCostCnyPerSecond: number;
  providerCostMarkupMultiplier?: number;
};

export const IMAGE_TO_VIDEO_MODEL_CONFIGS: Record<
  ImageVideoModelMode,
  ImageToVideoModelConfig
> = {
  wanxiang_2_6_first_frame: {
    mode: 'wanxiang_2_6_first_frame',
    providerModelId: 'wan2.6-i2v-flash',
    resolution: '720P',
    audio: false,
    providerUnitCostCnyPerSecond: 0.183481,
  },
  wanxiang_2_7: {
    mode: 'wanxiang_2_7',
    providerModelId: 'wan2.7-i2v-2026-04-25',
    resolution: '720P',
    audio: true,
    providerUnitCostCnyPerSecond: 0.733924,
    providerCostMarkupMultiplier: 1.5,
  },
};

export function normalizeImageVideoModelMode(
  value: unknown
): ImageVideoModelMode {
  return value === 'wanxiang_2_7'
    ? 'wanxiang_2_7'
    : DEFAULT_IMAGE_VIDEO_MODEL_MODE;
}

export function getImageToVideoModelConfig(value?: unknown) {
  return IMAGE_TO_VIDEO_MODEL_CONFIGS[normalizeImageVideoModelMode(value)];
}
