import {
  type WanxiangClientOptions,
  WanxiangProviderError,
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
  type WanxiangTaskStatus
} from './types';

const DEFAULT_TIMEOUT_MS = 30_000;

const TASK_ID_PATHS = [
  ['task_id'],
  ['taskId'],
  ['taskID'],
  ['providerTaskId'],
  ['id'],
  ['job_id'],
  ['jobId'],
  ['data', 'task_id'],
  ['data', 'taskId'],
  ['data', 'taskID'],
  ['data', 'id'],
  ['data', 'job_id'],
  ['output', 'task_id'],
  ['output', 'taskId'],
  ['result', 'task_id'],
  ['result', 'taskId'],
];

const STATUS_PATHS = [
  ['status'],
  ['state'],
  ['task_status'],
  ['taskStatus'],
  ['job_status'],
  ['jobStatus'],
  ['data', 'status'],
  ['data', 'state'],
  ['data', 'task_status'],
  ['data', 'taskStatus'],
  ['output', 'task_status'],
  ['output', 'taskStatus'],
  ['result', 'status'],
  ['result', 'state'],
  ['output', 'status'],
  ['output', 'state']
];

const ERROR_PATHS = [
  ['errorMessage'],
  ['error_message'],
  ['message'],
  ['msg'],
  ['desc'],
  ['data', 'errorMessage'],
  ['data', 'error_message'],
  ['data', 'message'],
  ['data', 'msg'],
  ['output', 'errorMessage'],
  ['output', 'error_message'],
  ['output', 'message'],
  ['output', 'msg'],
  ['result', 'errorMessage'],
  ['result', 'message']
];

const IMAGE_URL_PATHS = [
  ['finalImageUrl'],
  ['image_url'],
  ['imageUrl'],
  ['data', 'finalImageUrl'],
  ['data', 'image_url'],
  ['data', 'imageUrl'],
  ['data', 'images', '0', 'url'],
  ['data', 'image', 'url'],
  ['result', 'finalImageUrl'],
  ['result', 'image_url'],
  ['result', 'imageUrl'],
  ['result', 'images', '0', 'url'],
  ['output', 'image_url'],
  ['output', 'imageUrl'],
  ['output', 'images', '0', 'url']
];

const VIDEO_URL_PATHS = [
  ['finalVideoUrl'],
  ['video_url'],
  ['videoUrl'],
  ['data', 'finalVideoUrl'],
  ['data', 'video_url'],
  ['data', 'videoUrl'],
  ['data', 'videos', '0', 'url'],
  ['data', 'video', 'url'],
  ['result', 'finalVideoUrl'],
  ['result', 'video_url'],
  ['result', 'videoUrl'],
  ['result', 'videos', '0', 'url'],
  ['output', 'video_url'],
  ['output', 'videoUrl'],
  ['output', 'videos', '0', 'url']
];

const GENERIC_RESULT_URL_PATHS = [
  ['result_url'],
  ['resultUrl'],
  ['url'],
  ['data', 'result_url'],
  ['data', 'resultUrl'],
  ['data', 'url'],
  ['result', 'result_url'],
  ['result', 'resultUrl'],
  ['result', 'url'],
  ['output', 'result_url'],
  ['output', 'resultUrl'],
  ['output', 'url']
];

export class WanxiangClient {
  constructor(private readonly options: WanxiangClientOptions = {}) {}

  async post(
    url: string,
    payload: WanxiangPayload
  ): Promise<WanxiangNormalizedResponse> {
    const appCode = this.options.appCode ?? process.env.WANXIANG_APPCODE;
    if (!appCode) {
      throw new WanxiangProviderError({
        code: 'MISSING_CREDENTIALS',
        message: 'WANXIANG_APPCODE is required for Wanxiang API requests'
      });
    }

    const fetchImpl = this.options.fetch ?? fetch;
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;

    let response: Response;
    try {
      response = await Promise.race([
        fetchImpl(url, {
          method: 'POST',
          headers: {
            Authorization: `APPCODE ${appCode}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            controller.abort();
            reject(
              new WanxiangProviderError({
                code: 'TIMEOUT',
                message: 'Timed out waiting for Wanxiang API response',
                retriable: true
              })
            );
          }, timeoutMs);
        })
      ]);
    } catch (error) {
      if (error instanceof WanxiangProviderError) {
        throw error;
      }

      throw new WanxiangProviderError({
        code: isAbortError(error) ? 'TIMEOUT' : 'REQUEST_FAILED',
        message: isAbortError(error)
          ? 'Timed out waiting for Wanxiang API response'
          : 'Wanxiang API request failed',
        retriable: true,
        cause: error
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
          `Wanxiang API returned HTTP ${response.status}`,
          formatRawResponseForError(rawResponse)
        ]
          .filter(Boolean)
          .join(': '),
        retriable: response.status >= 500 || response.status === 429,
        rawResponse,
        statusCode: response.status
      });
    }

    assertWanxiangApiSuccess(rawResponse);
    return normalizeWanxiangResponse(rawResponse, this.options.resultMediaType);
  }
}

export async function postWanxiangJson(
  url: string,
  payload: WanxiangPayload,
  options: WanxiangClientOptions = {}
) {
  return new WanxiangClient(options).post(url, payload);
}

export function normalizeWanxiangResponse(
  rawResponse: unknown,
  preferredMediaType?: 'image' | 'video'
): WanxiangNormalizedResponse {
  const finalVideoUrl =
    firstStringAtPaths(rawResponse, VIDEO_URL_PATHS) ||
    (preferredMediaType === 'video'
      ? firstStringAtPaths(rawResponse, GENERIC_RESULT_URL_PATHS)
      : undefined) ||
    findUrl(rawResponse, 'video');
  const finalImageUrl =
    firstStringAtPaths(rawResponse, IMAGE_URL_PATHS) ||
    (preferredMediaType === 'image'
      ? firstStringAtPaths(rawResponse, GENERIC_RESULT_URL_PATHS)
      : undefined) ||
    findUrl(rawResponse, 'image');
  const errorMessage = firstStringAtPaths(rawResponse, ERROR_PATHS);
  const providerTaskId = firstStringAtPaths(rawResponse, TASK_ID_PATHS);
  const status = normalizeStatus(
    firstValueAtPaths(rawResponse, STATUS_PATHS),
    Boolean(finalImageUrl || finalVideoUrl),
    Boolean(errorMessage)
  );

  return {
    providerTaskId,
    status,
    finalImageUrl,
    finalVideoUrl,
    rawResponse,
    errorMessage
  };
}

function assertWanxiangApiSuccess(rawResponse: unknown) {
  const code = firstValueAtPaths(rawResponse, [
    ['code'],
    ['statusCode'],
    ['status_code'],
    ['data', 'code'],
    ['output', 'code']
  ]);
  if (code === undefined || code === null || code === '') {
    return;
  }

  const normalizedCode = String(code).toLowerCase();
  const isSuccessCode = ['0', '200', 'success', 'ok'].includes(normalizedCode);
  if (isSuccessCode) {
    return;
  }

  throw new WanxiangProviderError({
    code: 'API_ERROR',
    message:
      firstStringAtPaths(rawResponse, ERROR_PATHS) ||
      `Wanxiang API returned code ${String(code)}`,
    retriable: false,
    rawResponse
  });
}

function normalizeStatus(
  value: unknown,
  hasResultUrl: boolean,
  hasErrorMessage: boolean
): WanxiangTaskStatus {
  const status =
    typeof value === 'number' ? String(value) : String(value ?? '').toLowerCase();

  if (
    ['succeeded', 'success', 'completed', 'complete', 'finished', 'finish', 'done', '2'].includes(
      status
    )
  ) {
    return 'succeeded';
  }

  if (
    ['failed', 'failure', 'error', 'cancelled', 'canceled', 'fail', '3', '-1'].includes(
      status
    )
  ) {
    return 'failed';
  }

  if (hasErrorMessage) {
    return 'failed';
  }

  if (hasResultUrl) {
    return 'succeeded';
  }

  return 'running';
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

function findUrl(
  value: unknown,
  preferredPathToken: 'image' | 'video',
  path: string[] = []
): string | undefined {
  if (typeof value === 'string') {
    if (!/^https?:\/\//.test(value)) {
      return undefined;
    }

    const lowerPath = path.join('.').toLowerCase();
    const lowerValue = value.toLowerCase();
    if (
      lowerPath.includes(preferredPathToken) ||
      lowerValue.includes(`.${preferredPathToken === 'image' ? 'jpg' : 'mp4'}`) ||
      lowerValue.includes(`.${preferredPathToken === 'image' ? 'png' : 'mov'}`) ||
      lowerValue.includes(`.${preferredPathToken === 'image' ? 'webp' : 'webm'}`)
    ) {
      return value;
    }

    return undefined;
  }

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findUrl(item, preferredPathToken, [...path, String(index)]);
      if (found) return found;
    }
    return undefined;
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  for (const [key, child] of Object.entries(value)) {
    const found = findUrl(child, preferredPathToken, [...path, key]);
    if (found) return found;
  }

  return undefined;
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
