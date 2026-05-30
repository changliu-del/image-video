import 'server-only';
import { desc, eq, or, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, creditLedger } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/db/queries';
import { withPagination, ilikeCol, type PaginatedResult } from './shared';

export async function listUsers(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<typeof users.$inferSelect>> {
  await requireAdmin();
  const { search, page, pageSize } = {
    search: '',
    page: 1,
    pageSize: 20,
    ...params,
  };

  const where = search
    ? or(
        ilikeCol(users.email, search),
        ilikeCol(users.name, search),
      )
    : undefined;

  const [rows, countResult] = await Promise.all([
    withPagination(
      db.select().from(users).where(where).orderBy(desc(users.createdAt)),
      page,
      pageSize,
    ),
    db.select({ count: sql<number>`count(*)` }).from(users).where(where),
  ]);

  return { list: rows, total: Number(countResult[0]?.count ?? 0), page, pageSize };
}

export async function getUserById(id: number) {
  await requireAdmin();
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function updateUser(id: number, data: Partial<typeof users.$inferInsert>) {
  await requireAdmin();
  const [row] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return row;
}

export async function softDeleteUser(id: number) {
  const admin = await requireAdmin();
  if (admin.id === id) throw new Error('Cannot delete your own admin account');
  await db
    .update(users)
    .set({ deletedAt: sql`CURRENT_TIMESTAMP`, updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(users.id, id));
}

export async function restoreUser(id: number) {
  await requireAdmin();
  await db
    .update(users)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(users.id, id));
}

export async function adjustUserCreditsService(params: {
  userId: number;
  amount: number;
  adminUserId: number;
  note?: string;
}) {
  const { adjustUserCredits } = await import('@/lib/credits');
  await adjustUserCredits({
    userId: params.userId,
    amount: params.amount,
    adminUserId: params.adminUserId,
    metadata: {
      note: params.note || null,
      source: 'admin_panel',
    },
  });
}
