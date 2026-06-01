import 'server-only';

import { desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { ASSET_STATUSES, assets } from '@/lib/db/schema';
import { requireAdmin, requireOpsOrAdmin } from '@/lib/db/queries';
import { withPagination, ilikeCol, type PaginatedResult } from './shared';

const assetIdSchema = z.string().uuid();

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

export async function listAssets(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<typeof assets.$inferSelect>> {
  await requireOpsOrAdmin();
  const { search, page, pageSize } = {
    search: '',
    page: 1,
    pageSize: 20,
    ...params,
  };
  const where = search
    ? or(
        ilikeCol(assets.id, search),
        ilikeCol(assets.userId, search),
        ilikeCol(assets.storageKey, search),
        ilikeCol(assets.type, search),
        ilikeCol(assets.status, search),
        ilikeCol(assets.mimeType, search)
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
    list: rows,
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

  return row;
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
