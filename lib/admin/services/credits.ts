import 'server-only';
import { desc, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { creditLedger } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/db/queries';
import { withPagination, type PaginatedResult } from './shared';

export async function listCredits(params: { search?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<typeof creditLedger.$inferSelect>> {
  await requireAdmin();
  const { page, pageSize } = { page: 1, pageSize: 20, ...params };
  const [rows, countResult] = await Promise.all([
    withPagination(db.select().from(creditLedger).orderBy(desc(creditLedger.createdAt)), page, pageSize),
    db.select({ count: sql<number>`count(*)` }).from(creditLedger),
  ]);
  return { list: rows, total: Number(countResult[0]?.count ?? 0), page, pageSize };
}
