import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import {
  assets,
  templates,
  users,
  type VideoAspectRatio,
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

function getSeedAssetMimeType(publicUrl: string) {
  if (publicUrl.endsWith('.mp4')) {
    return 'video/mp4';
  }

  if (publicUrl.endsWith('.png')) {
    return 'image/png';
  }

  if (publicUrl.endsWith('.jpg') || publicUrl.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  return 'application/octet-stream';
}

function getSeedAssetDurationSeconds(publicUrl: string) {
  return publicUrl.endsWith('.mp4') ? 5 : null;
}

function getSeedAssetStorageKey(publicUrl: string) {
  return `seed${publicUrl.startsWith('/') ? publicUrl : `/${publicUrl}`}`;
}

function getSeedTemplateSortWeight(index: number) {
  return 1200 - index * 10;
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

async function seedStarterTemplateCatalog(adminId: number) {
  for (const [index, template] of starterTemplateSeeds.entries()) {
    const templateId = deterministicUuid(`template:${template.id}`);
    const assetId = deterministicUuid(`asset:${template.asset}`);
    const now = new Date();

    await db
      .insert(assets)
      .values({
        id: assetId,
        userId: adminId,
        type: 'upload',
        status: 'uploaded',
        storageKey: getSeedAssetStorageKey(template.asset),
        publicUrl: template.asset,
        mimeType: getSeedAssetMimeType(template.asset),
        durationSeconds: getSeedAssetDurationSeconds(template.asset),
      })
      .onConflictDoUpdate({
        target: assets.id,
        set: {
          userId: adminId,
          type: 'upload',
          status: 'uploaded',
          storageKey: getSeedAssetStorageKey(template.asset),
          publicUrl: template.asset,
          mimeType: getSeedAssetMimeType(template.asset),
          durationSeconds: getSeedAssetDurationSeconds(template.asset),
          updatedAt: now,
        },
      });

    await db
      .insert(templates)
      .values({
        id: templateId,
        name: template.name,
        description: template.description,
        category: template.category,
        prompt: template.prompt,
        previewAssetId: assetId,
        tagsJson: template.tags,
        costCredits: template.costCredits,
        aspectRatiosJson: template.aspectRatios as VideoAspectRatio[],
        durationSeconds: template.durationSeconds ?? null,
        sortWeight: getSeedTemplateSortWeight(index),
        createdBy: adminId,
        updatedBy: adminId,
      })
      .onConflictDoUpdate({
        target: templates.id,
        set: {
          name: template.name,
          description: template.description,
          category: template.category,
          prompt: template.prompt,
          previewAssetId: assetId,
          tagsJson: template.tags,
          costCredits: template.costCredits,
          aspectRatiosJson: template.aspectRatios as VideoAspectRatio[],
          durationSeconds: template.durationSeconds ?? null,
          sortWeight: getSeedTemplateSortWeight(index),
          updatedBy: adminId,
          updatedAt: now,
        },
      });
  }

  console.log(
    `Starter template catalog seeded: ${starterTemplateSeeds.length} templates.`
  );
}

async function seed() {
  const admin = await seedCodexAdminUser();
  await seedStarterTemplateCatalog(admin.id);
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
