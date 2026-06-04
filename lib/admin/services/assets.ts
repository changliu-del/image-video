import 'server-only';

import { desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { ASSET_STATUSES, assets } from '@/lib/db/schema';
import { requireAdmin, requireOpsOrAdmin } from '@/lib/db/queries';
import {
  exactCol,
  ilikeCol,
  withPagination,
  type PaginatedResult,
} from './shared';

const assetIdSchema = z.string().uuid();
type AdminMediaKind = 'image' | 'video' | 'file';
type AdminAssetListItem = typeof assets.$inferSelect & {
  previewUrl: string | null;
  previewMimeType: string | null;
  mediaKind: AdminMediaKind;
};

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  png: 'image/png',
  webm: 'video/webm',
  webp: 'image/webp',
};

const updateAssetSchema = z
  .object({
    status: z.enum(ASSET_STATUSES).optional(),
    publicUrl: z.string().trim().min(1).max(2000).optional(),
    mimeType: z.string().trim().max(120).nullable().optional(),
    width: z.number().int().positive().nullable().optional(),
    height: z.number().int().positive().nullable().optional(),
    durationSeconds: z.number().int().min(0).nullable().optional(),
  })
  .strict();

function inferAdminMediaKind(input: {
  mimeType?: string | null;
  publicUrl?: string | null;
}): AdminMediaKind {
  const mimeType = input.mimeType?.trim().toLowerCase().split(';')[0] ?? '';
  const url = input.publicUrl?.toLowerCase() ?? '';

  if (
    mimeType.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/.test(url)
  ) {
    return 'image';
  }

  if (
    mimeType.startsWith('video/') ||
    /\.(mp4|webm|mov|m4v)(\?|#|$)/.test(url)
  ) {
    return 'video';
  }

  return 'file';
}

function inferMimeTypeFromUrl(publicUrl: string | null | undefined) {
  const extension = publicUrl
    ?.trim()
    .toLowerCase()
    .split(/[?#]/)[0]
    ?.match(/\.([a-z0-9]+)$/)?.[1];

  return extension ? MIME_TYPE_BY_EXTENSION[extension] ?? null : null;
}

function previewMimeTypeForAsset(asset: typeof assets.$inferSelect) {
  const mimeType = asset.mimeType?.trim() || null;

  if (mediaKindFromMimeType(mimeType)) {
    return mimeType;
  }

  return inferMimeTypeFromUrl(asset.publicUrl) ?? mimeType;
}

function mediaKindFromMimeType(mimeType: string | null | undefined) {
  const normalized = mimeType?.trim().toLowerCase().split(';')[0] ?? '';
  if (normalized.startsWith('image/')) return 'image';
  if (normalized.startsWith('video/')) return 'video';
  return null;
}

function adminAssetToListItem(
  asset: typeof assets.$inferSelect
): AdminAssetListItem {
  const mediaKind = inferAdminMediaKind(asset);

  return {
    ...asset,
    previewUrl: mediaKind === 'file' ? null : asset.publicUrl,
    previewMimeType: previewMimeTypeForAsset(asset),
    mediaKind,
  };
}

export async function listAssets(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminAssetListItem>> {
  await requireOpsOrAdmin();
  const { search, page, pageSize } = {
    search: '',
    page: 1,
    pageSize: 20,
    ...params,
  };
  const query = search.trim();
  const where = query
    ? or(
        exactCol(assets.id, query),
        exactCol(assets.userId, query),
        ilikeCol(assets.type, query),
        ilikeCol(assets.status, query),
        ilikeCol(assets.mimeType, query)
      )
    : undefined;
  const [rows, countResult] = await Promise.all([
    withPagination(
      db.select().from(assets).where(where).orderBy(desc(assets.createdAt)),
      page,
      pageSize
    ),
    db.select({ count: sql<number>`count(*)` }).from(assets).where(where),
  ]);
  return {
    list: rows.map(adminAssetToListItem),
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function updateAsset(id: string, data: unknown) {
  await requireAdmin();
  const assetId = assetIdSchema.parse(id);
  const parsed = updateAssetSchema.parse(data);
  const update: Partial<typeof assets.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.status !== undefined) {
    update.status = parsed.status;
  }

  if (parsed.publicUrl !== undefined) {
    update.publicUrl = parsed.publicUrl;
  }

  if (parsed.mimeType !== undefined) {
    update.mimeType = parsed.mimeType?.trim() || null;
  }

  if (parsed.width !== undefined) {
    update.width = parsed.width;
  }

  if (parsed.height !== undefined) {
    update.height = parsed.height;
  }

  if (parsed.durationSeconds !== undefined) {
    update.durationSeconds = parsed.durationSeconds;
  }

  if (Object.keys(update).length === 1) {
    throw new Error('No fields to update');
  }

  const [row] = await db
    .update(assets)
    .set(update)
    .where(eq(assets.id, assetId))
    .returning();

  if (!row) {
    throw new Error('Asset not found');
  }

  return adminAssetToListItem(row);
}

export async function removeAsset(id: string) {
  await requireAdmin();
  const assetId = assetIdSchema.parse(id);
  const [row] = await db
    .delete(assets)
    .where(eq(assets.id, assetId))
    .returning({ id: assets.id });

  if (!row) {
    throw new Error('Asset not found');
  }
}
