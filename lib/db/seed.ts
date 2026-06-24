import { and, eq, or, sql } from 'drizzle-orm';
import { db } from './drizzle';
import {
  assets,
  templates,
  users,
} from './schema';
import { hashPassword } from '@/lib/auth/password';
import { buildModelTemplateLocalization } from '@/lib/model-assets/localization';
import { starterTemplateSeeds } from '@/lib/templates/catalog';
import { buildTemplateMediaUrl } from '@/lib/templates/media-url';

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

async function upsertStarterTemplateAsset(input: {
  mimeType: string;
  publicUrl: string;
  storageKey: string;
  userId: number;
}) {
  const now = new Date();
  const [asset] = await db
    .insert(assets)
    .values({
      userId: input.userId,
      type: 'upload',
      status: 'uploaded',
      storageKey: input.storageKey,
      publicUrl: input.publicUrl,
      mimeType: input.mimeType,
    })
    .onConflictDoUpdate({
      target: assets.storageKey,
      set: {
        status: 'uploaded',
        publicUrl: sql`excluded.public_url`,
        mimeType: sql`excluded.mime_type`,
        updatedAt: now,
      },
    })
    .returning({ id: assets.id });

  return asset.id;
}

async function seedStarterTemplateCatalog() {
  const admin = await seedCodexAdminUser();
  const sortOrderByGroup = new Map<string, number>();

  for (const template of starterTemplateSeeds) {
    const sortOrderKey = `${template.type}:${template.category}`;
    const sortOrder = (sortOrderByGroup.get(sortOrderKey) ?? 0) + 1;
    sortOrderByGroup.set(sortOrderKey, sortOrder);
    const now = new Date();

    const thumbnailAssetId = await upsertStarterTemplateAsset({
      userId: admin.id,
      storageKey: `templates/starter/${template.seedKey}/thumbnail`,
      publicUrl: template.thumbnailUrl,
      mimeType: 'image/png',
    });
    const previewAssetId = await upsertStarterTemplateAsset({
      userId: admin.id,
      storageKey: `templates/starter/${template.seedKey}/preview`,
      publicUrl: template.previewUrl,
      mimeType: 'video/mp4',
    });

    const [existingTemplate] = await db
      .select({ id: templates.id })
      .from(templates)
      .where(
        or(
          and(
            eq(templates.type, template.type),
            eq(templates.category, template.category),
            eq(templates.title, template.title)
          ),
          eq(templates.thumbnailAssetId, thumbnailAssetId),
          eq(templates.previewAssetId, previewAssetId)
        )
      )
      .limit(1);

    const templateValues = {
        title: template.title,
        titleTranslations: template.titleTranslations ?? {},
        type: template.type,
        category: template.category,
        thumbnailAssetId,
        previewAssetId,
        thumbnailUrl: buildTemplateMediaUrl(thumbnailAssetId),
        previewUrl: buildTemplateMediaUrl(previewAssetId),
        thumbnailMimeType: 'image/png',
        previewMimeType: 'video/mp4',
        prompt: template.prompt,
        promptTranslations: template.promptTranslations ?? {},
        sortOrder,
      };

    if (existingTemplate) {
      await db
        .update(templates)
        .set({
          ...templateValues,
          updatedAt: now,
        })
        .where(eq(templates.id, existingTemplate.id));
    } else {
      await db.insert(templates).values(templateValues);
    }
  }

  console.log(
    `Starter template catalog seeded: ${starterTemplateSeeds.length} templates.`
  );
}

async function refreshTemplateLanguageDefaults() {
  await db.execute(sql`
    update ${templates}
    set
      title = coalesce(nullif(${templates.titleTranslations} ->> 'en', ''), ${templates.title}),
      prompt = coalesce(nullif(${templates.promptTranslations} ->> 'en', ''), ${templates.prompt}),
      title_translations_json = case
        when ${templates.titleTranslations} ? 'pt'
          then jsonb_build_object('pt', ${templates.titleTranslations} ->> 'pt')
        else '{}'::jsonb
      end,
      prompt_translations_json = case
        when ${templates.promptTranslations} ? 'pt'
          then jsonb_build_object('pt', ${templates.promptTranslations} ->> 'pt')
        else '{}'::jsonb
      end,
      updated_at = now()
    where
      ${templates.titleTranslations} ? 'en'
      or ${templates.titleTranslations} ? 'zh'
      or ${templates.promptTranslations} ? 'en'
      or ${templates.promptTranslations} ? 'zh'
  `);

  console.log('Template language defaults refreshed to English with pt translations.');
}

function hasCjk(value: unknown) {
  return typeof value === 'string' && /[\u3400-\u9fff]/.test(value);
}

async function refreshModelTemplateLanguageDefaults() {
  const modelRows = await db
    .select({
      id: templates.id,
      category: templates.category,
      title: templates.title,
      prompt: templates.prompt,
      titleTranslations: templates.titleTranslations,
      promptTranslations: templates.promptTranslations,
    })
    .from(templates)
    .where(eq(templates.type, 'model'));
  let refreshed = 0;

  for (const row of modelRows) {
    const needsRefresh =
      hasCjk(row.title) ||
      hasCjk(row.prompt) ||
      hasCjk(row.titleTranslations?.pt) ||
      hasCjk(row.promptTranslations?.pt);
    if (!needsRefresh) continue;

    const localization = buildModelTemplateLocalization({
      category: row.category,
      prompt: row.prompt,
      title: row.title,
    });

    await db
      .update(templates)
      .set({
        title: localization.titleTranslations.en,
        prompt: localization.promptTranslations.en,
        titleTranslations: {
          pt: localization.titleTranslations.pt,
        },
        promptTranslations: {
          pt: localization.promptTranslations.pt,
        },
        updatedAt: new Date(),
      })
      .where(eq(templates.id, row.id));
    refreshed += 1;
  }

  console.log(`Model template language defaults refreshed: ${refreshed}.`);
}

async function seed() {
  await seedStarterTemplateCatalog();
  await refreshTemplateLanguageDefaults();
  await refreshModelTemplateLanguageDefaults();
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
