import 'server-only';

import { randomUUID } from 'crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  templateAssets,
  templateAuditLogs,
  templateTagRelations,
  templateTags,
  templates,
  type Template,
  type TemplateAssetRole,
  type TemplateTag,
} from '@/lib/db/schema';
import {
  hasAdminAccess,
  requireAdmin,
  requireOpsOrAdmin,
} from '@/lib/db/queries';
import { locales } from '@/lib/marketing/content';
import {
  templateTagOptions,
  type TemplateCatalogItem,
} from '@/lib/templates/catalog';
import { mapTemplateRecordToCatalogItem } from '@/lib/templates/query';
import {
  buildPublicUrl,
  buildTemplateAssetStorageKey,
  createSignedTemplateAssetPutUrl,
  isTemplateAssetMimeType,
  storageKeyMatchesTemplateAsset,
  verifyUploadedObject,
  type TemplateAssetMimeType,
} from '@/lib/storage/r2';
import {
  adminSearchMatches,
  normalizeAdminSearchQuery,
} from '@/lib/admin/search';
import { type PaginatedResult } from './shared';

const MAX_TEMPLATE_ASSET_BYTES = 80 * 1024 * 1024;
const templateIdSchema = z.string().uuid();

type AdminTemplateRecord = Template & {
  previewAsset: typeof assets.$inferSelect | null;
  thumbnailAsset: typeof assets.$inferSelect | null;
  tagRelations: Array<{ tag: TemplateTag }>;
};

type AdminTemplateAssetRecord = typeof templateAssets.$inferSelect & {
  asset: typeof assets.$inferSelect | null;
  template: Template | null;
};

export type AdminTemplateListItem = TemplateCatalogItem & {
  status: Template['status'];
  negativePrompt: string | null;
  promptJson: Record<string, unknown>;
  defaultInputsJson: Record<string, unknown>;
  previewAssetId: string | null;
  thumbnailAssetId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  sortWeight: number;
  usageCount: number;
};

export type AdminTemplateAssetListItem = AdminTemplateAssetRecord;

const templatePayloadSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: z.string().trim().max(120).optional(),
    locale: z.enum(locales).default('pt'),
    title: z.string().trim().min(2).max(140),
    description: z.string().trim().min(2).max(1200),
    type: z.enum(['image', 'image_to_video', 'video']),
    hook: z.string().trim().min(2).max(220),
    cta: z.string().trim().max(80).optional().nullable(),
    prompt: z.string().trim().min(4).max(5000),
    negativePrompt: z.string().trim().max(2000).optional().nullable(),
    promptJson: z.record(z.unknown()).optional().default({}),
    defaultInputsJson: z.record(z.unknown()).optional().default({}),
    costCredits: z.coerce.number().int().min(0).max(999).default(1),
    aspectRatios: z
      .array(z.enum(['9:16', '1:1', '16:9']))
      .min(1)
      .default(['9:16']),
    durationSeconds: z
      .union([z.literal(5), z.literal(8), z.literal(10)])
      .nullable()
      .optional(),
    sortWeight: z.coerce.number().int().min(-9999).max(9999).default(0),
    tagSlugs: z.array(z.string().trim().min(1).max(80)).default([]),
  })
  .strict();

const presignTemplateAssetSchema = z
  .object({
    templateId: z.string().uuid(),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(120),
    sizeBytes: z.coerce.number().int().positive().max(MAX_TEMPLATE_ASSET_BYTES),
  })
  .strict();

const completeTemplateAssetSchema = z
  .object({
    templateId: z.string().uuid(),
    assetId: z.string().uuid(),
    storageKey: z.string().trim().min(1).max(512),
    role: z.enum(['thumbnail', 'preview', 'source', 'example']),
  })
  .strict();

function matchesAdminExactId(value: string | null | undefined, query: string) {
  return Boolean(value && query && value.toLowerCase() === query);
}

function slugify(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 110) || `template-${Date.now()}`
  );
}

function normalizeTemplatePayload(input: unknown) {
  const parsed = templatePayloadSchema.parse(input);
  return {
    ...parsed,
    slug: slugify(parsed.slug || parsed.title),
    cta: parsed.cta?.trim() || null,
    negativePrompt: parsed.negativePrompt?.trim() || null,
    durationSeconds:
      parsed.type === 'image' ? null : parsed.durationSeconds ?? 5,
    tagSlugs: Array.from(new Set(parsed.tagSlugs)),
  };
}

function assertCanMutateTemplate(
  user: Awaited<ReturnType<typeof requireOpsOrAdmin>>,
  template: Pick<Template, 'status'>,
  action: 'edit' | 'upload assets to'
) {
  if (!hasAdminAccess(user) && template.status !== 'draft') {
    throw new Error(`Ops can only ${action} draft templates`);
  }
}

function adminTemplateRecordToListItem(
  row: AdminTemplateRecord
): AdminTemplateListItem {
  const catalogItem = mapTemplateRecordToCatalogItem(row);

  return {
    ...catalogItem,
    status: row.status,
    negativePrompt: row.negativePrompt,
    promptJson: row.promptJson,
    defaultInputsJson: row.defaultInputsJson,
    previewAssetId: row.previewAssetId,
    thumbnailAssetId: row.thumbnailAssetId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    sortWeight: row.sortWeight,
    usageCount: row.usageCount,
  };
}

async function writeTemplateAudit(input: {
  templateId?: string | null;
  actorId: number;
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) {
  await db.insert(templateAuditLogs).values({
    templateId: input.templateId ?? null,
    actorId: input.actorId,
    action: input.action,
    beforeJson: input.before ?? {},
    afterJson: input.after ?? {},
  });
}

async function ensureTemplateTags() {
  await db
    .insert(templateTags)
    .values(
      templateTagOptions.map((tag, index) => ({
        slug: tag.slug,
        group: tag.group,
        labelPt: tag.labels.pt,
        labelEn: tag.labels.en,
        labelZh: tag.labels.zh,
        sortWeight: index,
      }))
    )
    .onConflictDoNothing();
}

async function setTemplateTags(templateId: string, tagSlugs: string[]) {
  await ensureTemplateTags();
  await db
    .delete(templateTagRelations)
    .where(eq(templateTagRelations.templateId, templateId));

  if (tagSlugs.length === 0) {
    return;
  }

  const rows = await db
    .select({ id: templateTags.id })
    .from(templateTags)
    .where(inArray(templateTags.slug, tagSlugs));

  if (rows.length === 0) {
    return;
  }

  await db
    .insert(templateTagRelations)
    .values(rows.map((tag) => ({ templateId, tagId: tag.id })))
    .onConflictDoNothing();
}

export async function listAdminTemplates(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminTemplateListItem>> {
  await requireOpsOrAdmin();
  const { search = '', page = 1, pageSize = 20 } = params;
  const query = normalizeAdminSearchQuery(search);

  const rows = (await db.query.templates.findMany({
    with: {
      previewAsset: true,
      thumbnailAsset: true,
      tagRelations: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: [desc(templates.updatedAt)],
  })) as AdminTemplateRecord[];

  const filtered = query
    ? rows.filter((row) =>
        matchesAdminExactId(row.id, query) ||
        adminSearchMatches(
          [
            row.title,
            row.description,
            row.hook,
            row.cta,
            row.slug,
            row.locale,
            row.type,
            row.status,
            ...row.tagRelations.flatMap((relation) => [
              relation.tag.slug,
              relation.tag.group,
              relation.tag.labelPt,
              relation.tag.labelEn,
              relation.tag.labelZh,
            ]),
          ],
          query
        )
      )
    : rows;

  const start = (page - 1) * pageSize;
  return {
    list: filtered
      .slice(start, start + pageSize)
      .map(adminTemplateRecordToListItem),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function listTemplateAssets(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminTemplateAssetListItem>> {
  await requireOpsOrAdmin();
  const { search = '', page = 1, pageSize = 20 } = params;
  const query = normalizeAdminSearchQuery(search);

  const rows = (await db.query.templateAssets.findMany({
    with: {
      asset: true,
      template: true,
    },
    orderBy: [desc(templateAssets.createdAt)],
  })) as AdminTemplateAssetRecord[];

  const filtered = query
    ? rows.filter((row) =>
        [row.id, row.templateId, row.assetId].some((id) =>
          matchesAdminExactId(id, query)
        ) ||
        adminSearchMatches(
          [
            row.role,
            row.asset?.type,
            row.asset?.status,
            row.asset?.mimeType,
            row.template?.slug,
            row.template?.title,
            row.template?.locale,
            row.template?.type,
            row.template?.status,
          ],
          query
        )
      )
    : rows;

  const start = (page - 1) * pageSize;
  return {
    list: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function createTemplate(input: unknown) {
  const user = await requireOpsOrAdmin();
  const payload = normalizeTemplatePayload(input);
  const [row] = await db
    .insert(templates)
    .values({
      slug: payload.slug,
      locale: payload.locale,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      status: 'draft',
      hook: payload.hook,
      cta: payload.cta,
      prompt: payload.prompt,
      negativePrompt: payload.negativePrompt,
      promptJson: payload.promptJson,
      defaultInputsJson: payload.defaultInputsJson,
      costCredits: payload.costCredits,
      aspectRatiosJson: payload.aspectRatios,
      durationSeconds: payload.durationSeconds,
      sortWeight: payload.sortWeight,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

  await setTemplateTags(row.id, payload.tagSlugs);
  await writeTemplateAudit({
    templateId: row.id,
    actorId: user.id,
    action: 'template_created',
    after: { slug: row.slug, title: row.title },
  });

  return row;
}

export async function updateTemplate(id: string, input: unknown) {
  const user = await requireOpsOrAdmin();
  const templateId = templateIdSchema.parse(id);
  const payload = normalizeTemplatePayload(input);
  const [existing] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!existing) {
    throw new Error('Template not found');
  }

  assertCanMutateTemplate(user, existing, 'edit');

  const [row] = await db
    .update(templates)
    .set({
      slug: payload.slug,
      locale: payload.locale,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      hook: payload.hook,
      cta: payload.cta,
      prompt: payload.prompt,
      negativePrompt: payload.negativePrompt,
      promptJson: payload.promptJson,
      defaultInputsJson: payload.defaultInputsJson,
      costCredits: payload.costCredits,
      aspectRatiosJson: payload.aspectRatios,
      durationSeconds: payload.durationSeconds,
      sortWeight: payload.sortWeight,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(templates.id, templateId))
    .returning();

  await setTemplateTags(row.id, payload.tagSlugs);
  await writeTemplateAudit({
    templateId: row.id,
    actorId: user.id,
    action: 'template_updated',
    before: { title: existing.title, status: existing.status },
    after: { title: row.title, status: row.status },
  });

  return row;
}

export async function publishTemplate(id: string) {
  const user = await requireAdmin();
  const templateId = templateIdSchema.parse(id);
  const [row] = await db
    .update(templates)
    .set({
      status: 'published',
      publishedBy: user.id,
      publishedAt: new Date(),
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(templates.id, templateId))
    .returning();

  if (!row) {
    throw new Error('Template not found');
  }

  await writeTemplateAudit({
    templateId: row.id,
    actorId: user.id,
    action: 'template_published',
    after: { status: row.status },
  });

  return row;
}

export async function archiveTemplate(id: string) {
  const user = await requireAdmin();
  const templateId = templateIdSchema.parse(id);
  const [row] = await db
    .update(templates)
    .set({
      status: 'archived',
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(templates.id, templateId))
    .returning();

  if (!row) {
    throw new Error('Template not found');
  }

  await writeTemplateAudit({
    templateId: row.id,
    actorId: user.id,
    action: 'template_archived',
    after: { status: row.status },
  });

  return row;
}

export async function removeTemplate(id: string) {
  const user = await requireAdmin();
  const templateId = templateIdSchema.parse(id);
  const [existing] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!existing) {
    throw new Error('Template not found');
  }

  await writeTemplateAudit({
    templateId,
    actorId: user.id,
    action: 'template_deleted',
  });
  await db.delete(templates).where(eq(templates.id, templateId));
}

export async function createTemplateAssetPresign(input: unknown) {
  const user = await requireOpsOrAdmin();
  const payload = presignTemplateAssetSchema.parse(input);

  if (!isTemplateAssetMimeType(payload.mimeType)) {
    throw new Error('Unsupported template asset MIME type');
  }

  const [template] = await db
    .select({ id: templates.id, status: templates.status })
    .from(templates)
    .where(eq(templates.id, payload.templateId))
    .limit(1);

  if (!template) {
    throw new Error('Template not found');
  }

  assertCanMutateTemplate(user, template, 'upload assets to');

  const assetId = randomUUID();
  const mimeType = payload.mimeType as TemplateAssetMimeType;
  const storageKey = buildTemplateAssetStorageKey(
    payload.templateId,
    assetId,
    mimeType
  );
  const publicUrl = buildPublicUrl(storageKey);
  const uploadUrl = await createSignedTemplateAssetPutUrl({
    storageKey,
    mimeType,
    sizeBytes: payload.sizeBytes,
  });

  await db.insert(assets).values({
    id: assetId,
    userId: user.id,
    type: 'upload',
    status: 'pending',
    storageKey,
    publicUrl,
    mimeType,
    sizeBytes: payload.sizeBytes,
  });

  return { assetId, uploadUrl, storageKey, publicUrl };
}

export async function completeTemplateAsset(input: unknown) {
  const user = await requireOpsOrAdmin();
  const payload = completeTemplateAssetSchema.parse(input);
  const role = payload.role as TemplateAssetRole;

  const [template] = await db
    .select({ id: templates.id, status: templates.status })
    .from(templates)
    .where(eq(templates.id, payload.templateId))
    .limit(1);

  if (!template) {
    throw new Error('Template not found');
  }

  assertCanMutateTemplate(user, template, 'upload assets to');

  const [asset] = await db
    .select()
    .from(assets)
    .where(
      and(
        eq(assets.id, payload.assetId),
        eq(assets.type, 'upload'),
        eq(assets.storageKey, payload.storageKey)
      )
    )
    .limit(1);

  if (!asset) {
    throw new Error('Template asset not found');
  }

  if (!hasAdminAccess(user) && asset.userId !== user.id) {
    throw new Error('Ops can only complete their own template uploads');
  }

  if (
    !storageKeyMatchesTemplateAsset(
      payload.templateId,
      payload.assetId,
      payload.storageKey
    )
  ) {
    throw new Error('Storage key does not match this template asset');
  }

  const uploadedObjectMatches = await verifyUploadedObject({
    storageKey: payload.storageKey,
    mimeType: asset.mimeType,
    sizeBytes: asset.sizeBytes,
  }).catch(() => false);

  if (!uploadedObjectMatches) {
    throw new Error('Invalid uploaded object metadata');
  }

  await db
    .update(assets)
    .set({ status: 'uploaded', updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(assets.id, payload.assetId));

  await db
    .insert(templateAssets)
    .values({
      templateId: payload.templateId,
      assetId: payload.assetId,
      role,
    })
    .onConflictDoNothing();

  if (role === 'preview' || role === 'thumbnail') {
    const assetUpdate =
      role === 'preview'
        ? { previewAssetId: payload.assetId }
        : { thumbnailAssetId: payload.assetId };

    await db
      .update(templates)
      .set({
        ...assetUpdate,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, payload.templateId));
  }

  await writeTemplateAudit({
    templateId: payload.templateId,
    actorId: user.id,
    action: 'template_asset_uploaded',
    after: { assetId: payload.assetId, role },
  });

  return {
    assetId: payload.assetId,
    publicUrl: asset.publicUrl,
    status: 'uploaded',
  };
}
