import 'server-only';

import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { assets, templates } from '@/lib/db/schema';
import { parseDbId } from '@/lib/db/id-schema';
import { getObjectFromR2 } from '@/lib/storage/r2';

type MediaId = string | number;

type TemplateMediaCacheEntry = {
  assetId: string;
  body: Uint8Array;
  contentType: string | null;
  etag: string | null;
  lastModified: string | null;
  storageKey: string;
  updatedAt: number;
};

type TemplateMediaCacheState = {
  entries: Map<string, TemplateMediaCacheEntry>;
  preloadPromise: Promise<TemplateMediaCacheRefreshResult> | null;
  totalBytes: number;
};

type TemplateMediaAssetRow = {
  id: number;
  mimeType: string | null;
  sizeBytes: number | null;
  status: string;
  storageKey: string;
};

type ObjectBody = {
  transformToByteArray?: () => Promise<Uint8Array>;
  transformToWebStream?: () => ReadableStream<Uint8Array>;
};

type CachedMediaResponse = {
  body: Uint8Array | null;
  headers: Headers;
  status: number;
};

type TemplateMediaCacheRefreshResult = {
  cached: number;
  failed: number;
  requested: number;
  skipped: number;
  totalBytes: number;
};

const MiB = 1024 * 1024;
const DEFAULT_MAX_TOTAL_BYTES = 512 * MiB;
const DEFAULT_MAX_ITEM_BYTES = 80 * MiB;
const globalCacheKey = '__imageVideoTemplateMediaCache';

function readPositiveIntegerEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function maxTotalBytes() {
  return readPositiveIntegerEnv(
    'TEMPLATE_MEDIA_MEMORY_CACHE_MAX_BYTES',
    DEFAULT_MAX_TOTAL_BYTES
  );
}

function maxItemBytes() {
  return readPositiveIntegerEnv(
    'TEMPLATE_MEDIA_MEMORY_CACHE_MAX_ITEM_BYTES',
    DEFAULT_MAX_ITEM_BYTES
  );
}

function cacheState() {
  const globalScope = globalThis as typeof globalThis & {
    [globalCacheKey]?: TemplateMediaCacheState;
  };

  if (!globalScope[globalCacheKey]) {
    globalScope[globalCacheKey] = {
      entries: new Map(),
      preloadPromise: null,
      totalBytes: 0,
    };
  }

  return globalScope[globalCacheKey]!;
}

function cacheKey(assetId: MediaId) {
  return String(parseDbId(assetId, 'asset ID'));
}

function deleteEntry(state: TemplateMediaCacheState, assetId: MediaId) {
  const key = cacheKey(assetId);
  const current = state.entries.get(key);
  if (!current) return;

  state.totalBytes -= current.body.byteLength;
  state.entries.delete(key);
}

function evictToFit(state: TemplateMediaCacheState) {
  const limit = maxTotalBytes();

  while (state.totalBytes > limit) {
    const oldestKey = state.entries.keys().next().value as string | undefined;
    if (!oldestKey) break;
    deleteEntry(state, oldestKey);
  }
}

async function bodyToBytes(body: unknown) {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const objectBody = body as ObjectBody;
  if (typeof objectBody.transformToByteArray === 'function') {
    return objectBody.transformToByteArray();
  }

  if (typeof objectBody.transformToWebStream !== 'function') {
    return null;
  }

  const reader = objectBody.transformToWebStream().getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk =
      value instanceof Uint8Array ? value : new Uint8Array(value);
    chunks.push(chunk);
    total += chunk.byteLength;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

function isTemplateMediaAsset(asset: TemplateMediaAssetRow) {
  return asset.status === 'uploaded' && asset.storageKey.startsWith('templates/');
}

async function getTemplateMediaAssets(assetIds: MediaId[]) {
  const ids = Array.from(
    new Set(assetIds.filter((id) => id !== '' && id != null).map((id) => parseDbId(id, 'asset ID')))
  );
  if (ids.length === 0) return [];

  return db
    .select({
      id: assets.id,
      mimeType: assets.mimeType,
      sizeBytes: assets.sizeBytes,
      status: assets.status,
      storageKey: assets.storageKey,
    })
    .from(assets)
    .where(inArray(assets.id, ids));
}

async function getAllTemplateMediaAssetIds() {
  const rows = await db
    .select({
      thumbnailAssetId: templates.thumbnailAssetId,
      previewAssetId: templates.previewAssetId,
    })
    .from(templates);

  return Array.from(
    new Set(
      rows.flatMap((row) => [row.thumbnailAssetId, row.previewAssetId])
    )
  );
}

async function cacheTemplateMediaAsset(asset: TemplateMediaAssetRow) {
  const state = cacheState();
  const key = cacheKey(asset.id);

  if (!isTemplateMediaAsset(asset)) {
    deleteEntry(state, key);
    return false;
  }

  if (asset.sizeBytes != null && asset.sizeBytes > maxItemBytes()) {
    deleteEntry(state, key);
    return false;
  }

  const object = await getObjectFromR2({ storageKey: asset.storageKey });
  const body = await bodyToBytes(object.Body);

  if (!body || body.byteLength > maxItemBytes()) {
    deleteEntry(state, key);
    return false;
  }

  deleteEntry(state, key);
  state.entries.set(key, {
    assetId: key,
    body,
    contentType: object.ContentType ?? asset.mimeType,
    etag: object.ETag ?? null,
    lastModified: object.LastModified?.toUTCString() ?? null,
    storageKey: asset.storageKey,
    updatedAt: Date.now(),
  });
  state.totalBytes += body.byteLength;
  evictToFit(state);

  return true;
}

async function cacheTemplateMediaAssets(assetIds: MediaId[]) {
  const ids = Array.from(new Set(assetIds.filter((id) => id !== '' && id != null).map(cacheKey)));
  const assetRows = await getTemplateMediaAssets(ids);
  const foundAssetIds = new Set(assetRows.map((asset) => cacheKey(asset.id)));
  const result: TemplateMediaCacheRefreshResult = {
    cached: 0,
    failed: 0,
    requested: ids.length,
    skipped: ids.filter((assetId) => !foundAssetIds.has(assetId)).length,
    totalBytes: cacheState().totalBytes,
  };

  for (const asset of assetRows) {
    try {
      const cached = await cacheTemplateMediaAsset(asset);
      if (cached) {
        result.cached += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      result.failed += 1;
      deleteTemplateMediaCacheEntries([asset.id]);
      console.error('Failed to cache template media asset', {
        assetId: asset.id,
        error,
      });
    }
  }

  result.totalBytes = cacheState().totalBytes;
  return result;
}

export function getTemplateMediaCacheEntry(assetId: MediaId) {
  return cacheState().entries.get(cacheKey(assetId)) ?? null;
}

export async function refreshTemplateMediaCache(assetIds: MediaId[]) {
  return cacheTemplateMediaAssets(assetIds);
}

export async function refreshTemplateMediaCacheForAsset(assetId: MediaId) {
  const [asset] = await getTemplateMediaAssets([assetId]);
  if (!asset) {
    deleteTemplateMediaCacheEntries([assetId]);
    return;
  }

  await cacheTemplateMediaAsset(asset);
}

export function startTemplateMediaCachePreload() {
  const state = cacheState();
  if (state.preloadPromise) return state.preloadPromise;

  state.preloadPromise = (async () => {
    const assetIds = await getAllTemplateMediaAssetIds();
    const result = await cacheTemplateMediaAssets(assetIds);

    console.info('Template media memory cache preloaded', {
      ...result,
      totalMiB: Number((result.totalBytes / MiB).toFixed(2)),
    });

    return result;
  })().catch((error) => {
    state.preloadPromise = null;
    console.error('Failed to preload template media memory cache', error);
    throw error;
  });

  return state.preloadPromise;
}

export function deleteTemplateMediaCacheEntries(assetIds: MediaId[]) {
  const state = cacheState();

  for (const assetId of assetIds) {
    deleteEntry(state, assetId);
  }
}

function parseRange(rangeHeader: string | null, size: number) {
  if (!rangeHeader) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match) return { invalid: true as const };

  const [, rawStart, rawEnd] = match;
  if (!rawStart && !rawEnd) return { invalid: true as const };

  let start: number;
  let end: number;

  if (!rawStart) {
    const suffixLength = Number(rawEnd);
    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      return { invalid: true as const };
    }
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd ? Number(rawEnd) : size - 1;
  }

  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start ||
    start >= size
  ) {
    return { invalid: true as const };
  }

  return {
    invalid: false as const,
    start,
    end: Math.min(end, size - 1),
  };
}

export function createCachedTemplateMediaResponse(
  entry: TemplateMediaCacheEntry,
  rangeHeader: string | null
): CachedMediaResponse {
  const size = entry.body.byteLength;
  const range = parseRange(rangeHeader, size);
  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
  });

  if (entry.contentType) headers.set('Content-Type', entry.contentType);
  if (entry.etag) headers.set('ETag', entry.etag);
  if (entry.lastModified) headers.set('Last-Modified', entry.lastModified);

  if (range?.invalid) {
    headers.set('Content-Range', `bytes */${size}`);
    return {
      body: null,
      headers,
      status: 416,
    };
  }

  if (range) {
    const body = entry.body.subarray(range.start, range.end + 1);
    headers.set('Content-Length', String(body.byteLength));
    headers.set('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
    return {
      body,
      headers,
      status: 206,
    };
  }

  headers.set('Content-Length', String(size));
  return {
    body: entry.body,
    headers,
    status: 200,
  };
}
