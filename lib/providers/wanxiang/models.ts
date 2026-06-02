import { WanxiangProviderError } from './types';

const DEFAULT_TIMEOUT_MS = 30_000;

export type WanxiangModelCatalogItem = {
  externalId: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  tags: string[];
  sortWeight: number;
  raw: Record<string, unknown>;
};

function firstString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  return [];
}

function normalizeItem(value: unknown, index: number): WanxiangModelCatalogItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const externalId =
    firstString(record, ['externalId', 'external_id', 'modelId', 'model_id', 'id']) ??
    `wanxiang-model-${index + 1}`;
  const title =
    firstString(record, ['title', 'name', 'modelName', 'model_name']) ??
    `Model ${index + 1}`;
  const thumbnailUrl = firstString(record, [
    'thumbnailUrl',
    'thumbnail_url',
    'coverUrl',
    'cover_url',
    'posterUrl',
    'poster_url',
  ]);
  const imageUrl = firstString(record, ['imageUrl', 'image_url', 'photoUrl', 'photo_url']);
  const videoUrl = firstString(record, ['videoUrl', 'video_url', 'previewVideoUrl', 'preview_video_url']);

  if (!thumbnailUrl && !imageUrl && !videoUrl) {
    return null;
  }

  return {
    externalId,
    title,
    description: firstString(record, ['description', 'desc', 'summary']),
    thumbnailUrl,
    imageUrl,
    videoUrl,
    tags: normalizeTags(record.tags ?? record.tagList ?? record.categories),
    sortWeight: Number(record.sortWeight ?? record.sort_weight ?? 0) || 0,
    raw: record,
  };
}

function extractItems(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];

  const record = raw as Record<string, unknown>;
  for (const key of ['items', 'list', 'models', 'results']) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }

  for (const key of ['data', 'result', 'output']) {
    const nested = record[key];
    const nestedItems = extractItems(nested);
    if (nestedItems.length) return nestedItems;
  }

  return [];
}

export async function fetchWanxiangModelCatalog(input: {
  locale: string;
  fetchImpl?: typeof fetch;
}) {
  const url = process.env.WANXIANG_MODEL_CATALOG_URL;
  const appCode = process.env.WANXIANG_APPCODE;

  if (!url) {
    throw new WanxiangProviderError({
      code: 'MISSING_MODEL_CATALOG_URL',
      message: 'WANXIANG_MODEL_CATALOG_URL is required to sync model catalog',
    });
  }

  if (!appCode) {
    throw new WanxiangProviderError({
      code: 'MISSING_CREDENTIALS',
      message: 'WANXIANG_APPCODE is required for Wanxiang API requests',
    });
  }

  const requestUrl = new URL(url);
  requestUrl.searchParams.set('locale', input.locale);
  const fetchImpl = input.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetchImpl(requestUrl.toString(), {
      method: 'GET',
      headers: {
        Authorization: `APPCODE ${appCode}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    const rawResponse = await response.json().catch(() => null);

    if (!response.ok) {
      throw new WanxiangProviderError({
        code: 'HTTP_ERROR',
        message: `Wanxiang model catalog returned HTTP ${response.status}`,
        statusCode: response.status,
        rawResponse,
      });
    }

    return extractItems(rawResponse)
      .map(normalizeItem)
      .filter((item): item is WanxiangModelCatalogItem => Boolean(item));
  } finally {
    clearTimeout(timeout);
  }
}
