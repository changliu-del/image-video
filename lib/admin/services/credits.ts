import 'server-only';

import { and, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { creditLedger } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/db/queries';
import { ilikeCol, withPagination, type PaginatedResult } from './shared';

const creditLedgerIdSchema = z.string().uuid();

const updateCreditLedgerSchema = z
  .object({
    metadataJson: z.record(z.unknown()).optional(),
  })
  .strict();

export async function listCredits(params: {
  search?: string;
  userId?: string;
  jobId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<typeof creditLedger.$inferSelect>> {
  await requireAdmin();
  const { search = '', userId = '', jobId = '', page = 1, pageSize = 20 } = params;
  const conditions: SQL[] = [];

  if (search.trim()) {
    const searchCondition = or(
      ilikeCol(creditLedger.id, search),
      ilikeCol(creditLedger.userId, search),
      ilikeCol(creditLedger.jobId, search),
      ilikeCol(creditLedger.reason, search),
      ilikeCol(creditLedger.stripeEventId, search)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (userId.trim()) {
    conditions.push(ilikeCol(creditLedger.userId, userId));
  }

  if (jobId.trim()) {
    conditions.push(ilikeCol(creditLedger.jobId, jobId));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [rows, countResult] = await Promise.all([
    withPagination(
      db
        .select()
        .from(creditLedger)
        .where(where)
        .orderBy(desc(creditLedger.createdAt)),
      page,
      pageSize
    ),
    db.select({ count: sql<number>`count(*)` }).from(creditLedger).where(where),
  ]);
  return {
    list: rows,
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function updateCreditLedgerEntry(id: string, data: unknown) {
  await requireAdmin();
  const entryId = creditLedgerIdSchema.parse(id);
  const parsed = updateCreditLedgerSchema.parse(data);
  const [row] = await db
    .update(creditLedger)
    .set({
      metadataJson: parsed.metadataJson ?? {},
    })
    .where(eq(creditLedger.id, entryId))
    .returning();

  if (!row) {
    throw new Error('Credit ledger entry not found');
  }

  return row;
}
