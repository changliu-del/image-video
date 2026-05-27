import 'server-only';

import { randomUUID } from 'node:crypto';

import {
  type ImageToVideoCreateJobInput,
  type ImageToVideoCreateJobResult,
  type ImageToVideoProvider,
  type ImageToVideoResult,
  VideoProviderError
} from './types';
import { buildFalImageToVideoInput } from './fal-input';

const DEFAULT_MODEL = 'fal-ai/wan/v2.7/image-to-video';
const DEFAULT_WAIT_TIMEOUT_MS = 15 * 60 * 1000;
const DEFAULT_POLL_INTERVAL_MS = 5000;

type FalQueue = {
  submit?: (model: string, options: Record<string, unknown>) => Promise<unknown>;
  status?: (model: string, options: Record<string, unknown>) => Promise<unknown>;
  result?: (model: string, options: Record<string, unknown>) => Promise<unknown>;
};

type FalClient = {
  config?: (options: Record<string, unknown>) => void;
  queue?: FalQueue;
  subscribe?: (
    model: string,
    options: Record<string, unknown>
  ) => Promise<unknown>;
  run?: (model: string, options: Record<string, unknown>) => Promise<unknown>;
};

type FalClientModule = {
  fal?: FalClient;
  default?: FalClient | { fal?: FalClient };
};

export interface FalVideoProviderOptions {
  apiKey?: string;
  model?: string;
  waitTimeoutMs?: number;
  pollIntervalMs?: number;
}

export class FalVideoProvider implements ImageToVideoProvider {
  readonly name = 'fal';

  private readonly inlineResults = new Map<string, unknown>();

  constructor(private readonly options: FalVideoProviderOptions = {}) {}

  get model() {
    return (
      this.options.model ||
      process.env.FAL_DEFAULT_MODEL ||
      DEFAULT_MODEL
    );
  }

  async createJob(
    input: ImageToVideoCreateJobInput
  ): Promise<ImageToVideoCreateJobResult> {
    this.validateCreateInput(input);
    const fal = await this.loadClient();
    const requestInput = this.buildFalInput(input);

    try {
      const rawResponse = await this.submitJob(fal, requestInput);
      let providerJobId = extractProviderJobId(rawResponse);

      if (!providerJobId && extractVideoUrl(rawResponse)) {
        providerJobId = `inline-${randomUUID()}`;
        this.inlineResults.set(providerJobId, rawResponse);
      }

      if (!providerJobId) {
        throw new VideoProviderError({
          provider: this.name,
          code: 'RESULT_NOT_FOUND',
          message: 'fal.ai did not return a provider job id',
          rawResponse
        });
      }

      return {
        providerJobId,
        rawResponse,
        costUsd: extractCostUsd(rawResponse)
      };
    } catch (error) {
      if (error instanceof VideoProviderError) {
        throw error;
      }

      throw new VideoProviderError({
        provider: this.name,
        code: 'REQUEST_FAILED',
        message: 'fal.ai image-to-video job creation failed',
        retriable: true,
        cause: error
      });
    }
  }

  async waitForResult(
    providerJobId: string,
    options: { timeoutMs?: number } = {}
  ): Promise<ImageToVideoResult> {
    const inlineResult = this.inlineResults.get(providerJobId);
    if (inlineResult) {
      this.inlineResults.delete(providerJobId);
      return normalizeFalResult(this.name, inlineResult);
    }

    const fal = await this.loadClient();
    const timeoutMs =
      options.timeoutMs ?? this.options.waitTimeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
    const pollIntervalMs =
      this.options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const deadline = Date.now() + timeoutMs;

    if (fal.queue?.status) {
      while (Date.now() < deadline) {
        const remainingMs = deadline - Date.now();
        const statusResponse = await withTimeout(
          fal.queue.status(this.model, {
            requestId: providerJobId,
            request_id: providerJobId,
            logs: false
          }),
          remainingMs
        );
        const status = extractStatus(statusResponse);

        if (isFailureStatus(status)) {
          throw new VideoProviderError({
            provider: this.name,
            code: 'JOB_FAILED',
            message: `fal.ai job failed with status ${status || 'unknown'}`,
            rawResponse: statusResponse
          });
        }

        if (isSuccessStatus(status)) {
          const rawResponse = fal.queue.result
            ? await withTimeout(
                fal.queue.result(this.model, {
                  requestId: providerJobId,
                  request_id: providerJobId
                }),
                Math.max(1, deadline - Date.now())
              )
            : statusResponse;

          return normalizeFalResult(this.name, rawResponse);
        }

        await sleep(Math.min(pollIntervalMs, Math.max(1, deadline - Date.now())));
      }

      throw new VideoProviderError({
        provider: this.name,
        code: 'RESULT_TIMEOUT',
        message: 'Timed out waiting for fal.ai image-to-video result',
        retriable: true
      });
    }

    if (fal.queue?.result) {
      const rawResponse = await withTimeout(
        fal.queue.result(this.model, {
          requestId: providerJobId,
          request_id: providerJobId
        }),
        timeoutMs
      );

      return normalizeFalResult(this.name, rawResponse);
    }

    throw new VideoProviderError({
      provider: this.name,
      code: 'UNSUPPORTED_PROVIDER_API',
      message: 'Installed @fal-ai/client does not expose queue status/result APIs'
    });
  }

  private validateCreateInput(input: ImageToVideoCreateJobInput) {
    if (!input.imageUrl || !input.prompt) {
      throw new VideoProviderError({
        provider: this.name,
        code: 'INVALID_INPUT',
        message: 'fal.ai image-to-video requires imageUrl and prompt'
      });
    }

    if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
      throw new VideoProviderError({
        provider: this.name,
        code: 'INVALID_INPUT',
        message: 'fal.ai image-to-video requires a positive durationSeconds'
      });
    }
  }

  private async loadClient(): Promise<FalClient> {
    const apiKey = this.options.apiKey ?? process.env.FAL_KEY;
    if (!apiKey) {
      throw new VideoProviderError({
        provider: this.name,
        code: 'MISSING_CREDENTIALS',
        message: 'FAL_KEY is required for fal.ai image-to-video generation'
      });
    }

    const moduleName: string = '@fal-ai/client';
    let mod: FalClientModule;
    try {
      mod = (await import(moduleName)) as FalClientModule;
    } catch (error) {
      throw new VideoProviderError({
        provider: this.name,
        code: 'UNSUPPORTED_PROVIDER_API',
        message: '@fal-ai/client is not available in this runtime',
        cause: error
      });
    }

    const fal =
      mod.fal ||
      (isFalClient(mod.default) ? mod.default : undefined) ||
      (isFalClientModule(mod.default) ? mod.default.fal : undefined);

    if (!fal) {
      throw new VideoProviderError({
        provider: this.name,
        code: 'UNSUPPORTED_PROVIDER_API',
        message: '@fal-ai/client did not expose a fal client'
      });
    }

    fal.config?.({ credentials: apiKey });
    return fal;
  }

  private buildFalInput(input: ImageToVideoCreateJobInput) {
    return buildFalImageToVideoInput(this.model, input);
  }

  private async submitJob(
    fal: FalClient,
    input: Record<string, unknown>
  ): Promise<unknown> {
    if (fal.queue?.submit) {
      return await fal.queue.submit(this.model, { input });
    }

    if (fal.subscribe) {
      const rawResponse = await fal.subscribe(this.model, {
        input,
        logs: false
      });
      const providerJobId = extractProviderJobId(rawResponse);
      if (providerJobId && extractVideoUrl(rawResponse)) {
        this.inlineResults.set(providerJobId, rawResponse);
      }
      return rawResponse;
    }

    if (fal.run) {
      const rawResponse = await fal.run(this.model, { input });
      const providerJobId = extractProviderJobId(rawResponse);
      if (providerJobId && extractVideoUrl(rawResponse)) {
        this.inlineResults.set(providerJobId, rawResponse);
      }
      return rawResponse;
    }

    throw new VideoProviderError({
      provider: this.name,
      code: 'UNSUPPORTED_PROVIDER_API',
      message: 'Installed @fal-ai/client does not expose submit/subscribe/run APIs'
    });
  }
}

function normalizeFalResult(provider: string, rawResponse: unknown) {
  const videoUrl = extractVideoUrl(rawResponse);
  if (!videoUrl) {
    throw new VideoProviderError({
      provider,
      code: 'RESULT_NOT_FOUND',
      message: 'fal.ai result did not include a video URL',
      rawResponse
    });
  }

  return {
    videoUrl,
    rawResponse,
    costUsd: extractCostUsd(rawResponse)
  };
}

function isFalClient(value: unknown): value is FalClient {
  return Boolean(value && typeof value === 'object');
}

function isFalClientModule(value: unknown): value is { fal?: FalClient } {
  return Boolean(value && typeof value === 'object' && 'fal' in value);
}

function extractProviderJobId(value: unknown): string | undefined {
  return firstStringAtPaths(value, [
    ['request_id'],
    ['requestId'],
    ['id'],
    ['job_id'],
    ['jobId'],
    ['queue', 'request_id'],
    ['queue', 'requestId']
  ]);
}

function extractVideoUrl(value: unknown): string | undefined {
  return (
    firstStringAtPaths(value, [
      ['video', 'url'],
      ['video_url'],
      ['videoUrl'],
      ['output', 'video', 'url'],
      ['output', 'video_url'],
      ['output', 'videoUrl'],
      ['data', 'video', 'url'],
      ['data', 'video_url'],
      ['result', 'video', 'url'],
      ['result', 'video_url'],
      ['videos', '0', 'url'],
      ['output', 'videos', '0', 'url']
    ]) || findVideoUrl(value)
  );
}

function extractCostUsd(value: unknown): number | undefined {
  const raw = firstValueAtPaths(value, [
    ['cost_usd'],
    ['costUsd'],
    ['cost'],
    ['billing', 'cost_usd'],
    ['billing', 'costUsd'],
    ['metrics', 'cost_usd'],
    ['metrics', 'costUsd']
  ]);
  const cost = typeof raw === 'string' ? Number(raw) : raw;
  return typeof cost === 'number' && Number.isFinite(cost) ? cost : undefined;
}

function extractStatus(value: unknown): string | undefined {
  return firstStringAtPaths(value, [
    ['status'],
    ['state'],
    ['queue_status'],
    ['request_status']
  ])?.toLowerCase();
}

function isSuccessStatus(status: string | undefined) {
  return ['completed', 'complete', 'succeeded', 'success', 'finished'].includes(
    status ?? ''
  );
}

function isFailureStatus(status: string | undefined) {
  return ['failed', 'failure', 'error', 'cancelled', 'canceled'].includes(
    status ?? ''
  );
}

function firstStringAtPaths(
  value: unknown,
  paths: string[][]
): string | undefined {
  const found = firstValueAtPaths(value, paths);
  return typeof found === 'string' && found.length > 0 ? found : undefined;
}

function firstValueAtPaths(value: unknown, paths: string[][]): unknown {
  for (const path of paths) {
    let current = value;
    for (const part of path) {
      if (Array.isArray(current)) {
        current = current[Number(part)];
      } else if (current && typeof current === 'object') {
        current = (current as Record<string, unknown>)[part];
      } else {
        current = undefined;
      }
    }

    if (current !== undefined && current !== null) {
      return current;
    }
  }

  return undefined;
}

function findVideoUrl(value: unknown, path: string[] = []): string | undefined {
  if (typeof value === 'string') {
    const lowerPath = path.join('.').toLowerCase();
    if (lowerPath.includes('video') && /^https?:\/\//.test(value)) {
      return value;
    }
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findVideoUrl(item, [...path, String(index)]);
      if (found) return found;
    }
    return undefined;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  for (const [key, child] of Object.entries(value)) {
    const found = findVideoUrl(child, [...path, key]);
    if (found) return found;
  }

  return undefined;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new VideoProviderError({
              provider: 'fal',
              code: 'RESULT_TIMEOUT',
              message: 'Timed out waiting for fal.ai API response',
              retriable: true
            })
          );
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
