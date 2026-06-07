import 'server-only';

import { randomUUID } from 'crypto';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  LIBRARY_ASSET_CATEGORIES,
  libraryAssets,
  type Asset,
  type LibraryAsset,
  type LibraryAssetCategory,
} from '@/lib/db/schema';
import {
  hasAdminAccess,
  requireAdmin,
  requireOpsOrAdmin,
} from '@/lib/db/queries';
import {
  buildLibraryAssetStorageKey,
  buildPublicUrl,
  createSignedAdminMediaPutUrl,
  isAdminMediaMimeType,
  storageKeyMatchesLibraryAsset,
  verifyUploadedObject,
  type AdminMediaMimeType,
} from '@/lib/storage/r2';
import {
  exactCol,
  ilikeCol,
  withPagination,
  type PaginatedResult,
} from './shared';

const MAX_LIBRARY_ASSET_BYTES = 80 * 1024 * 1024;
const libraryAssetIdSchema = z.string().uuid();

type AdminLibraryAssetRecord = {
  asset: Asset | null;
  libraryAsset: LibraryAsset;
};

export type AdminLibraryAssetListItem = {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  category: LibraryAssetCategory;
  sortWeight: number;
  usageCount: number;
  assetUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  storageKey: string | null;
  createdAt: string;
  updatedAt: string;
};

const metadataSchema = z
  .object({
    title: z.string().trim().min(2).max(140),
    description: z.string().trim().max(1200).optional().nullable(),
    category: z.enum(LIBRARY_ASSET_CATEGORIES),
    sortWeight: z.coerce.number().int().min(-9999).max(9999).default(0),
  })
  .strict();

const presignLibraryAssetSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(120),
    sizeBytes: z.coerce.number().int().positive().max(MAX_LIBRARY_ASSET_BYTES),
  })
  .strict();

const completeLibraryAssetSchema = metadataSchema
  .extend({
    assetId: z.string().uuid(),
    storageKey: z.string().trim().min(1).max(512),
  })
  .strict();

function normalizeMetadata(input: unknown) {
  const parsed = metadataSchema.parse(input);

  return {
    ...parsed,
    description: parsed.description?.trim() || null,
  };
}

function adminLibraryAssetRecordToListItem({
  asset,
  libraryAsset,
}: AdminLibraryAssetRecord): AdminLibraryAssetListItem {
  return {
    id: libraryAsset.id,
    assetId: libraryAsset.assetId,
    title: libraryAsset.title,
    description: libraryAsset.description,
    category: libraryAsset.category,
    sortWeight: libraryAsset.sortWeight,
    usageCount: libraryAsset.usageCount,
    assetUrl: asset?.publicUrl ?? null,
    mimeType: asset?.mimeType ?? null,
    sizeBytes: asset?.sizeBytes ?? null,
    width: asset?.width ?? null,
    height: asset?.height ?? null,
    durationSeconds: asset?.durationSeconds ?? null,
    storageKey: asset?.storageKey ?? null,
    createdAt: libraryAsset.createdAt.toISOString(),
    updatedAt: libraryAsset.updatedAt.toISOString(),
  };
}

async function getAdminLibraryAssetRecord(id: string) {
  const [row] = await db
    .select({ libraryAsset: libraryAssets, asset: assets })
    .from(libraryAssets)
    .leftJoin(assets, eq(libraryAssets.assetId, assets.id))
    .where(eq(libraryAssets.id, id))
    .limit(1);

  if (!row) {
    throw new Error('Library asset not found');
  }

  return row;
}

export async function listAdminLibraryAssets(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminLibraryAssetListItem>> {
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
        exactCol(libraryAssets.id, query),
        exactCol(libraryAssets.assetId, query),
        ilikeCol(libraryAssets.title, query),
        ilikeCol(libraryAssets.description, query),
        ilikeCol(libraryAssets.category, query),
        ilikeCol(assets.mimeType, query)
      )
    : undefined;

  const [rows, countResult] = await Promise.all([
    withPagination(
      db
        .select({ libraryAsset: libraryAssets, asset: assets })
        .from(libraryAssets)
        .leftJoin(assets, eq(libraryAssets.assetId, assets.id))
        .where(where)
        .orderBy(desc(libraryAssets.updatedAt)),
      page,
      pageSize
    ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(libraryAssets)
      .leftJoin(assets, eq(libraryAssets.assetId, assets.id))
      .where(where),
  ]);

  return {
    list: rows.map(adminLibraryAssetRecordToListItem),
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function createLibraryAssetPresign(input: unknown) {
  const user = await requireOpsOrAdmin();
  const payload = presignLibraryAssetSchema.parse(input);

  if (!isAdminMediaMimeType(payload.mimeType)) {
    throw new Error('Unsupported library asset MIME type');
  }

  const assetId = randomUUID();
  const mimeType = payload.mimeType as AdminMediaMimeType;
  const storageKey = buildLibraryAssetStorageKey(assetId, mimeType);
  const publicUrl = buildPublicUrl(storageKey);
  const uploadUrl = await createSignedAdminMediaPutUrl({
    storageKey,
    mimeType,
    sizeBytes: payload.sizeBytes,
  });

  await db.insert(assets).values({
    id: assetId,
    userId: user.id,
    type: 'upload',
    status: 'pending',
    storageKey,
    publicUrl,
    mimeType,
    sizeBytes: payload.sizeBytes,
  });

  return { assetId, uploadUrl, storageKey, publicUrl };
}

export async function completeLibraryAsset(input: unknown) {
  const user = await requireOpsOrAdmin();
  const payload = completeLibraryAssetSchema.parse(input);
  const { assetId, storageKey, ...metadataInput } = payload;
  const metadata = normalizeMetadata(metadataInput);

  const [asset] = await db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.id, assetId),
        eq(assets.type, 'upload'),
        eq(assets.storageKey, storageKey)
      )
    )
    .limit(1);

  if (!asset) {
    throw new Error('Library upload asset not found');
  }

  if (!hasAdminAccess(user) && asset.userId !== user.id) {
    throw new Error('Ops can only complete their own library uploads');
  }

  if (!storageKeyMatchesLibraryAsset(assetId, storageKey)) {
    throw new Error('Storage key does not match this library asset');
  }

  const uploadedObjectMatches = await verifyUploadedObject({
    storageKey,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
  }).catch(() => false);

  if (!uploadedObjectMatches) {
    throw new Error('Invalid uploaded object metadata');
  }

  const [row] = await db.transaction(async (tx) => {
    await tx
      .update(assets)
      .set({ status: 'uploaded', updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(assets.id, assetId));

    return tx
      .insert(libraryAssets)
      .values({
        assetId,
        title: metadata.title,
        description: metadata.description,
        category: metadata.category,
        sortWeight: metadata.sortWeight,
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();
  });

  return adminLibraryAssetRecordToListItem({
    libraryAsset: row,
    asset: { ...asset, status: 'uploaded' },
  });
}

export async function updateLibraryAsset(id: string, input: unknown) {
  const user = await requireOpsOrAdmin();
  const libraryAssetId = libraryAssetIdSchema.parse(id);
  const metadata = normalizeMetadata(input);
  const existing = await getAdminLibraryAssetRecord(libraryAssetId);

  const [row] = await db
    .update(libraryAssets)
    .set({
      title: metadata.title,
      description: metadata.description,
      category: metadata.category,
      sortWeight: metadata.sortWeight,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(libraryAssets.id, libraryAssetId))
    .returning();

  return adminLibraryAssetRecordToListItem({
    libraryAsset: row,
    asset: existing.asset,
  });
}

export async function removeLibraryAsset(id: string) {
  await requireAdmin();
  const libraryAssetId = libraryAssetIdSchema.parse(id);
  const [row] = await db
    .delete(libraryAssets)
    .where(eq(libraryAssets.id, libraryAssetId))
    .returning({ id: libraryAssets.id });

  if (!row) {
    throw new Error('Library asset not found');
  }
}
