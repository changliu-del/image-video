import 'server-only';

import { randomUUID } from 'crypto';
import { and, asc, desc, eq, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  templates,
  type Asset,
} from '@/lib/db/schema';
import {
  hasAdminAccess,
  requireOpsOrAdmin,
  requireAdmin,
} from '@/lib/db/queries';
import {
  type TemplateCatalogDetailItem,
  type TemplateType,
} from '@/lib/templates/catalog';
import { normalizeTemplateCategoryForType } from '@/lib/templates/category-config';
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
  deleteTemplateMediaCacheEntries,
  refreshTemplateMediaCache,
  refreshTemplateMediaCacheForAsset,
} from '@/lib/templates/media-cache';
import { clearPublishedTemplateCatalogCache } from '@/lib/templates/query';
import { normalizeAdminSearchQuery } from '@/lib/admin/search';
import {
  exactCol,
  ilikeCol,
  type PaginatedResult,
  withPagination,
} from './shared';

const MAX_TEMPLATE_PREVIEW_BYTES = 80 * 1024 * 1024;
const templateIdSchema = z.string().uuid();
const adminThumbnailAsset = alias(assets, 'admin_template_thumbnail_asset');
const adminPreviewAsset = alias(assets, 'admin_template_preview_asset');
const localeSchema = z.enum(['pt', 'en', 'zh']);
const templateTypeSchema = z.enum([
  'image_to_image',
  'image_to_video',
  'try_on',
]);
const templateCategorySchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9_-]*$/);
const titleTranslationsSchema = z
  .record(localeSchema, z.string().trim().min(1).max(140))
  .optional()
  .default({});
const promptTranslationsSchema = z
  .record(localeSchema, z.string().trim().min(1).max(5000))
  .optional()
  .default({});

export type AdminTemplateListItem = TemplateCatalogDetailItem & {
  titleTranslations: Record<string, string>;
  promptTranslations: Record<string, string>;
  thumbnailAssetId: string;
  previewAssetId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type AdminTemplateRecord = {
  template: typeof templates.$inferSelect;
  thumbnailAsset: Pick<Asset, 'publicUrl' | 'mimeType' | 'status'>;
  previewAsset: Pick<Asset, 'publicUrl' | 'mimeType' | 'status'>;
};

const templatePayloadSchema = z
  .object({
    id: z.string().uuid().optional(),
    type: templateTypeSchema,
    category: templateCategorySchema,
    title: z.string().trim().min(1).max(140),
    titleTranslations: titleTranslationsSchema,
    thumbnailAssetId: z.string().uuid(),
    previewAssetId: z.string().uuid(),
    prompt: z.string().trim().min(4).max(5000),
    promptTranslations: promptTranslationsSchema,
  })
  .strict();

const templateGroupSchema = z
  .object({
    type: templateTypeSchema,
    category: templateCategorySchema,
  })
  .strict();

const templateOrderPayloadSchema = templateGroupSchema
  .extend({
    templateIds: z.array(z.string().uuid()).max(500),
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

function normalizeTemplatePayload(input: unknown) {
  const payload = templatePayloadSchema.parse(input);
  return {
    ...payload,
    category:
      normalizeTemplateCategoryForType(payload.type, payload.category) ??
      payload.category,
  };
}

function normalizeTemplateGroup(input: unknown) {
  const group = templateGroupSchema.parse(input);
  return {
    ...group,
    category:
      normalizeTemplateCategoryForType(group.type, group.category) ??
      group.category,
  };
}

async function getNextTemplateSortOrder(input: {
  category: string;
  type: TemplateType;
}) {
  const [row] = await db
    .select({
      nextSortOrder: sql<number>`coalesce(max(${templates.sortOrder}), 0)::int + 1`,
    })
    .from(templates)
    .where(
      and(
        eq(templates.type, input.type),
        eq(templates.category, input.category)
      )
    );

  return Number(row?.nextSortOrder ?? 1);
}

async function getUploadedAsset(assetId: string) {
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.status, 'uploaded')))
    .limit(1);

  return asset ?? null;
}

async function assertTemplateAssets(input: {
  thumbnailAssetId: string;
  previewAssetId: string;
}) {
  const [thumbnailAsset, previewAsset] = await Promise.all([
    getUploadedAsset(input.thumbnailAssetId),
    getUploadedAsset(input.previewAssetId),
  ]);

  if (!thumbnailAsset) {
    throw new Error('Template thumbnail asset must exist and be uploaded');
  }

  if (!thumbnailAsset.mimeType?.startsWith('image/')) {
    throw new Error('Template thumbnail asset must be an image');
  }

  if (!previewAsset) {
    throw new Error('Template preview asset must exist and be uploaded');
  }

  if (
    !previewAsset.mimeType?.startsWith('image/') &&
    !previewAsset.mimeType?.startsWith('video/')
  ) {
    throw new Error('Template preview asset must be an image or video');
  }
}

async function refreshTemplateMediaCacheAfterAdminWrite(
  assetIds: string[],
  context: string
) {
  try {
    await refreshTemplateMediaCache(assetIds);
  } catch (error) {
    console.error(`Failed to refresh template media cache after ${context}`, error);
  }
}

async function refreshSingleTemplateMediaCacheAfterAdminWrite(
  assetId: string,
  context: string
) {
  try {
    await refreshTemplateMediaCacheForAsset(assetId);
  } catch (error) {
    console.error(`Failed to refresh template media cache after ${context}`, error);
  }
}

function adminTemplateRecordToListItem(
  row: AdminTemplateRecord
): AdminTemplateListItem {
  return {
    id: row.template.id,
    title: row.template.title,
    titleTranslations: row.template.titleTranslations,
    type: row.template.type,
    category: row.template.category,
    thumbnailUrl: row.thumbnailAsset.publicUrl,
    thumbnailAssetId: row.template.thumbnailAssetId,
    previewUrl: row.previewAsset.publicUrl,
    previewAssetId: row.template.previewAssetId,
    prompt: row.template.prompt,
    promptTranslations: row.template.promptTranslations,
    sortOrder: row.template.sortOrder,
    createdAt: row.template.createdAt.toISOString(),
    updatedAt: row.template.updatedAt.toISOString(),
  };
}

async function getAdminTemplateDetail(id: string) {
  const [row] = await db
    .select({
      template: templates,
      thumbnailAsset: {
        publicUrl: adminThumbnailAsset.publicUrl,
        mimeType: adminThumbnailAsset.mimeType,
        status: adminThumbnailAsset.status,
      },
      previewAsset: {
        publicUrl: adminPreviewAsset.publicUrl,
        mimeType: adminPreviewAsset.mimeType,
        status: adminPreviewAsset.status,
      },
    })
    .from(templates)
    .innerJoin(
      adminThumbnailAsset,
      eq(templates.thumbnailAssetId, adminThumbnailAsset.id)
    )
    .innerJoin(
      adminPreviewAsset,
      eq(templates.previewAssetId, adminPreviewAsset.id)
    )
    .where(eq(templates.id, id))
    .limit(1);

  if (!row) {
    throw new Error('Template not found');
  }

  return adminTemplateRecordToListItem(row);
}

export async function listAdminTemplates(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminTemplateListItem>> {
  await requireOpsOrAdmin();
  const { search = '', page = 1, pageSize = 20 } = params;
  const query = normalizeAdminSearchQuery(search);
  const where = query
    ? or(
        exactCol(templates.id, query),
        exactCol(templates.thumbnailAssetId, query),
        exactCol(templates.previewAssetId, query),
        ilikeCol(templates.type, query),
        ilikeCol(templates.title, query),
        ilikeCol(templates.category, query),
        ilikeCol(templates.prompt, query),
        sql`${templates.titleTranslations}::text ilike ${`%${query}%`}`,
        sql`${templates.promptTranslations}::text ilike ${`%${query}%`}`,
        ilikeCol(adminThumbnailAsset.mimeType, query),
        ilikeCol(adminPreviewAsset.mimeType, query)
      )
    : undefined;

  const [rows, countRows] = await Promise.all([
    withPagination(
      db
        .select({
          template: templates,
          thumbnailAsset: {
            publicUrl: adminThumbnailAsset.publicUrl,
            mimeType: adminThumbnailAsset.mimeType,
            status: adminThumbnailAsset.status,
          },
          previewAsset: {
            publicUrl: adminPreviewAsset.publicUrl,
            mimeType: adminPreviewAsset.mimeType,
            status: adminPreviewAsset.status,
          },
        })
        .from(templates)
        .innerJoin(
          adminThumbnailAsset,
          eq(templates.thumbnailAssetId, adminThumbnailAsset.id)
        )
        .innerJoin(
          adminPreviewAsset,
          eq(templates.previewAssetId, adminPreviewAsset.id)
        )
        .where(where)
        .orderBy(desc(templates.updatedAt)),
      page,
      pageSize
    ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .innerJoin(
        adminThumbnailAsset,
        eq(templates.thumbnailAssetId, adminThumbnailAsset.id)
      )
      .innerJoin(
        adminPreviewAsset,
        eq(templates.previewAssetId, adminPreviewAsset.id)
      )
      .where(where),
  ]);

  return {
    list: rows.map(adminTemplateRecordToListItem),
    total: Number(countRows[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function listAdminTemplateOrder(input: unknown) {
  await requireOpsOrAdmin();
  const group = normalizeTemplateGroup(input);
  const rows = await db
    .select({
      template: templates,
      thumbnailAsset: {
        publicUrl: adminThumbnailAsset.publicUrl,
        mimeType: adminThumbnailAsset.mimeType,
        status: adminThumbnailAsset.status,
      },
      previewAsset: {
        publicUrl: adminPreviewAsset.publicUrl,
        mimeType: adminPreviewAsset.mimeType,
        status: adminPreviewAsset.status,
      },
    })
    .from(templates)
    .innerJoin(
      adminThumbnailAsset,
      eq(templates.thumbnailAssetId, adminThumbnailAsset.id)
    )
    .innerJoin(
      adminPreviewAsset,
      eq(templates.previewAssetId, adminPreviewAsset.id)
    )
    .where(
      and(
        eq(templates.type, group.type),
        eq(templates.category, group.category)
      )
    )
    .orderBy(
      asc(templates.sortOrder),
      asc(templates.createdAt),
      asc(templates.id)
    );

  return {
    ...group,
    list: rows.map(adminTemplateRecordToListItem),
    total: rows.length,
  };
}

export async function updateAdminTemplateOrder(input: unknown) {
  await requireOpsOrAdmin();
  const payload = templateOrderPayloadSchema.parse(input);
  const group = normalizeTemplateGroup({
    type: payload.type,
    category: payload.category,
  });
  const current = await listAdminTemplateOrder(group);
  const expectedIds = current.list.map((template) => template.id);
  const expectedIdSet = new Set(expectedIds);
  const seenIds = new Set<string>();

  if (payload.templateIds.length !== expectedIds.length) {
    throw new Error(
      'Invalid template order: templateIds must include every template in this type/category.'
    );
  }

  for (const templateId of payload.templateIds) {
    if (seenIds.has(templateId)) {
      throw new Error('Invalid template order: duplicate template id.');
    }

    if (!expectedIdSet.has(templateId)) {
      throw new Error(
        'Invalid template order: template id is outside this type/category.'
      );
    }

    seenIds.add(templateId);
  }

  await db.transaction(async (tx) => {
    const updatedAt = new Date();
    for (let index = 0; index < payload.templateIds.length; index += 1) {
      await tx
        .update(templates)
        .set({
          sortOrder: index + 1,
          updatedAt,
        })
        .where(eq(templates.id, payload.templateIds[index]));
    }
  });

  clearPublishedTemplateCatalogCache();
  return listAdminTemplateOrder(group);
}

export async function createTemplate(input: unknown) {
  await requireOpsOrAdmin();
  const payload = normalizeTemplatePayload(input);
  await assertTemplateAssets(payload);
  const sortOrder = await getNextTemplateSortOrder({
    type: payload.type,
    category: payload.category,
  });

  const [row] = await db
    .insert(templates)
    .values({
      type: payload.type,
      title: payload.title,
      titleTranslations: payload.titleTranslations,
      category: payload.category,
      thumbnailAssetId: payload.thumbnailAssetId,
      previewAssetId: payload.previewAssetId,
      prompt: payload.prompt,
      promptTranslations: payload.promptTranslations,
      sortOrder,
    })
    .returning();

  await refreshTemplateMediaCacheAfterAdminWrite(
    [payload.thumbnailAssetId, payload.previewAssetId],
    'template create'
  );
  clearPublishedTemplateCatalogCache();

  return getAdminTemplateDetail(row.id);
}

export async function updateTemplate(id: string, input: unknown) {
  await requireOpsOrAdmin();
  const templateId = templateIdSchema.parse(id);
  const payload = normalizeTemplatePayload(input);
  await assertTemplateAssets(payload);
  const [existing] = await db
    .select({
      id: templates.id,
      type: templates.type,
      category: templates.category,
      sortOrder: templates.sortOrder,
      thumbnailAssetId: templates.thumbnailAssetId,
      previewAssetId: templates.previewAssetId,
    })
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!existing) {
    throw new Error('Template not found');
  }

  const movedGroup =
    existing.type !== payload.type || existing.category !== payload.category;
  const sortOrder = movedGroup
    ? await getNextTemplateSortOrder({
        type: payload.type,
        category: payload.category,
      })
    : existing.sortOrder;

  const [row] = await db
    .update(templates)
    .set({
      type: payload.type,
      title: payload.title,
      titleTranslations: payload.titleTranslations,
      category: payload.category,
      thumbnailAssetId: payload.thumbnailAssetId,
      previewAssetId: payload.previewAssetId,
      prompt: payload.prompt,
      promptTranslations: payload.promptTranslations,
      sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(templates.id, templateId))
    .returning();

  const nextAssetIds = [payload.thumbnailAssetId, payload.previewAssetId];
  deleteTemplateMediaCacheEntries(
    [existing.thumbnailAssetId, existing.previewAssetId].filter(
      (assetId) => !nextAssetIds.includes(assetId)
    )
  );
  await refreshTemplateMediaCacheAfterAdminWrite(
    nextAssetIds,
    'template update'
  );
  clearPublishedTemplateCatalogCache();

  return getAdminTemplateDetail(row.id);
}

export async function removeTemplate(id: string) {
  await requireAdmin();
  const templateId = templateIdSchema.parse(id);
  const [existing] = await db
    .select({
      id: templates.id,
      thumbnailAssetId: templates.thumbnailAssetId,
      previewAssetId: templates.previewAssetId,
      prompt: templates.prompt,
      category: templates.category,
    })
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);

  if (!existing) {
    throw new Error('Template not found');
  }

  await db.delete(templates).where(eq(templates.id, templateId));
  deleteTemplateMediaCacheEntries([
    existing.thumbnailAssetId,
    existing.previewAssetId,
  ]);
  clearPublishedTemplateCatalogCache();
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
    .select({
      id: templates.id,
      thumbnailAssetId: templates.thumbnailAssetId,
      previewAssetId: templates.previewAssetId,
    })
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

  const target = asset.mimeType?.startsWith('image/') ? 'thumbnail' : 'preview';
  const replacedAssetId =
    target === 'thumbnail' ? template.thumbnailAssetId : template.previewAssetId;

  await db
    .update(templates)
    .set({
      ...(target === 'thumbnail'
        ? { thumbnailAssetId: asset.id }
        : { previewAssetId: asset.id }),
      updatedAt: new Date(),
    })
    .where(eq(templates.id, payload.templateId));

  if (replacedAssetId !== asset.id) {
    deleteTemplateMediaCacheEntries([replacedAssetId]);
  }
  await refreshSingleTemplateMediaCacheAfterAdminWrite(
    asset.id,
    'template preview upload complete'
  );
  clearPublishedTemplateCatalogCache();

  return {
    assetId: payload.assetId,
    publicUrl: asset.publicUrl,
    target,
    status: 'uploaded',
  };
}
