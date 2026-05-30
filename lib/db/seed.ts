import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

async function seed() {
  const email = 'admin@local.test';
  const password = 'admin';
  const passwordHash = await hashPassword(password);

  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingAdmin[0]) {
    await db
      .update(users)
      .set({
        name: 'Admin',
        passwordHash,
        role: 'member',
        isAdmin: true,
        creditBalance: 0,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingAdmin[0].id));
    console.log('Admin user refreshed.');
  } else {
    await db.insert(users).values({
      name: 'Admin',
      email,
      passwordHash,
      role: 'member',
      isAdmin: true,
      creditBalance: 0,
    });
    console.log('Admin user created.');
  }

  console.log('Seed is limited to the local admin account.');
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
