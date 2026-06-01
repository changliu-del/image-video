'use server';

import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { adjustUserCredits } from '@/lib/credits';
import { db } from '@/lib/db/drizzle';
import { requireAdmin } from '@/lib/db/queries';
import { users } from '@/lib/db/schema';

function readUserId(formData: FormData) {
  const id = Number(formData.get('userId'));
  if (!Number.isInteger(id) || id <= 0) throw new Error('Invalid user id');
  return id;
}

export async function updateAdminUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = readUserId(formData);
  const name = String(formData.get('name') ?? '').trim() || null;
  const email = String(formData.get('email') ?? '').trim();
  const isAdmin = formData.get('isAdmin') === 'on';
  if (!email) throw new Error('Email is required');
  if (admin.id === userId && !isAdmin) throw new Error('You cannot revoke your own admin access');
  await db.update(users).set({ name, email, isAdmin, role: isAdmin ? 'admin' : 'member', updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath('/admin');
}

export async function softDeleteUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = readUserId(formData);
  if (admin.id === userId) throw new Error('You cannot delete your own admin account');
  await db.update(users).set({ deletedAt: sql`CURRENT_TIMESTAMP`, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(users.id, userId));
  revalidatePath('/admin');
}

export async function restoreUserAction(formData: FormData) {
  await requireAdmin();
  const userId = readUserId(formData);
  await db.update(users).set({ deletedAt: null, updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath('/admin');
}

export async function adjustUserCreditsAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = readUserId(formData);
  const amount = Number(formData.get('amount'));
  const note = String(formData.get('note') ?? '').trim();
  await adjustUserCredits({ userId, amount, adminUserId: admin.id, metadata: { note: note || null, source: 'admin_panel' } });
  revalidatePath('/admin');
  revalidatePath('/dashboard');
}
