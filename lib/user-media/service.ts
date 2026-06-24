import 'server-only';

import { and, desc, eq, isNull, or, sql, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { parseDbId, toDbIdString } from '@/lib/db/id-schema';
import { buildAssetMediaUrl } from '@/lib/assets/media-url';
import {
  assets,
  generationJobs,
  userMediaHistory,
  type Asset,
  type GenerationJob,
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
  userMedia,
}: UserMediaRecord): UserMediaCatalogItem {
  const video = isVideoAsset(asset);
  const mediaUrl = buildAssetMediaUrl(asset.id);

  return {
    id: toDbIdString(userMedia.id),
    assetId: toDbIdString(userMedia.assetId),
    source: userMedia.source,
    title: userMedia.title,
    description: userMedia.description,
    generationType: userMedia.generationType,
    assetUrl: mediaUrl,
    imageUrl: video ? null : mediaUrl,
    videoUrl: video ? mediaUrl : null,
    thumbnailUrl: video ? null : mediaUrl,
    publicUrl: mediaUrl,
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

async function getUserMediaRecord(userId: number, id: string | number) {
  const userMediaId = parseDbId(id, 'user media ID');
  const [row] = await db
    .select({
      userMedia: userMediaHistory,
      asset: assets,
    })
    .from(userMediaHistory)
    .innerJoin(assets, eq(userMediaHistory.assetId, assets.id))
    .where(and(eq(userMediaHistory.id, userMediaId), eq(userMediaHistory.userId, userId)))
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
  const jobId = parseDbId(generationJobId, 'generation job ID');

  const [row] = await db
    .select({
      id: generationJobs.id,
      userId: generationJobs.userId,
      generationType: generationJobs.generationType,
    })
    .from(generationJobs)
    .where(and(eq(generationJobs.id, jobId), eq(generationJobs.userId, userId)))
    .limit(1);

  return row ?? null;
}

async function normalizeCreateInput(input: CreateUserMediaHistoryInput) {
  const payload = createUserMediaHistoryInputSchema.parse(input);

  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, parseDbId(payload.assetId, 'asset ID')))
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

  if (asset.userId !== payload.userId) {
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
    null;

  return {
    payload,
    asset,
    values: {
      userId: payload.userId,
      assetId: parseDbId(payload.assetId, 'asset ID'),
      generationJobId: generationJob?.id ?? null,
      source: payload.source,
      generationType,
      role: payload.role ?? null,
      title: payload.title ?? null,
      description: payload.description ?? null,
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
      })
      .from(userMediaHistory)
      .innerJoin(assets, eq(userMediaHistory.assetId, assets.id))
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
