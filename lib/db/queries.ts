import { and, eq, isNull } from 'drizzle-orm';
import { db } from './drizzle';
import { type User, users } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return user;
}

export function hasAdminAccess(user: Pick<User, 'isAdmin' | 'role'>) {
  return user.isAdmin || user.role === 'admin';
}

export function hasOpsAccess(user: Pick<User, 'isAdmin' | 'role'>) {
  return hasAdminAccess(user) || user.role === 'ops';
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!hasAdminAccess(user)) {
    throw new Error('Admin access required');
  }

  return user;
}

export async function requireOpsOrAdmin() {
  const user = await requireUser();
  if (!hasOpsAccess(user)) {
    throw new Error('Ops access required');
  }

  return user;
}

export async function getUserByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.stripeCustomerId, customerId), isNull(users.deletedAt)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateUserSubscription(
  userId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string | null;
  }
) {
  await db
    .update(users)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));
}
