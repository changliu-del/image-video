import { createHash } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { db } from './drizzle';
import {
  assets,
  templates,
  users,
} from './schema';
import { hashPassword } from '@/lib/auth/password';
import { starterTemplateSeeds } from '@/lib/templates/catalog';

const seedNamespace = 'image-video-starter-template-catalog';

function deterministicUuid(value: string) {
  const bytes = Uint8Array.from(
    createHash('sha1').update(seedNamespace).update(':').update(value).digest()
  ).slice(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function seedCodexAdminUser() {
  const email = 'codex-admin@local.test';
  const password = 'CodexAdmin!2026';
  const passwordHash = await hashPassword(password);

  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingAdmin[0]) {
    const [admin] = await db
      .update(users)
      .set({
        name: 'Codex Admin',
        passwordHash,
        role: 'admin',
        creditBalance: 0,
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingAdmin[0].id))
      .returning({ id: users.id });
    console.log('Codex admin user refreshed.');
    return admin;
  }

  const [admin] = await db
    .insert(users)
    .values({
      name: 'Codex Admin',
      email,
      passwordHash,
      role: 'admin',
      creditBalance: 0,
    })
    .returning({ id: users.id });
  console.log('Codex admin user created.');
  return admin;
}

async function seedStarterTemplateCatalog() {
  const admin = await seedCodexAdminUser();

  for (const template of starterTemplateSeeds) {
    const templateId = deterministicUuid(`template:${template.seedKey}`);
    const thumbnailAssetId = deterministicUuid(
      `asset:${template.thumbnailAssetSeedKey}`
    );
    const previewAssetId = deterministicUuid(
      `asset:${template.previewAssetSeedKey}`
    );
    const now = new Date();

    await db
      .insert(assets)
      .values([
        {
          id: thumbnailAssetId,
          userId: admin.id,
          type: 'upload',
          status: 'uploaded',
          storageKey: `templates/starter/${template.seedKey}/thumbnail`,
          publicUrl: template.thumbnailUrl,
          mimeType: 'image/png',
        },
        {
          id: previewAssetId,
          userId: admin.id,
          type: 'upload',
          status: 'uploaded',
          storageKey: `templates/starter/${template.seedKey}/preview`,
          publicUrl: template.previewUrl,
          mimeType: 'video/mp4',
        },
      ])
      .onConflictDoUpdate({
        target: assets.id,
        set: {
          status: 'uploaded',
          publicUrl: sql`excluded.public_url`,
          storageKey: sql`excluded.storage_key`,
          mimeType: sql`excluded.mime_type`,
          updatedAt: now,
        },
      });

    await db
      .insert(templates)
      .values({
        id: templateId,
        title: template.title,
        titleTranslations: template.titleTranslations ?? {},
        type: template.type,
        category: template.category,
        thumbnailAssetId,
        previewAssetId,
        prompt: template.prompt,
        promptTranslations: template.promptTranslations ?? {},
      })
      .onConflictDoUpdate({
        target: templates.id,
        set: {
          type: template.type,
          title: template.title,
          titleTranslations: template.titleTranslations ?? {},
          category: template.category,
          thumbnailAssetId,
          previewAssetId,
          prompt: template.prompt,
          promptTranslations: template.promptTranslations ?? {},
          updatedAt: now,
        },
      });
  }

  console.log(
    `Starter template catalog seeded: ${starterTemplateSeeds.length} templates.`
  );
}

async function seed() {
  await seedStarterTemplateCatalog();
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
