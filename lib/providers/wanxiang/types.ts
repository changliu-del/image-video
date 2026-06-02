export type WanxiangTaskStatus = 'running' | 'succeeded' | 'failed';

export type WanxiangErrorCode =
  | 'MISSING_CREDENTIALS'
  | 'MISSING_MODEL_CATALOG_URL'
  | 'REQUEST_FAILED'
  | 'HTTP_ERROR'
  | 'API_ERROR'
  | 'TIMEOUT';

export type WanxiangPayload = Record<string, unknown>;

export interface WanxiangClientOptions {
  appCode?: string;
  fetch?: typeof fetch;
  resultMediaType?: 'image' | 'video';
  timeoutMs?: number;
}

export interface WanxiangRequestOptions extends WanxiangClientOptions {
  url?: string;
}

export interface WanxiangNormalizedResponse {
  providerTaskId?: string;
  status: WanxiangTaskStatus;
  finalImageUrl?: string;
  finalVideoUrl?: string;
  rawResponse: unknown;
  errorMessage?: string;
}

export class WanxiangProviderError extends Error {
  readonly provider = 'wanxiang';
  readonly code: WanxiangErrorCode;
  readonly retriable: boolean;
  readonly rawResponse?: unknown;
  readonly statusCode?: number;

  constructor(input: {
    code: WanxiangErrorCode;
    message: string;
    retriable?: boolean;
    rawResponse?: unknown;
    statusCode?: number;
    cause?: unknown;
  }) {
    super(input.message, { cause: input.cause });
    this.name = 'WanxiangProviderError';
    this.code = input.code;
    this.retriable = input.retriable ?? false;
    this.rawResponse = input.rawResponse;
    this.statusCode = input.statusCode;
  }
}
