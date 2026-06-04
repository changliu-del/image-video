import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/password';
import { eq } from 'drizzle-orm';

async function seed() {
  const email = 'codex-admin@local.test';
  const password = 'CodexAdmin!2026';
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
        name: 'Codex Admin',
        passwordHash,
        role: 'admin',
        isAdmin: true,
        creditBalance: 0,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingAdmin[0].id));
    console.log('Codex admin user refreshed.');
  } else {
    await db.insert(users).values({
      name: 'Codex Admin',
      email,
      passwordHash,
      role: 'admin',
      isAdmin: true,
      creditBalance: 0,
    });
    console.log('Codex admin user created.');
  }

  console.log('Seed is limited to the Codex local admin account.');
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
