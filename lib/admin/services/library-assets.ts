import 'server-only';

import { randomUUID } from 'crypto';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  GENERATION_TYPES,
  LIBRARY_ASSET_KINDS,
  LIBRARY_ASSET_STATUSES,
  libraryAssets,
  type Asset,
  type GenerationType,
  type LibraryAsset,
  type LibraryAssetKind,
  type LibraryAssetStatus,
} from '@/lib/db/schema';
import {
  hasAdminAccess,
  requireAdmin,
  requireOpsOrAdmin,
} from '@/lib/db/queries';
import { locales } from '@/lib/marketing/content';
import {
  buildLibraryAssetStorageKey,
  buildPublicUrl,
  createSignedTemplateAssetPutUrl,
  isTemplateAssetMimeType,
  storageKeyMatchesLibraryAsset,
  verifyUploadedObject,
  type TemplateAssetMimeType,
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
  locale: string;
  title: string;
  description: string | null;
  kind: LibraryAssetKind;
  status: LibraryAssetStatus;
  source: string | null;
  licenseNote: string | null;
  tags: string[];
  useCases: GenerationType[];
  qualityScore: number;
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
  publishedAt: string | null;
};

const metadataSchema = z
  .object({
    locale: z.enum(locales).default('pt'),
    title: z.string().trim().min(2).max(140),
    description: z.string().trim().max(1200).optional().nullable(),
    kind: z.enum(LIBRARY_ASSET_KINDS),
    status: z.enum(LIBRARY_ASSET_STATUSES).default('draft'),
    source: z.string().trim().max(80).optional().nullable(),
    licenseNote: z.string().trim().max(2000).optional().nullable(),
    tags: z.array(z.string().trim().min(1).max(80)).default([]),
    useCases: z.array(z.enum(GENERATION_TYPES)).default([]),
    qualityScore: z.coerce.number().int().min(0).max(100).default(0),
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

function defaultUseCases(kind: LibraryAssetKind): GenerationType[] {
  if (kind === 'model_image' || kind === 'garment_image') {
    return ['try_on'];
  }

  if (kind === 'example_video') {
    return ['image_to_video'];
  }

  if (kind === 'scene_image') {
    return ['image_to_video', 'apparel_image', 'try_on'];
  }

  return ['image_to_video', 'apparel_image'];
}

function normalizeTags(tags: string[]) {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => /^[a-z0-9][a-z0-9_-]*$/.test(tag))
    )
  ).slice(0, 24);
}

function normalizeMetadata(input: unknown) {
  const parsed = metadataSchema.parse(input);
  const useCases = parsed.useCases.length
    ? Array.from(new Set(parsed.useCases))
    : defaultUseCases(parsed.kind);

  return {
    ...parsed,
    description: parsed.description?.trim() || null,
    source: parsed.source?.trim() || null,
    licenseNote: parsed.licenseNote?.trim() || null,
    tags: normalizeTags(parsed.tags),
    useCases,
  };
}

function statusForUser(
  user: Awaited<ReturnType<typeof requireOpsOrAdmin>>,
  requestedStatus: LibraryAssetStatus
) {
  if (requestedStatus !== 'draft' && !hasAdminAccess(user)) {
    return 'draft';
  }

  return requestedStatus;
}

function assertCanMutateLibraryAsset(
  user: Awaited<ReturnType<typeof requireOpsOrAdmin>>,
  libraryAsset: Pick<LibraryAsset, 'status'>,
  action: 'edit' | 'upload'
) {
  if (!hasAdminAccess(user) && libraryAsset.status !== 'draft') {
    throw new Error(`Ops can only ${action} draft library assets`);
  }
}

function assertPublishableAsset(asset: Asset | null) {
  if (!asset || asset.status !== 'uploaded') {
    throw new Error('Cannot publish a library asset without an uploaded file');
  }
}

function adminLibraryAssetRecordToListItem({
  asset,
  libraryAsset,
}: AdminLibraryAssetRecord): AdminLibraryAssetListItem {
  return {
    id: libraryAsset.id,
    assetId: libraryAsset.assetId,
    locale: libraryAsset.locale,
    title: libraryAsset.title,
    description: libraryAsset.description,
    kind: libraryAsset.kind,
    status: libraryAsset.status,
    source: libraryAsset.source,
    licenseNote: libraryAsset.licenseNote,
    tags: libraryAsset.tagsJson,
    useCases: libraryAsset.useCasesJson,
    qualityScore: libraryAsset.qualityScore,
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
    publishedAt: libraryAsset.publishedAt?.toISOString() ?? null,
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
        ilikeCol(libraryAssets.kind, query),
        ilikeCol(libraryAssets.status, query),
        ilikeCol(libraryAssets.locale, query),
        ilikeCol(libraryAssets.source, query),
        ilikeCol(libraryAssets.licenseNote, query),
        ilikeCol(assets.mimeType, query),
        sql`${libraryAssets.tagsJson}::text ILIKE ${'%' + query + '%'}`,
        sql`${libraryAssets.useCasesJson}::text ILIKE ${'%' + query + '%'}`
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

  if (!isTemplateAssetMimeType(payload.mimeType)) {
    throw new Error('Unsupported library asset MIME type');
  }

  const assetId = randomUUID();
  const mimeType = payload.mimeType as TemplateAssetMimeType;
  const storageKey = buildLibraryAssetStorageKey(assetId, mimeType);
  const publicUrl = buildPublicUrl(storageKey);
  const uploadUrl = await createSignedTemplateAssetPutUrl({
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

  const status = statusForUser(user, metadata.status);
  if (status === 'published') {
    assertPublishableAsset({ ...asset, status: 'uploaded' });
  }

  const publishedAt = status === 'published' ? new Date() : null;

  const [row] = await db.transaction(async (tx) => {
    await tx
      .update(assets)
      .set({ status: 'uploaded', updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(assets.id, assetId));

    return tx
      .insert(libraryAssets)
      .values({
        assetId,
        locale: metadata.locale,
        title: metadata.title,
        description: metadata.description,
        kind: metadata.kind,
        status,
        source: metadata.source,
        licenseNote: metadata.licenseNote,
        tagsJson: metadata.tags,
        useCasesJson: metadata.useCases,
        qualityScore: metadata.qualityScore,
        sortWeight: metadata.sortWeight,
        createdBy: user.id,
        updatedBy: user.id,
        publishedBy: status === 'published' ? user.id : null,
        publishedAt,
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

  assertCanMutateLibraryAsset(user, existing.libraryAsset, 'edit');

  const status = statusForUser(user, metadata.status);
  if (status === 'published') {
    assertPublishableAsset(existing.asset);
  }

  const shouldMarkPublished =
    status === 'published' && existing.libraryAsset.status !== 'published';

  const [row] = await db
    .update(libraryAssets)
    .set({
      locale: metadata.locale,
      title: metadata.title,
      description: metadata.description,
      kind: metadata.kind,
      status,
      source: metadata.source,
      licenseNote: metadata.licenseNote,
      tagsJson: metadata.tags,
      useCasesJson: metadata.useCases,
      qualityScore: metadata.qualityScore,
      sortWeight: metadata.sortWeight,
      updatedBy: user.id,
      updatedAt: new Date(),
      ...(shouldMarkPublished
        ? { publishedBy: user.id, publishedAt: new Date() }
        : {}),
    })
    .where(eq(libraryAssets.id, libraryAssetId))
    .returning();

  return adminLibraryAssetRecordToListItem({
    libraryAsset: row,
    asset: existing.asset,
  });
}

export async function publishLibraryAsset(id: string) {
  const user = await requireAdmin();
  const libraryAssetId = libraryAssetIdSchema.parse(id);
  const existing = await getAdminLibraryAssetRecord(libraryAssetId);

  assertPublishableAsset(existing.asset);

  const [row] = await db
    .update(libraryAssets)
    .set({
      status: 'published',
      publishedBy: user.id,
      publishedAt: new Date(),
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(libraryAssets.id, libraryAssetId))
    .returning();

  if (!row) {
    throw new Error('Library asset not found');
  }

  return adminLibraryAssetRecordToListItem({
    libraryAsset: row,
    asset: existing.asset,
  });
}

export async function archiveLibraryAsset(id: string) {
  const user = await requireAdmin();
  const libraryAssetId = libraryAssetIdSchema.parse(id);
  const [row] = await db
    .update(libraryAssets)
    .set({
      status: 'archived',
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(libraryAssets.id, libraryAssetId))
    .returning();

  if (!row) {
    throw new Error('Library asset not found');
  }

  const existing = await getAdminLibraryAssetRecord(row.id);
  return adminLibraryAssetRecordToListItem(existing);
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
