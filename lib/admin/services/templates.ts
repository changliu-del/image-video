import 'server-only';

import { randomUUID } from 'crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  templates,
  type Template,
} from '@/lib/db/schema';
import {
  hasAdminAccess,
  requireOpsOrAdmin,
  requireAdmin,
} from '@/lib/db/queries';
import {
  templateTagOptions,
  type TemplateCatalogItem,
} from '@/lib/templates/catalog';
import { mapTemplateRecordToCatalogItem } from '@/lib/templates/query';
import {
  buildPublicUrl,
  buildTemplatePreviewStorageKey,
  createSignedAdminMediaPutUrl,
  isAdminMediaMimeType,
  storageKeyMatchesTemplatePreview,
  verifyUploadedObject,
  type AdminMediaMimeType,
} from '@/lib/storage/r2';
import {
  adminSearchMatches,
  normalizeAdminSearchQuery,
} from '@/lib/admin/search';
import { type PaginatedResult } from './shared';

const MAX_TEMPLATE_PREVIEW_BYTES = 80 * 1024 * 1024;
const templateIdSchema = z.string().uuid();

type AdminTemplateRecord = Template & {
  previewAsset: typeof assets.$inferSelect | null;
};

export type AdminTemplateListItem = TemplateCatalogItem & {
  negativePrompt: string | null;
  previewAssetId: string | null;
  createdAt: string;
  updatedAt: string;
  sortWeight: number;
  usageCount: number;
};

const templatePayloadSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(2).max(140),
    description: z.string().trim().min(2).max(1200),
    category: z.enum(['image_to_video', 'image_to_image', 'try_on']),
    prompt: z.string().trim().min(4).max(5000),
    negativePrompt: z.string().trim().max(2000).optional().nullable(),
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

const presignTemplatePreviewSchema = z
  .object({
    templateId: z.string().uuid(),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(120),
    sizeBytes: z.coerce.number().int().positive().max(MAX_TEMPLATE_PREVIEW_BYTES),
  })
  .strict();

const completeTemplatePreviewSchema = z
  .object({
    templateId: z.string().uuid(),
    assetId: z.string().uuid(),
    storageKey: z.string().trim().min(1).max(512),
  })
  .strict();

const templateTagSlugSet = new Set(templateTagOptions.map((tag) => tag.slug));

function matchesAdminExactId(value: string | null | undefined, query: string) {
  return Boolean(value && query && value.toLowerCase() === query);
}

function normalizeTemplatePayload(input: unknown) {
  const parsed = templatePayloadSchema.parse(input);
  return {
    ...parsed,
    negativePrompt: parsed.negativePrompt?.trim() || null,
    durationSeconds:
      parsed.category === 'image_to_video' ? parsed.durationSeconds ?? 5 : null,
    tagSlugs: Array.from(new Set(parsed.tagSlugs)).filter((slug) =>
      templateTagSlugSet.has(slug)
    ),
  };
}

function adminTemplateRecordToListItem(
  row: AdminTemplateRecord
): AdminTemplateListItem {
  const catalogItem = mapTemplateRecordToCatalogItem(row);

  return {
    ...catalogItem,
    negativePrompt: row.negativePrompt,
    previewAssetId: row.previewAssetId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    sortWeight: row.sortWeight,
    usageCount: row.usageCount,
  };
}

function getTemplateSearchTags(row: AdminTemplateRecord) {
  const labels = row.tagsJson.flatMap((slug) => {
    const option = templateTagOptions.find((tag) => tag.slug === slug);
    return option
      ? [slug, option.group, option.labels.pt, option.labels.en, option.labels.zh]
      : [slug];
  });

  return labels;
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
    },
    orderBy: [desc(templates.updatedAt)],
  })) as AdminTemplateRecord[];

  const filtered = query
    ? rows.filter((row) =>
        matchesAdminExactId(row.id, query) ||
        adminSearchMatches(
          [
            row.name,
            row.description,
            row.category,
            ...getTemplateSearchTags(row),
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

export async function createTemplate(input: unknown) {
  const user = await requireOpsOrAdmin();
  const payload = normalizeTemplatePayload(input);
  const [row] = await db
    .insert(templates)
    .values({
      name: payload.name,
      description: payload.description,
      category: payload.category,
      prompt: payload.prompt,
      negativePrompt: payload.negativePrompt,
      tagsJson: payload.tagSlugs,
      costCredits: payload.costCredits,
      aspectRatiosJson: payload.aspectRatios,
      durationSeconds: payload.durationSeconds,
      sortWeight: payload.sortWeight,
      createdBy: user.id,
      updatedBy: user.id,
    })
    .returning();

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

  const [row] = await db
    .update(templates)
    .set({
      name: payload.name,
      description: payload.description,
      category: payload.category,
      prompt: payload.prompt,
      negativePrompt: payload.negativePrompt,
      tagsJson: payload.tagSlugs,
      costCredits: payload.costCredits,
      aspectRatiosJson: payload.aspectRatios,
      durationSeconds: payload.durationSeconds,
      sortWeight: payload.sortWeight,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(templates.id, templateId))
    .returning();

  return row;
}

export async function removeTemplate(id: string) {
  await requireAdmin();
  const templateId = templateIdSchema.parse(id);
  const [existing] = await db
    .select({
      id: templates.id,
      name: templates.name,
      category: templates.category,
    })
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!existing) {
    throw new Error('Template not found');
  }

  await db.delete(templates).where(eq(templates.id, templateId));
}

export async function createTemplatePreviewPresign(input: unknown) {
  const user = await requireOpsOrAdmin();
  const payload = presignTemplatePreviewSchema.parse(input);

  if (!isAdminMediaMimeType(payload.mimeType)) {
    throw new Error('Unsupported template preview MIME type');
  }

  const [template] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(eq(templates.id, payload.templateId))
    .limit(1);

  if (!template) {
    throw new Error('Template not found');
  }

  const assetId = randomUUID();
  const mimeType = payload.mimeType as AdminMediaMimeType;
  const storageKey = buildTemplatePreviewStorageKey(
    payload.templateId,
    assetId,
    mimeType
  );
  const publicUrl = buildPublicUrl(storageKey);
  const uploadUrl = await createSignedAdminMediaPutUrl({
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

export async function completeTemplatePreviewUpload(input: unknown) {
  const user = await requireOpsOrAdmin();
  const payload = completeTemplatePreviewSchema.parse(input);

  const [template] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(eq(templates.id, payload.templateId))
    .limit(1);

  if (!template) {
    throw new Error('Template not found');
  }

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
    throw new Error('Template preview asset not found');
  }

  if (!hasAdminAccess(user) && asset.userId !== user.id) {
    throw new Error('Ops can only complete their own template uploads');
  }

  if (
    !storageKeyMatchesTemplatePreview(
      payload.templateId,
      payload.assetId,
      payload.storageKey
    )
  ) {
    throw new Error('Storage key does not match this template preview');
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
    .update(templates)
    .set({
      previewAssetId: payload.assetId,
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(templates.id, payload.templateId));

  return {
    assetId: payload.assetId,
    publicUrl: asset.publicUrl,
    status: 'uploaded',
  };
}
