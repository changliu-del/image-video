import 'server-only';

import { and, desc, eq, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  generationJobs,
  libraryAssets,
  userMediaHistory,
  type Asset,
  type GenerationJob,
  type LibraryAsset,
  type NewUserMediaHistory,
  type UserMediaHistory,
} from '@/lib/db/schema';
import {
  createUserMediaHistoryInputSchema,
  updateUserMediaHistoryInputSchema,
  userMediaIdSchema,
  type CreateUserMediaHistoryInput,
  type ListUserMediaQuery,
  type UpdateUserMediaHistoryInput,
} from './validation';

export class UserMediaError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

type UserMediaRecord = {
  userMedia: UserMediaHistory;
  asset: Asset;
  libraryAsset: LibraryAsset | null;
};

type MinimalGenerationJob = Pick<
  GenerationJob,
  'id' | 'userId' | 'generationType'
>;

const userMediaRecency =
  sql<Date>`coalesce(${userMediaHistory.lastUsedAt}, ${userMediaHistory.updatedAt})`;

export type UserMediaCatalogItem = {
  id: string;
  assetId: string;
  source: UserMediaHistory['source'];
  title: string | null;
  description: string | null;
  generationType: UserMediaHistory['generationType'];
  assetUrl: string;
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  publicUrl: string;
  mimeType: string | null;
  isFavorite: boolean;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ListUserMediaInput = ListUserMediaQuery & {
  userId: number;
};

export type ListUserMediaResult = {
  items: UserMediaCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function notFound(message = 'User media item not found') {
  return new UserMediaError(404, 'user_media_not_found', message);
}

function isVideoAsset(asset: Asset) {
  return (
    asset.mimeType?.startsWith('video/') ||
    asset.type === 'final_video'
  );
}

function mapUserMediaRecord({
  asset,
  libraryAsset,
  userMedia,
}: UserMediaRecord): UserMediaCatalogItem {
  const video = isVideoAsset(asset);

  return {
    id: userMedia.id,
    assetId: userMedia.assetId,
    source: userMedia.source,
    title: userMedia.title ?? libraryAsset?.title ?? null,
    description: userMedia.description ?? libraryAsset?.description ?? null,
    generationType: userMedia.generationType,
    assetUrl: asset.publicUrl,
    imageUrl: video ? null : asset.publicUrl,
    videoUrl: video ? asset.publicUrl : null,
    thumbnailUrl: video ? null : asset.publicUrl,
    publicUrl: asset.publicUrl,
    mimeType: asset.mimeType,
    isFavorite: userMedia.isFavorite,
    usedCount: userMedia.usedCount,
    createdAt: userMedia.createdAt.toISOString(),
    updatedAt: userMedia.updatedAt.toISOString(),
  };
}

function roleWhere(role: UserMediaHistory['role']) {
  return role == null
    ? isNull(userMediaHistory.role)
    : eq(userMediaHistory.role, role);
}

async function getUserMediaRecord(userId: number, id: string) {
  const [row] = await db
    .select({
      userMedia: userMediaHistory,
      asset: assets,
      libraryAsset: libraryAssets,
    })
    .from(userMediaHistory)
    .innerJoin(assets, eq(userMediaHistory.assetId, assets.id))
    .leftJoin(libraryAssets, eq(userMediaHistory.libraryAssetId, libraryAssets.id))
    .where(and(eq(userMediaHistory.id, id), eq(userMediaHistory.userId, userId)))
    .limit(1);

  return row ?? null;
}

async function getMatchingLibraryAsset(
  assetId: string,
  libraryAssetId?: string | null
) {
  const where = libraryAssetId
    ? and(eq(libraryAssets.id, libraryAssetId), eq(libraryAssets.assetId, assetId))
    : eq(libraryAssets.assetId, assetId);

  const [row] = await db
    .select()
    .from(libraryAssets)
    .where(where)
    .limit(1);

  return row ?? null;
}

async function getGenerationJobForUser(
  generationJobId: string | null | undefined,
  userId: number
): Promise<MinimalGenerationJob | null> {
  if (!generationJobId) {
    return null;
  }

  const [row] = await db
    .select({
      id: generationJobs.id,
      userId: generationJobs.userId,
      generationType: generationJobs.generationType,
    })
    .from(generationJobs)
    .where(and(eq(generationJobs.id, generationJobId), eq(generationJobs.userId, userId)))
    .limit(1);

  return row ?? null;
}

async function normalizeCreateInput(input: CreateUserMediaHistoryInput) {
  const payload = createUserMediaHistoryInputSchema.parse(input);

  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, payload.assetId))
    .limit(1);

  if (!asset) {
    throw notFound('Asset not found');
  }

  if (asset.status !== 'uploaded') {
    throw new UserMediaError(
      400,
      'asset_not_uploaded',
      'Asset must be uploaded before it can be added to media history'
    );
  }

  const shouldLoadLibraryAsset =
    Boolean(payload.libraryAssetId) || payload.source === 'ops_library_used';
  const matchingLibraryAsset = shouldLoadLibraryAsset
    ? await getMatchingLibraryAsset(payload.assetId, payload.libraryAssetId)
    : null;

  if (payload.libraryAssetId && !matchingLibraryAsset) {
    throw new UserMediaError(
      400,
      'library_asset_mismatch',
      'Library asset does not match this asset'
    );
  }

  if (asset.userId !== payload.userId && !matchingLibraryAsset) {
    throw notFound('Asset not found');
  }

  const generationJob = await getGenerationJobForUser(
    payload.generationJobId,
    payload.userId
  );

  if (payload.generationJobId && !generationJob) {
    throw notFound('Generation job not found');
  }

  if (
    payload.generationType &&
    generationJob &&
    payload.generationType !== generationJob.generationType
  ) {
    throw new UserMediaError(
      400,
      'generation_type_mismatch',
      'Generation type does not match this generation job'
    );
  }

  const generationType =
    payload.generationType ??
    generationJob?.generationType ??
    matchingLibraryAsset?.category ??
    null;

  return {
    payload,
    asset,
    libraryAsset: matchingLibraryAsset,
    values: {
      userId: payload.userId,
      assetId: payload.assetId,
      libraryAssetId: matchingLibraryAsset?.id ?? payload.libraryAssetId ?? null,
      generationJobId: generationJob?.id ?? null,
      source: payload.source,
      generationType,
      role: payload.role ?? null,
      title: payload.title ?? matchingLibraryAsset?.title ?? null,
      description:
        payload.description ?? matchingLibraryAsset?.description ?? null,
      visibility: payload.visibility ?? 'active',
      isFavorite: payload.isFavorite ?? false,
      usedCount: payload.usedCount ?? 0,
      lastUsedAt: payload.lastUsedAt ?? null,
    } satisfies NewUserMediaHistory,
  };
}

function buildListWhere(input: ListUserMediaInput) {
  const conditions: SQL[] = [
    eq(userMediaHistory.userId, input.userId),
    eq(userMediaHistory.visibility, input.visibility),
    eq(assets.status, 'uploaded'),
  ];

  if (input.source) {
    conditions.push(eq(userMediaHistory.source, input.source));
  }

  if (input.generationType) {
    conditions.push(
      or(
        eq(userMediaHistory.generationType, input.generationType),
        isNull(userMediaHistory.generationType)
      )!
    );
  }

  if (input.role) {
    conditions.push(eq(userMediaHistory.role, input.role));
  }

  if (input.isFavorite !== undefined) {
    conditions.push(eq(userMediaHistory.isFavorite, input.isFavorite));
  }

  return and(...conditions);
}

export async function listUserMedia(
  input: ListUserMediaInput
): Promise<ListUserMediaResult> {
  const where = buildListWhere(input);
  const offset = (input.page - 1) * input.pageSize;

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        userMedia: userMediaHistory,
        asset: assets,
        libraryAsset: libraryAssets,
      })
      .from(userMediaHistory)
      .innerJoin(assets, eq(userMediaHistory.assetId, assets.id))
      .leftJoin(libraryAssets, eq(userMediaHistory.libraryAssetId, libraryAssets.id))
      .where(where)
      .orderBy(
        desc(userMediaHistory.isFavorite),
        desc(userMediaRecency),
        desc(userMediaHistory.updatedAt)
      )
      .limit(input.pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userMediaHistory)
      .innerJoin(assets, eq(userMediaHistory.assetId, assets.id))
      .where(where),
  ]);

  const total = Number(totalRows[0]?.count ?? 0);

  return {
    items: rows.map(mapUserMediaRecord),
    total,
    page: input.page,
    pageSize: input.pageSize,
    hasMore: input.page * input.pageSize < total,
  };
}

export async function createUserMediaHistory(
  input: CreateUserMediaHistoryInput
) {
  const normalized = await normalizeCreateInput(input);
  const [row] = await db
    .insert(userMediaHistory)
    .values(normalized.values)
    .returning();

  return mapUserMediaRecord({
    userMedia: row,
    asset: normalized.asset,
    libraryAsset: normalized.libraryAsset,
  });
}

export async function upsertUserMediaHistory(
  input: CreateUserMediaHistoryInput
) {
  const normalized = await normalizeCreateInput(input);
  const usedCountIncrement = normalized.payload.usedCount ?? 1;
  const usedAt =
    normalized.payload.lastUsedAt === undefined
      ? new Date()
      : normalized.values.lastUsedAt;

  const [existing] = await db
    .select()
    .from(userMediaHistory)
    .where(
      and(
        eq(userMediaHistory.userId, normalized.values.userId),
        eq(userMediaHistory.assetId, normalized.values.assetId),
        eq(userMediaHistory.source, normalized.values.source),
        roleWhere(normalized.values.role ?? null)
      )
    )
    .limit(1);

  if (!existing) {
    return createUserMediaHistory({
      ...input,
      usedCount: usedCountIncrement,
      lastUsedAt: usedAt,
    });
  }

  if (existing.visibility === 'deleted') {
    const record = await getUserMediaRecord(normalized.values.userId, existing.id);
    if (!record) {
      throw notFound();
    }
    return mapUserMediaRecord(record);
  }

  const updateValues: Partial<NewUserMediaHistory> = {
    libraryAssetId: normalized.values.libraryAssetId,
    generationJobId: normalized.values.generationJobId,
    generationType: normalized.values.generationType,
    visibility: normalized.values.visibility,
    lastUsedAt: usedAt,
    updatedAt: new Date(),
  };

  if (normalized.payload.isFavorite !== undefined) {
    updateValues.isFavorite = normalized.values.isFavorite;
  }

  if (normalized.payload.title !== undefined) {
    updateValues.title = normalized.values.title;
  }

  if (normalized.payload.description !== undefined) {
    updateValues.description = normalized.values.description;
  }

  const [row] = await db
    .update(userMediaHistory)
    .set({
      ...updateValues,
      usedCount: sql`${userMediaHistory.usedCount} + ${usedCountIncrement}`,
    })
    .where(eq(userMediaHistory.id, existing.id))
    .returning();

  return mapUserMediaRecord({
    userMedia: row,
    asset: normalized.asset,
    libraryAsset: normalized.libraryAsset,
  });
}

export async function updateUserMediaHistory(
  userId: number,
  id: string,
  input: UpdateUserMediaHistoryInput
) {
  const userMediaId = userMediaIdSchema.parse(id);
  const payload = updateUserMediaHistoryInputSchema.parse(input);
  const updateValues: Partial<NewUserMediaHistory> = {
    updatedAt: new Date(),
  };

  if (payload.title !== undefined) {
    updateValues.title = payload.title;
  }

  if (payload.isFavorite !== undefined) {
    updateValues.isFavorite = payload.isFavorite;
  }

  if (payload.visibility !== undefined) {
    updateValues.visibility = payload.visibility;
  }

  const [row] = await db
    .update(userMediaHistory)
    .set(updateValues)
    .where(
      and(
        eq(userMediaHistory.id, userMediaId),
        eq(userMediaHistory.userId, userId),
        sql`${userMediaHistory.visibility} <> 'deleted'`
      )
    )
    .returning({ id: userMediaHistory.id });

  if (!row) {
    throw notFound();
  }

  const record = await getUserMediaRecord(userId, row.id);
  if (!record) {
    throw notFound();
  }

  return mapUserMediaRecord(record);
}

export async function softDeleteUserMediaHistory(userId: number, id: string) {
  const userMediaId = userMediaIdSchema.parse(id);
  const [row] = await db
    .update(userMediaHistory)
    .set({
      visibility: 'deleted',
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userMediaHistory.id, userMediaId),
        eq(userMediaHistory.userId, userId),
        sql`${userMediaHistory.visibility} <> 'deleted'`
      )
    )
    .returning({ id: userMediaHistory.id });

  if (!row) {
    throw notFound();
  }
}
