import {
  normalizeWanxiangResponse,
} from './client';
import {
  type WanxiangClientOptions,
  WanxiangProviderError,
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
} from './types';

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

type DashScopeRequestOptions = WanxiangClientOptions & {
  method?: 'GET' | 'POST';
};

export function getDashScopeBaseUrl() {
  return (
    process.env.DASHSCOPE_BASE_URL?.trim().replace(/\/+$/, '') ||
    DEFAULT_DASHSCOPE_BASE_URL
  );
}

export function getDashScopeVideoSynthesisUrl() {
  return (
    process.env.DASHSCOPE_VIDEO_SYNTHESIS_URL?.trim() ||
    `${getDashScopeBaseUrl()}/services/aigc/video-generation/video-synthesis`
  );
}

export function getDashScopeTaskUrl(taskId: string) {
  const baseUrl =
    process.env.DASHSCOPE_TASKS_URL?.trim().replace(/\/+$/, '') ||
    `${getDashScopeBaseUrl()}/tasks`;

  return `${baseUrl}/${encodeURIComponent(taskId)}`;
}

export async function postDashScopeJson(
  url: string,
  payload: WanxiangPayload,
  options: DashScopeRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return requestDashScopeJson(url, payload, {
    ...options,
    method: 'POST',
  });
}

export async function getDashScopeTask(
  taskId: string,
  options: DashScopeRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return requestDashScopeJson(getDashScopeTaskUrl(taskId), undefined, {
    ...options,
    method: 'GET',
    resultMediaType: options.resultMediaType ?? 'video',
  });
}

async function requestDashScopeJson(
  url: string,
  payload: WanxiangPayload | undefined,
  options: DashScopeRequestOptions
): Promise<WanxiangNormalizedResponse> {
  const apiKey = options.dashScopeApiKey ?? process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new WanxiangProviderError({
      code: 'MISSING_CREDENTIALS',
      message: 'DASHSCOPE_API_KEY is required for Bailian DashScope requests',
    });
  }

  const method = options.method ?? 'POST';
  const fetchImpl = options.fetch ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  let response: Response;
  try {
    response = await Promise.race([
      fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...(method === 'POST'
            ? {
                'Content-Type': 'application/json',
                'X-DashScope-Async': 'enable',
              }
            : {}),
        },
        ...(method === 'POST' ? { body: JSON.stringify(payload ?? {}) } : {}),
        signal: controller.signal,
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(
            new WanxiangProviderError({
              code: 'TIMEOUT',
              message: 'Timed out waiting for Bailian DashScope response',
              retriable: true,
            })
          );
        }, timeoutMs);
      }),
    ]);
  } catch (error) {
    if (error instanceof WanxiangProviderError) {
      throw error;
    }

    throw new WanxiangProviderError({
      code: isAbortError(error) ? 'TIMEOUT' : 'REQUEST_FAILED',
      message: isAbortError(error)
        ? 'Timed out waiting for Bailian DashScope response'
        : 'Bailian DashScope request failed',
      retriable: true,
      cause: error,
    });
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  const rawResponse = await parseResponseBody(response);
  if (!response.ok) {
    throw new WanxiangProviderError({
      code: 'HTTP_ERROR',
      message: [
        `Bailian DashScope API returned HTTP ${response.status}`,
        formatRawResponseForError(rawResponse),
      ]
        .filter(Boolean)
        .join(': '),
      retriable: response.status >= 500 || response.status === 429,
      rawResponse,
      statusCode: response.status,
    });
  }

  return normalizeWanxiangResponse(rawResponse, options.resultMediaType);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function formatRawResponseForError(rawResponse: unknown) {
  if (rawResponse === undefined || rawResponse === null || rawResponse === '') {
    return undefined;
  }

  const text =
    typeof rawResponse === 'string'
      ? rawResponse
      : JSON.stringify(rawResponse);

  return text.length > 500 ? `${text.slice(0, 500)}...` : text;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}
