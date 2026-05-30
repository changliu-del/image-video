import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { generationJobs } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/db/queries';
import { withPagination, type PaginatedResult } from './shared';

export async function listJobs(params: { search?: string; page?: number; pageSize?: number }): Promise<PaginatedResult<typeof generationJobs.$inferSelect>> {
  await requireAdmin();
  const { page, pageSize } = { page: 1, pageSize: 20, ...params };
  const [rows, countResult] = await Promise.all([
    withPagination(db.select().from(generationJobs).orderBy(desc(generationJobs.createdAt)), page, pageSize),
    db.select({ count: sql<number>`count(*)` }).from(generationJobs),
  ]);
  return { list: rows, total: Number(countResult[0]?.count ?? 0), page, pageSize };
}

export async function removeJob(id: string) {
  await requireAdmin();
  await db.delete(generationJobs).where(eq(generationJobs.id, id));
}
