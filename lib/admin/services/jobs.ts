import 'server-only';

import { desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  GENERATION_JOB_STATUSES,
  generationJobs,
} from '@/lib/db/schema';
import { requireAdmin, requireOpsOrAdmin } from '@/lib/db/queries';
import { ilikeCol, withPagination, type PaginatedResult } from './shared';

const jobIdSchema = z.string().uuid();

const updateJobSchema = z
  .object({
    status: z.enum(GENERATION_JOB_STATUSES).optional(),
    productName: z.string().trim().min(1).max(120).optional(),
    headline: z.string().trim().min(1).max(100).optional(),
    sellingPoint: z.string().trim().min(1).max(5000).optional(),
    priceText: z.string().trim().min(1).max(64).optional(),
    ctaText: z.string().trim().min(1).max(40).optional(),
    errorMessage: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export async function listJobs(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<typeof generationJobs.$inferSelect>> {
  await requireOpsOrAdmin();
  const { search = '', page = 1, pageSize = 20 } = params;
  const where = search
    ? or(
        ilikeCol(generationJobs.id, search),
        ilikeCol(generationJobs.userId, search),
        ilikeCol(generationJobs.status, search),
        ilikeCol(generationJobs.productName, search),
        ilikeCol(generationJobs.templateSlug, search),
        ilikeCol(generationJobs.templateId, search),
        ilikeCol(generationJobs.provider, search),
        ilikeCol(generationJobs.providerJobId, search)
      )
    : undefined;
  const [rows, countResult] = await Promise.all([
    withPagination(
      db
        .select()
        .from(generationJobs)
        .where(where)
        .orderBy(desc(generationJobs.createdAt)),
      page,
      pageSize
    ),
    db.select({ count: sql<number>`count(*)` }).from(generationJobs).where(where),
  ]);
  return {
    list: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function updateJob(id: string, data: unknown) {
  await requireAdmin();
  const jobId = jobIdSchema.parse(id);
  const parsed = updateJobSchema.parse(data);
  const update: Partial<typeof generationJobs.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.status !== undefined) {
    update.status = parsed.status;
  }

  if (parsed.productName !== undefined) {
    update.productName = parsed.productName;
  }

  if (parsed.headline !== undefined) {
    update.headline = parsed.headline;
  }

  if (parsed.sellingPoint !== undefined) {
    update.sellingPoint = parsed.sellingPoint;
  }

  if (parsed.priceText !== undefined) {
    update.priceText = parsed.priceText;
  }

  if (parsed.ctaText !== undefined) {
    update.ctaText = parsed.ctaText;
  }

  if (parsed.errorMessage !== undefined) {
    update.errorMessage = parsed.errorMessage?.trim() || null;
  }

  if (Object.keys(update).length === 1) {
    throw new Error('No fields to update');
  }

  const [row] = await db
    .update(generationJobs)
    .set(update)
    .where(eq(generationJobs.id, jobId))
    .returning();

  if (!row) {
    throw new Error('Generation job not found');
  }

  return row;
}

export async function removeJob(id: string) {
  await requireAdmin();
  const jobId = jobIdSchema.parse(id);
  const [row] = await db
    .delete(generationJobs)
    .where(eq(generationJobs.id, jobId))
    .returning({ id: generationJobs.id });

  if (!row) {
    throw new Error('Generation job not found');
  }
}
