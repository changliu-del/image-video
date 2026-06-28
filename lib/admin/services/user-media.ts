import 'server-only';

import { and, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { buildAssetMediaUrl } from '@/lib/assets/media-url';
import { dbIdSchema, toDbIdString } from '@/lib/db/id-schema';
import {
  assets,
  generationJobs,
  userMediaHistory,
  USER_MEDIA_HISTORY_VISIBILITIES,
  users,
  type UserMediaHistoryVisibility,
} from '@/lib/db/schema';
import { requireAdmin, requireOpsOrAdmin } from '@/lib/db/queries';
import {
  exactCol,
  ilikeCol,
  withPagination,
  type PaginatedResult,
} from './shared';

const userMediaIdSchema = dbIdSchema;

const updateUserMediaAdminSchema = z
  .object({
    title: z.string().trim().max(140).nullable().optional(),
    isFavorite: z
      .union([
        z.boolean(),
        z.enum(['true', 'false']).transform((value) => value === 'true'),
      ])
      .optional(),
    visibility: z.enum(USER_MEDIA_HISTORY_VISIBILITIES).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.title !== undefined ||
      value.isFavorite !== undefined ||
      value.visibility !== undefined,
    { message: 'No fields to update' }
  );

type AdminUserMediaRecord = {
  asset: Pick<typeof assets.$inferSelect, 'id' | 'mimeType' | 'publicUrl'>;
  generationJob: Pick<typeof generationJobs.$inferSelect, 'status'> | null;
  user: Pick<typeof users.$inferSelect, 'email' | 'id' | 'name'>;
  userMedia: typeof userMediaHistory.$inferSelect;
};

export type AdminUserMediaListItem = {
  id: string;
  assetId: string;
  userId: number;
  userEmail: string;
  userName: string | null;
  previewUrl: string | null;
  previewMimeType: string | null;
  mediaKind: 'image' | 'video' | 'file';
  title: string | null;
  source: string;
  generationType: string | null;
  role: string | null;
  visibility: UserMediaHistoryVisibility;
  isFavorite: boolean;
  usedCount: number;
  jobStatus: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function inferMediaKind(input: {
  mimeType?: string | null;
  publicUrl?: string | null;
}): AdminUserMediaListItem['mediaKind'] {
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

function userMediaRecordToListItem({
  asset,
  generationJob,
  user,
  userMedia,
}: AdminUserMediaRecord): AdminUserMediaListItem {
  const mediaKind = inferMediaKind(asset);

  return {
    id: toDbIdString(userMedia.id),
    assetId: toDbIdString(userMedia.assetId),
    userId: userMedia.userId,
    userEmail: user.email,
    userName: user.name,
    previewUrl: mediaKind === 'file' ? null : buildAssetMediaUrl(asset.id),
    previewMimeType: asset.mimeType,
    mediaKind,
    title: userMedia.title,
    source: userMedia.source,
    generationType: userMedia.generationType,
    role: userMedia.role,
    visibility: userMedia.visibility,
    isFavorite: userMedia.isFavorite,
    usedCount: userMedia.usedCount,
    jobStatus: generationJob?.status ?? null,
    lastUsedAt: userMedia.lastUsedAt?.toISOString() ?? null,
    createdAt: userMedia.createdAt.toISOString(),
    updatedAt: userMedia.updatedAt.toISOString(),
  };
}

export async function listAdminUserMedia(params: {
  assetId?: string;
  search?: string;
  userEmail?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminUserMediaListItem>> {
  await requireOpsOrAdmin();
  const { assetId, search, userEmail, page, pageSize } = {
    assetId: '',
    search: '',
    userEmail: '',
    page: 1,
    pageSize: 20,
    ...params,
  };
  const conditions: SQL[] = [];
  const query = search.trim();

  if (query) {
    const searchCondition = or(
      exactCol(userMediaHistory.id, query),
      exactCol(userMediaHistory.assetId, query),
      exactCol(userMediaHistory.userId, query),
      ilikeCol(users.email, query),
      ilikeCol(users.name, query),
      ilikeCol(userMediaHistory.title, query),
      ilikeCol(userMediaHistory.source, query),
      ilikeCol(userMediaHistory.generationType, query),
      ilikeCol(userMediaHistory.role, query),
      ilikeCol(userMediaHistory.visibility, query),
      ilikeCol(generationJobs.status, query),
      ilikeCol(assets.mimeType, query)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (assetId.trim()) {
    conditions.push(exactCol(userMediaHistory.assetId, assetId));
  }

  if (userEmail.trim()) {
    conditions.push(ilikeCol(users.email, userEmail));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    withPagination(
      db
        .select({
          asset: {
            id: assets.id,
            mimeType: assets.mimeType,
            publicUrl: assets.publicUrl,
          },
          generationJob: {
            status: generationJobs.status,
          },
          user: {
            id: users.id,
            email: users.email,
            name: users.name,
          },
          userMedia: userMediaHistory,
        })
        .from(userMediaHistory)
        .innerJoin(users, eq(userMediaHistory.userId, users.id))
        .innerJoin(assets, eq(userMediaHistory.assetId, assets.id))
        .leftJoin(
          generationJobs,
          eq(userMediaHistory.generationJobId, generationJobs.id)
        )
        .where(where)
        .orderBy(
          desc(userMediaHistory.isFavorite),
          desc(
            sql`coalesce(${userMediaHistory.lastUsedAt}, ${userMediaHistory.updatedAt})`
          )
        ),
      page,
      pageSize
    ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userMediaHistory)
      .innerJoin(users, eq(userMediaHistory.userId, users.id))
      .innerJoin(assets, eq(userMediaHistory.assetId, assets.id))
      .leftJoin(
        generationJobs,
        eq(userMediaHistory.generationJobId, generationJobs.id)
      )
      .where(where),
  ]);

  return {
    list: rows.map(userMediaRecordToListItem),
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function updateAdminUserMedia(id: string, input: unknown) {
  await requireAdmin();
  const userMediaId = userMediaIdSchema.parse(id);
  const payload = updateUserMediaAdminSchema.parse(input);
  const updateValues: Partial<typeof userMediaHistory.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (payload.title !== undefined) {
    updateValues.title = payload.title?.trim() || null;
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
    .where(eq(userMediaHistory.id, userMediaId))
    .returning({ id: userMediaHistory.id });

  if (!row) {
    throw new Error('User media not found');
  }

  const result = await listAdminUserMedia({
    search: String(row.id),
    page: 1,
    pageSize: 1,
  });
  const item = result.list[0];

  if (!item) {
    throw new Error('User media not found');
  }

  return item;
}

export async function softDeleteAdminUserMedia(id: string) {
  await requireAdmin();
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
        sql`${userMediaHistory.visibility} <> 'deleted'`
      )
    )
    .returning({ id: userMediaHistory.id });

  if (!row) {
    throw new Error('User media not found');
  }
}
