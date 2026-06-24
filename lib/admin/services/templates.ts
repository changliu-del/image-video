import 'server-only';

import { and, asc, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  dbIdSchema,
  dbIdSequences,
  reserveDbId,
  toDbIdString,
} from '@/lib/db/ids';
import { assets, templates } from '@/lib/db/schema';
import {
  hasAdminAccess,
  requireOpsOrAdmin,
  requireAdmin,
} from '@/lib/db/queries';
import {
  type TemplateCatalogDetailItem,
  type TemplateType,
} from '@/lib/templates/catalog';
import {
  getTemplateCategoriesForType,
  normalizeTemplateCategoryForType,
} from '@/lib/templates/category-config';
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
import { buildTemplateMediaUrl } from '@/lib/templates/media-url';
import { clearPublishedTemplateCatalogCache } from '@/lib/templates/query';
import { normalizeAdminSearchQuery } from '@/lib/admin/search';
import {
  exactCol,
  ilikeCol,
  type PaginatedResult,
  withPagination,
} from './shared';

const MAX_TEMPLATE_PREVIEW_BYTES = 80 * 1024 * 1024;
const templateIdSchema = dbIdSchema;
const localeSchema = z.enum(['pt']);
const templateTypeSchema = z.enum([
  'image_to_image',
  'image_to_video',
  'model',
  'try_on',
]);
const templateMediaTargetSchema = z.enum(['thumbnail', 'preview']);
const templateCategorySchema = z
  .string()
  .trim()
  .min(1)
  .max(120);
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
  thumbnailMimeType: string;
  previewMimeType: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminTemplateListResult = PaginatedResult<AdminTemplateListItem> & {
  categories: string[];
};

type TemplateMediaTarget = z.infer<typeof templateMediaTargetSchema>;

const templatePayloadSchema = z
  .object({
    id: dbIdSchema.optional(),
    type: templateTypeSchema,
    category: templateCategorySchema,
    title: z.string().trim().min(1).max(140),
    titleTranslations: titleTranslationsSchema,
    thumbnailAssetId: dbIdSchema,
    previewAssetId: dbIdSchema,
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
    templateIds: z.array(dbIdSchema).max(500),
  })
  .strict();

const presignTemplatePreviewSchema = z
  .object({
    templateId: dbIdSchema,
    target: templateMediaTargetSchema.optional(),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(1).max(120),
    sizeBytes: z.coerce.number().int().positive().max(MAX_TEMPLATE_PREVIEW_BYTES),
  })
  .strict();

const completeTemplatePreviewSchema = z
  .object({
    templateId: dbIdSchema,
    target: templateMediaTargetSchema.optional(),
    assetId: dbIdSchema,
    storageKey: z.string().trim().min(1).max(512),
  })
  .strict();

function normalizeTemplatePayload(input: unknown) {
  const payload = templatePayloadSchema.parse(input);
  const category = normalizeTemplateCategoryForType(payload.type, payload.category);
  if (!category) {
    throw new Error('Template category is invalid for this type');
  }

  return {
    ...payload,
    category,
  };
}

function normalizeTemplateGroup(input: unknown) {
  const group = templateGroupSchema.parse(input);
  const category = normalizeTemplateCategoryForType(group.type, group.category);
  if (!category) {
    throw new Error('Template category is invalid for this type');
  }

  return {
    ...group,
    category,
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

async function getUploadedAsset(assetId: number) {
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.status, 'uploaded')))
    .limit(1);

  return asset ?? null;
}

async function assertTemplateAssets(input: {
  thumbnailAssetId: number;
  previewAssetId: number;
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

  return { thumbnailAsset, previewAsset };
}

function assertTemplateUploadTargetMimeType(
  target: TemplateMediaTarget,
  mimeType: string | null | undefined
) {
  if (target === 'thumbnail' && !mimeType?.startsWith('image/')) {
    throw new Error('Template thumbnail upload must be an image');
  }

  if (
    target === 'preview' &&
    !mimeType?.startsWith('image/') &&
    !mimeType?.startsWith('video/')
  ) {
    throw new Error('Template preview upload must be an image or video');
  }
}

function inferTemplateUploadTarget(
  mimeType: string | null | undefined
): TemplateMediaTarget {
  return mimeType?.startsWith('image/') ? 'thumbnail' : 'preview';
}

function requireTemplateAssetMimeType(mimeType: string | null | undefined) {
  if (!mimeType) {
    throw new Error('Template media asset must have a MIME type');
  }

  return mimeType;
}

function normalizeAdminTemplateCategoryFilter(
  type: TemplateType | undefined,
  value: string | null | undefined
) {
  const category = value?.trim();
  if (!category) return undefined;

  if (!type) return category;
  return normalizeTemplateCategoryForType(type, category) ?? undefined;
}

function normalizeAdminModelCategoryFilter(value: string | null | undefined) {
  const tag = value?.trim();
  return tag || undefined;
}

function modelCategorySegmentCondition(value: string | null | undefined) {
  const tag = normalizeAdminModelCategoryFilter(value);
  return tag
    ? sql`${tag} = any(regexp_split_to_array(${templates.category}, '[\\/，、,]+'))`
    : undefined;
}

function sortAdminTemplateCategories(
  type: TemplateType | undefined,
  categories: string[]
) {
  if (!type) {
    return [...categories].sort((left, right) => left.localeCompare(right));
  }

  const preferredCategories = getTemplateCategoriesForType(type);
  const rank = new Map(
    preferredCategories.map((category, index) => [category, index])
  );

  return [...categories].sort((left, right) => {
    const leftRank = rank.get(left) ?? Number.POSITIVE_INFINITY;
    const rightRank = rank.get(right) ?? Number.POSITIVE_INFINITY;

    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.localeCompare(right);
  });
}

async function listAdminTemplateCategories(type: TemplateType | undefined) {
  const rows = await db
    .select({ category: templates.category })
    .from(templates)
    .where(type ? eq(templates.type, type) : undefined)
    .groupBy(templates.category)
    .orderBy(asc(templates.category));
  const dbCategories = rows
    .map((row) =>
      type
        ? (normalizeTemplateCategoryForType(type, row.category) ?? row.category)
        : row.category
    )
    .filter(Boolean);
  const configuredCategories = type ? getTemplateCategoriesForType(type) : [];

  return sortAdminTemplateCategories(
    type,
    Array.from(new Set([...configuredCategories, ...dbCategories]))
  );
}

async function refreshTemplateMediaCacheAfterAdminWrite(
  assetIds: number[],
  context: string
) {
  try {
    await refreshTemplateMediaCache(assetIds);
  } catch (error) {
    console.error(`Failed to refresh template media cache after ${context}`, error);
  }
}

async function refreshSingleTemplateMediaCacheAfterAdminWrite(
  assetId: number,
  context: string
) {
  try {
    await refreshTemplateMediaCacheForAsset(assetId);
  } catch (error) {
    console.error(`Failed to refresh template media cache after ${context}`, error);
  }
}

function adminTemplateRecordToListItem(
  row: typeof templates.$inferSelect
): AdminTemplateListItem {
  return {
    id: toDbIdString(row.id),
    title: row.title,
    titleTranslations: row.titleTranslations,
    type: row.type,
    category: row.category,
    thumbnailUrl: row.thumbnailUrl,
    thumbnailAssetId: toDbIdString(row.thumbnailAssetId),
    thumbnailMimeType: row.thumbnailMimeType,
    previewUrl: row.previewUrl,
    previewAssetId: toDbIdString(row.previewAssetId),
    previewMimeType: row.previewMimeType,
    prompt: row.prompt,
    promptTranslations: row.promptTranslations,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function getAdminTemplateDetail(id: number) {
  const [row] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, id))
    .limit(1);

  if (!row) {
    throw new Error('Template not found');
  }

  return adminTemplateRecordToListItem(row);
}

export async function listAdminTemplates(params: {
  age?: string;
  category?: string;
  gender?: string;
  id?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  style?: string;
  title?: string;
  type?: TemplateType;
}): Promise<AdminTemplateListResult> {
  await requireOpsOrAdmin();
  const { search = '', page = 1, pageSize = 20, type } = params;
  const query = normalizeAdminSearchQuery(search);
  const idQuery = normalizeAdminSearchQuery(params.id);
  const titleQuery = normalizeAdminSearchQuery(params.title);
  const category = normalizeAdminTemplateCategoryFilter(
    type,
    params.category
  );
  const searchWhere = query
    ? or(
        exactCol(templates.id, query),
        exactCol(templates.thumbnailAssetId, query),
        exactCol(templates.previewAssetId, query),
        ilikeCol(templates.type, query),
        ilikeCol(templates.title, query),
        ilikeCol(templates.category, query),
        ilikeCol(templates.prompt, query),
        sql`${templates.titleTranslations}::text ilike ${`%${query}%`}`,
        sql`${templates.promptTranslations}::text ilike ${`%${query}%`}`
      )
    : undefined;
  const conditions = [
    type ? eq(templates.type, type) : undefined,
    idQuery ? ilikeCol(templates.id, idQuery) : undefined,
    titleQuery
      ? or(
          ilikeCol(templates.title, titleQuery),
          sql`${templates.titleTranslations}::text ilike ${`%${titleQuery}%`}`
        )
      : undefined,
    category ? eq(templates.category, category) : undefined,
    type === 'model' ? modelCategorySegmentCondition(params.gender) : undefined,
    type === 'model' ? modelCategorySegmentCondition(params.age) : undefined,
    type === 'model' ? modelCategorySegmentCondition(params.style) : undefined,
    searchWhere,
  ].filter(Boolean) as SQL[];
  const where =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  const [rows, countRows, categories] = await Promise.all([
    withPagination(
      db
        .select()
        .from(templates)
        .where(where)
        .orderBy(desc(templates.updatedAt)),
      page,
      pageSize
    ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .where(where),
    listAdminTemplateCategories(type),
  ]);

  return {
    list: rows.map(adminTemplateRecordToListItem),
    categories,
    total: Number(countRows[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function listAdminTemplateOrder(input: unknown) {
  await requireOpsOrAdmin();
  const group = normalizeTemplateGroup(input);
  const rows = await db
    .select()
    .from(templates)
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
  const expectedIds = current.list.map((template) => Number(template.id));
  const expectedIdSet = new Set(expectedIds);
  const seenIds = new Set<number>();

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
  const { thumbnailAsset, previewAsset } = await assertTemplateAssets(payload);
  const thumbnailMimeType = requireTemplateAssetMimeType(thumbnailAsset.mimeType);
  const previewMimeType = requireTemplateAssetMimeType(previewAsset.mimeType);
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
      thumbnailUrl: buildTemplateMediaUrl(payload.thumbnailAssetId),
      previewUrl: buildTemplateMediaUrl(payload.previewAssetId),
      thumbnailMimeType,
      previewMimeType,
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
  const { thumbnailAsset, previewAsset } = await assertTemplateAssets(payload);
  const thumbnailMimeType = requireTemplateAssetMimeType(thumbnailAsset.mimeType);
  const previewMimeType = requireTemplateAssetMimeType(previewAsset.mimeType);
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
      thumbnailUrl: buildTemplateMediaUrl(payload.thumbnailAssetId),
      previewUrl: buildTemplateMediaUrl(payload.previewAssetId),
      thumbnailMimeType,
      previewMimeType,
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
  if (payload.target) {
    assertTemplateUploadTargetMimeType(payload.target, payload.mimeType);
  }

  const [template] = await db
    .select({ id: templates.id })
    .from(templates)
    .where(eq(templates.id, payload.templateId))
    .limit(1);

  if (!template) {
    throw new Error('Template not found');
  }

  const assetId = await reserveDbId(dbIdSequences.assets);
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

  return { assetId: toDbIdString(assetId), uploadUrl, storageKey, publicUrl };
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

  const target = payload.target ?? inferTemplateUploadTarget(asset.mimeType);
  assertTemplateUploadTargetMimeType(target, asset.mimeType);
  const mimeType = requireTemplateAssetMimeType(asset.mimeType);

  const replacedAssetId =
    target === 'thumbnail' ? template.thumbnailAssetId : template.previewAssetId;

  await db
    .update(templates)
    .set({
      ...(target === 'thumbnail'
        ? {
            thumbnailAssetId: asset.id,
            thumbnailUrl: buildTemplateMediaUrl(asset.id),
            thumbnailMimeType: mimeType,
          }
        : {
            previewAssetId: asset.id,
            previewUrl: buildTemplateMediaUrl(asset.id),
            previewMimeType: mimeType,
          }),
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
    assetId: toDbIdString(payload.assetId),
    publicUrl: buildTemplateMediaUrl(asset.id),
    target,
    status: 'uploaded',
  };
}
