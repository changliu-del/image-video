import {
  getImageToVideoModelConfig,
  normalizeImageVideoModelMode,
} from '../../generations/video-models';
import {
  getDashScopeTask,
  getDashScopeVideoSynthesisUrl,
  postDashScopeJson,
} from './dashscope';
import {
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
  type WanxiangRequestOptions
} from './types';

export const DEFAULT_WANXIANG_IMAGE_TO_VIDEO_MODEL = 'wan2.6-i2v-flash';
export const DEFAULT_WANXIANG_IMAGE_TO_VIDEO_RESOLUTION = '720P';
export const DEFAULT_WANXIANG_IMAGE_TO_VIDEO_DURATION_SECONDS = 5;

export function submitImageToVideo(
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postDashScopeJson(
    options.url || getDashScopeVideoSynthesisUrl(),
    toDashScopeImageToVideoSubmitPayload(payload),
    { ...options, resultMediaType: 'video' }
  );
}

export function queryImageToVideo(
  task: string | WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return getDashScopeTask(toTaskId(task), options);
}

function toTaskId(task: string | WanxiangPayload) {
  if (typeof task === 'string') {
    return task;
  }

  const taskId =
    firstString(task.task_id) ||
    firstString(task.taskId) ||
    firstString(task.providerTaskId);

  if (!taskId) {
    throw new Error('DashScope task id is required for image-to-video query');
  }

  return taskId;
}

function toDashScopeImageToVideoSubmitPayload(
  payload: WanxiangPayload
): WanxiangPayload {
  const imgUrl =
    firstString(payload.imgUrl) ||
    firstString(payload.imageUrl) ||
    firstString(payload.inputImageUrl) ||
    firstString(payload.inputImageUrls);
  const posPrompt =
    firstString(payload.posPrompt) ||
    firstString(payload.prompt) ||
    firstString(payload.positivePrompt);
  const modelMode = normalizeImageVideoModelMode(payload.videoModelMode);
  const modelConfig = getImageToVideoModelConfig(modelMode);
  const model = firstString(payload.model) || modelConfig.providerModelId;
  const parameters: WanxiangPayload = {
    resolution:
      firstString(payload.resolution) ||
      process.env.WANXIANG_IMAGE_TO_VIDEO_RESOLUTION?.trim() ||
      modelConfig.resolution ||
      DEFAULT_WANXIANG_IMAGE_TO_VIDEO_RESOLUTION,
    duration: firstPositiveInteger(payload.durationSeconds) ??
      DEFAULT_WANXIANG_IMAGE_TO_VIDEO_DURATION_SECONDS,
    prompt_extend: readBooleanEnv(
      'WANXIANG_IMAGE_TO_VIDEO_PROMPT_EXTEND',
      true
    ),
  };

  if (model === 'wan2.6-i2v-flash') {
    parameters.audio =
      firstBoolean(payload.audio) ??
      readBooleanEnv('WANXIANG_IMAGE_TO_VIDEO_AUDIO', modelConfig.audio);
  }

  return {
    model,
    input: {
      ...(imgUrl ? { img_url: imgUrl } : {}),
      ...(posPrompt ? { prompt: posPrompt } : {}),
    },
    parameters,
  };
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function firstPositiveInteger(value: unknown): number | undefined {
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined;
}

function firstBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  }

  return undefined;
}

function readBooleanEnv(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value);
}
