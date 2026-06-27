import {
  getDashScopeImageGenerationUrl,
  getDashScopeTask,
  postDashScopeJson,
} from './dashscope';
import {
  type WanxiangNormalizedResponse,
  type WanxiangPayload,
  type WanxiangRequestOptions,
} from './types';

export const DEFAULT_WANXIANG_IMAGE_EDIT_MODEL = 'wan2.7-image-pro';
export const DEFAULT_WANXIANG_IMAGE_EDIT_SIZE = '2K';

const ASPECT_RATIO_SIZES: Record<string, string> = {
  '1:1': '2048*2048',
  '3:4': '1536*2048',
  '9:16': '1152*2048',
  '16:9': '2048*1152',
};

export type WanxiangImageEditKind = 'apparel_image' | 'try_on';

export function submitImageEdit(
  kind: WanxiangImageEditKind,
  payload: WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return postDashScopeJson(
    options.url || getDashScopeImageGenerationUrl(),
    toDashScopeImageEditSubmitPayload(kind, payload),
    { ...options, resultMediaType: 'image' }
  );
}

export function queryImageEdit(
  task: string | WanxiangPayload,
  options: WanxiangRequestOptions = {}
): Promise<WanxiangNormalizedResponse> {
  return getDashScopeTask(toTaskId(task), {
    ...options,
    resultMediaType: 'image',
  });
}

function toDashScopeImageEditSubmitPayload(
  kind: WanxiangImageEditKind,
  payload: WanxiangPayload
): WanxiangPayload {
  const prompt =
    firstString(payload.prompt) ||
    firstString(payload.posPrompt) ||
    firstString(payload.positivePrompt);
  const aspectRatio = firstString(payload.aspectRatio);
  const size =
    firstString(payload.size) ||
    (aspectRatio ? ASPECT_RATIO_SIZES[aspectRatio] : undefined) ||
    DEFAULT_WANXIANG_IMAGE_EDIT_SIZE;

  return {
    model:
      firstString(payload.model) ||
      process.env.WANXIANG_IMAGE_EDIT_MODEL?.trim() ||
      DEFAULT_WANXIANG_IMAGE_EDIT_MODEL,
    input: {
      messages: [
        {
          role: 'user',
          content:
            kind === 'try_on'
              ? buildTryOnContent(payload, prompt)
              : buildApparelImageContent(payload, prompt),
        },
      ],
    },
    parameters: {
      size,
      n: 1,
      watermark: false,
    },
  };
}

function buildApparelImageContent(payload: WanxiangPayload, prompt?: string) {
  const imageUrl =
    firstString(payload.inputImageUrl) ||
    firstString(payload.imageUrl) ||
    firstString(payload.imgUrl);

  const text =
    prompt ||
    'Create a polished ecommerce product image from the reference image. Keep the product identity accurate, improve lighting and composition, and avoid adding unrelated objects.';

  return [
    ...(imageUrl ? [{ image: imageUrl }] : []),
    { text },
  ];
}

function buildTryOnContent(payload: WanxiangPayload, prompt?: string) {
  const modelImageUrl = firstString(payload.modelImageUrl);
  const garmentImageUrls = firstStringArray(payload.garmentImageUrls);
  const text =
    prompt ||
    'Create a natural virtual try-on image. Dress the person in the model image with the provided garment reference images, preserve the person identity and pose, keep fabric details accurate, and make lighting and fit realistic.';

  return [
    ...garmentImageUrls.map((image) => ({ image })),
    ...(modelImageUrl ? [{ image: modelImageUrl }] : []),
    { text },
  ];
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
    throw new Error('DashScope task id is required for image edit query');
  }

  return taskId;
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstString(item);
      if (found) return found;
    }
  }

  return undefined;
}

function firstStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const single = firstString(value);
    return single ? [single] : [];
  }

  return value
    .map((item) => firstString(item))
    .filter((item): item is string => Boolean(item));
}
