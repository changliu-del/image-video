import 'server-only';

import { desc, eq, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { USER_ROLES, users, type User, type UserRole } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/db/queries';
import {
  exactCol,
  ilikeCol,
  withPagination,
  type PaginatedResult,
} from './shared';

export type AdminUser = Omit<User, 'passwordHash'>;
export type AdminUserListItem = AdminUser & {
  accountStatus: 'active' | 'deleted';
};

const adminUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  isAdmin: users.isAdmin,
  creditBalance: users.creditBalance,
  stripeCustomerId: users.stripeCustomerId,
  stripeSubscriptionId: users.stripeSubscriptionId,
  stripeProductId: users.stripeProductId,
  planName: users.planName,
  subscriptionStatus: users.subscriptionStatus,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  deletedAt: users.deletedAt,
};

const updateUserSchema = z
  .object({
    email: z.string().trim().email().max(255).optional(),
    name: z.string().trim().max(100).nullable().optional(),
    role: z.enum(USER_ROLES).optional(),
    isAdmin: z.boolean().optional(),
  })
  .strict();

const adjustCreditsSchema = z
  .object({
    userId: z.coerce.number().int().positive(),
    amount: z.coerce.number().int().refine((value) => value !== 0, {
      message: 'amount must be a non-zero integer',
    }),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

function adminUserToListItem(user: AdminUser): AdminUserListItem {
  return {
    ...user,
    accountStatus: user.deletedAt ? 'deleted' : 'active',
  };
}

export async function listUsers(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminUserListItem>> {
  await requireAdmin();
  const { search, page, pageSize } = {
    search: '',
    page: 1,
    pageSize: 20,
    ...params,
  };
  const query = search.trim();

  const where = query
    ? or(
        exactCol(users.id, query),
        exactCol(users.stripeCustomerId, query),
        exactCol(users.stripeSubscriptionId, query),
        exactCol(users.stripeProductId, query),
        ilikeCol(users.email, query),
        ilikeCol(users.name, query),
        ilikeCol(users.role, query),
        ilikeCol(users.planName, query),
        ilikeCol(users.subscriptionStatus, query),
        sql`(case when ${users.deletedAt} is null then 'active' else 'deleted' end) ILIKE ${'%' + query + '%'}`
      )
    : undefined;

  const [rows, countResult] = await Promise.all([
    withPagination(
      db
        .select(adminUserColumns)
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt)),
      page,
      pageSize
    ),
    db.select({ count: sql<number>`count(*)` }).from(users).where(where),
  ]);

  return {
    list: rows.map(adminUserToListItem),
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function getUserById(id: number) {
  await requireAdmin();
  const [row] = await db
    .select(adminUserColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return row ? adminUserToListItem(row) : null;
}

export async function updateUser(id: number, data: unknown) {
  const admin = await requireAdmin();
  const parsed = updateUserSchema.parse(data);
  const role =
    parsed.role ??
    (typeof parsed.isAdmin === 'boolean'
      ? parsed.isAdmin
        ? 'admin'
        : 'member'
      : undefined);

  if (admin.id === id && role && role !== 'admin') {
    throw new Error('Cannot revoke your own admin role');
  }

  const nextData: Partial<typeof users.$inferInsert> = {};

  if (parsed.email !== undefined) {
    nextData.email = parsed.email;
  }

  if (parsed.name !== undefined) {
    nextData.name = parsed.name?.trim() || null;
  }

  if (role) {
    nextData.role = role;
    nextData.isAdmin = role === 'admin';
  }

  if (Object.keys(nextData).length === 0) {
    throw new Error('No fields to update');
  }

  const [row] = await db
    .update(users)
    .set({ ...nextData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning(adminUserColumns);

  if (!row) {
    throw new Error('User not found');
  }

  return adminUserToListItem(row);
}

export async function softDeleteUser(id: number) {
  const admin = await requireAdmin();
  if (admin.id === id) {
    throw new Error('Cannot delete your own admin account');
  }

  const [row] = await db
    .update(users)
    .set({
      deletedAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!row) {
    throw new Error('User not found');
  }
}

export async function restoreUser(id: number) {
  await requireAdmin();
  const [row] = await db
    .update(users)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!row) {
    throw new Error('User not found');
  }
}

export async function setUserRole(id: number, role: UserRole) {
  const admin = await requireAdmin();
  const parsedRole = z.enum(USER_ROLES).parse(role);
  if (admin.id === id && parsedRole !== 'admin') {
    throw new Error('Cannot revoke your own admin role');
  }

  const [row] = await db
    .update(users)
    .set({
      role: parsedRole,
      isAdmin: parsedRole === 'admin',
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (!row) {
    throw new Error('User not found');
  }
}

export async function adjustUserCreditsService(input: {
  userId: number;
  amount: number;
  note?: string;
}) {
  const admin = await requireAdmin();
  const params = adjustCreditsSchema.parse(input);
  const { adjustUserCredits } = await import('@/lib/credits');
  await adjustUserCredits({
    userId: params.userId,
    amount: params.amount,
    adminUserId: admin.id,
    metadata: {
      note: params.note || null,
      source: 'admin_panel',
    },
  });
}
