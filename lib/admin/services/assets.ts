import 'server-only';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { assets } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/db/queries';
import { withPagination, ilikeCol, type PaginatedResult } from './shared';

export async function listAssets(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<typeof assets.$inferSelect>> {
  await requireAdmin();
  const { search, page, pageSize } = { search: '', page: 1, pageSize: 20, ...params };
  const where = search ? ilikeCol(assets.storageKey, search) : undefined;
  const [rows, countResult] = await Promise.all([
    withPagination(db.select().from(assets).where(where).orderBy(desc(assets.createdAt)), page, pageSize),
    db.select({ count: sql<number>`count(*)` }).from(assets).where(where),
  ]);
  return { list: rows, total: Number(countResult[0]?.count ?? 0), page, pageSize };
}

export async function removeAsset(id: string) {
  await requireAdmin();
  await db.delete(assets).where(eq(assets.id, id));
}
