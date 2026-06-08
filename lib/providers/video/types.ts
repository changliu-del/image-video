export const VIDEO_ASPECT_RATIOS = ['9:16', '3:4', '1:1', '16:9'] as const;

export type VideoAspectRatio = (typeof VIDEO_ASPECT_RATIOS)[number];

export type VideoProviderErrorCode =
  | 'MISSING_CREDENTIALS'
  | 'INVALID_INPUT'
  | 'REQUEST_FAILED'
  | 'JOB_FAILED'
  | 'RESULT_TIMEOUT'
  | 'RESULT_NOT_FOUND'
  | 'UNSUPPORTED_PROVIDER_API';

export interface ImageToVideoCreateJobInput {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  durationSeconds: number;
  aspectRatio: VideoAspectRatio;
  metadata?: Record<string, unknown>;
}

export interface ImageToVideoCreateJobResult {
  providerJobId: string;
  rawResponse?: unknown;
  costUsd?: number;
}

export interface ImageToVideoResult {
  videoUrl: string;
  rawResponse?: unknown;
  costUsd?: number;
}

export interface ImageToVideoProvider {
  name: string;

  createJob(
    input: ImageToVideoCreateJobInput
  ): Promise<ImageToVideoCreateJobResult>;

  waitForResult(
    providerJobId: string,
    options?: { timeoutMs?: number }
  ): Promise<ImageToVideoResult>;
}

export class VideoProviderError extends Error {
  readonly provider: string;
  readonly code: VideoProviderErrorCode;
  readonly retriable: boolean;
  readonly rawResponse?: unknown;

  constructor(input: {
    provider: string;
    code: VideoProviderErrorCode;
    message: string;
    retriable?: boolean;
    rawResponse?: unknown;
    cause?: unknown;
  }) {
    super(input.message, { cause: input.cause });
    this.name = 'VideoProviderError';
    this.provider = input.provider;
    this.code = input.code;
    this.retriable = input.retriable ?? false;
    this.rawResponse = input.rawResponse;
  }
}

export function isVideoAspectRatio(value: unknown): value is VideoAspectRatio {
  return (
    typeof value === 'string' &&
    VIDEO_ASPECT_RATIOS.includes(value as VideoAspectRatio)
  );
}
