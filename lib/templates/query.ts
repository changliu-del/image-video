import 'server-only';

import { asc, sql } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import { db } from '@/lib/db/drizzle';
import { templates } from '@/lib/db/schema';
import type {
  TemplateCatalogDetailItem,
  TemplateCatalogListItem,
  TemplateType,
} from '@/lib/templates/catalog';
import type { Locale } from '@/lib/marketing/content';
import {
  getTemplateCategoriesForType,
  normalizeTemplateCategoryForType,
} from '@/lib/templates/category-config';

const templateCatalogMetadataCacheKey =
  '__imageVideoPublishedTemplateCatalogMetadataCache';
const templateCatalogMetadataCacheTtlMs = 5 * 60 * 1000;
const templateCatalogDataCacheTag = 'image-video-published-template-catalog';
const templateCatalogDataCacheRevalidateSeconds = 5 * 60;

type TemplateListRow = {
  id: number;
  title: string;
  titleTranslations: Record<string, string>;
  type: TemplateType;
  category: string;
  thumbnailAssetId: number;
  previewAssetId: number;
  thumbnailUrl: string;
  previewUrl: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type TemplateDetailRow = TemplateListRow & {
  prompt: string;
  promptTranslations: Record<string, string>;
};

type SerializedTemplateDetailRow = Omit<
  TemplateDetailRow,
  'createdAt' | 'updatedAt'
> & {
  createdAt: string;
  updatedAt: string;
};

type CachedPublishedTemplateMetadata = {
  categories: string[];
  expiresAt: number;
  rows: TemplateDetailRow[];
};

type PublishedTemplateCatalogCacheState = {
  records: Map<TemplateType, CachedPublishedTemplateMetadata>;
  pending: Map<TemplateType, Promise<CachedPublishedTemplateMetadata>>;
  version: number;
};

export type ListPublishedTemplatesInput = {
  page?: number;
  pageSize?: number;
  locale?: string | null;
  search?: string;
  type?: TemplateType;
  category?: string;
};

export type PublishedTemplatesResult = {
  list: TemplateCatalogListItem[];
  categories: string[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const supportedLocales = new Set(['pt', 'en']);

function templateCatalogCacheState() {
  const globalScope = globalThis as typeof globalThis & {
    [templateCatalogMetadataCacheKey]?: PublishedTemplateCatalogCacheState;
  };

  if (!globalScope[templateCatalogMetadataCacheKey]) {
    globalScope[templateCatalogMetadataCacheKey] = {
      records: new Map(),
      pending: new Map(),
      version: 0,
    };
  }

  return globalScope[templateCatalogMetadataCacheKey]!;
}

function normalizeTemplateLocale(value: string | null | undefined): Locale {
  return value && supportedLocales.has(value)
    ? (value as Locale)
    : 'en';
}

function resolveLocalizedText(
  fallback: string,
  translations: Record<string, string>,
  locale: Locale
) {
  const translated = translations?.[locale]?.trim();
  return translated || fallback;
}

function mapTemplateListRow(
  row: TemplateListRow,
  locale: Locale
): TemplateCatalogListItem {
  return {
    id: String(row.id),
    title: resolveLocalizedText(row.title, row.titleTranslations, locale),
    type: row.type,
    category:
      normalizeTemplateCategoryForType(row.type, row.category) ?? row.category,
    thumbnailUrl: row.thumbnailUrl,
    previewUrl: row.previewUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapTemplateDetailRow(
  row: TemplateDetailRow,
  locale: Locale
): TemplateCatalogDetailItem {
  return {
    ...mapTemplateListRow(row, locale),
    prompt: resolveLocalizedText(row.prompt, row.promptTranslations, locale),
  };
}

function normalizePage(value: number | undefined) {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 1;
  }

  return value;
}

function normalizePageSize(value: number | undefined) {
  if (!Number.isInteger(value) || !value) {
    return 12;
  }

  return Math.min(48, Math.max(1, value));
}

function baseTemplateDetailQuery() {
  return db
    .select({
      id: templates.id,
      title: templates.title,
      titleTranslations: templates.titleTranslations,
      type: templates.type,
      category: templates.category,
      thumbnailAssetId: templates.thumbnailAssetId,
      previewAssetId: templates.previewAssetId,
      thumbnailUrl: templates.thumbnailUrl,
      previewUrl: templates.previewUrl,
      prompt: templates.prompt,
      promptTranslations: templates.promptTranslations,
      sortOrder: templates.sortOrder,
      createdAt: templates.createdAt,
      updatedAt: templates.updatedAt,
    })
    .from(templates);
}

function sortTemplateCategories(type: TemplateType, categories: string[]) {
  const preferredCategories = getTemplateCategoriesForType(type);
  const preferredRank = new Map(
    preferredCategories.map((category, index) => [category, index])
  );

  return [...categories].sort((left, right) => {
    const leftRank = preferredRank.get(left) ?? Number.POSITIVE_INFINITY;
    const rightRank = preferredRank.get(right) ?? Number.POSITIVE_INFINITY;

    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.localeCompare(right);
  });
}

function sortTemplateRows<T extends TemplateListRow>(type: TemplateType, rows: T[]) {
  const preferredCategories = getTemplateCategoriesForType(type);
  const preferredRank = new Map(
    preferredCategories.map((category, index) => [category, index])
  );

  return [...rows].sort((left, right) => {
    const leftCategory =
      normalizeTemplateCategoryForType(left.type, left.category) ?? left.category;
    const rightCategory =
      normalizeTemplateCategoryForType(right.type, right.category) ?? right.category;
    const leftRank =
      preferredRank.get(leftCategory) ?? Number.POSITIVE_INFINITY;
    const rightRank =
      preferredRank.get(rightCategory) ?? Number.POSITIVE_INFINITY;

    if (leftRank !== rightRank) return leftRank - rightRank;
    if (leftCategory !== rightCategory) {
      return leftCategory.localeCompare(rightCategory);
    }
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    const createdAtDelta =
      left.createdAt.getTime() - right.createdAt.getTime();
    if (createdAtDelta !== 0) return createdAtDelta;

    return String(left.id).localeCompare(String(right.id));
  });
}

function categoriesFromTemplateRows(type: TemplateType, rows: TemplateDetailRow[]) {
  const preferredCategories = getTemplateCategoriesForType(type);
  if (preferredCategories.length > 0) {
    return [...preferredCategories];
  }

  return sortTemplateCategories(
    type,
    Array.from(new Set(rows.map((row) => row.category)))
  );
}

function templateMatchesSearch(row: TemplateDetailRow, search: string) {
  if (!search) return true;

  const normalized = search.toLowerCase();
  const values = [
    row.category,
    String(row.id),
    row.prompt,
    row.title,
    ...Object.values(row.promptTranslations ?? {}),
    ...Object.values(row.titleTranslations ?? {}),
  ];

  return values.some((value) => value.toLowerCase().includes(normalized));
}

async function loadPublishedTemplateRowsForType(type: TemplateType) {
  const rows = await baseTemplateDetailQuery()
    .where(
      sql`${templates.type} = ${type}
        and length(trim(${templates.thumbnailUrl})) > 0
        and length(trim(${templates.previewUrl})) > 0`
    )
    .orderBy(
      asc(templates.category),
      asc(templates.sortOrder),
      asc(templates.createdAt),
      asc(templates.id)
    );

  return rows.map(serializeTemplateDetailRow);
}

const loadPublishedTemplateRowsForTypeFromNextCache = unstable_cache(
  loadPublishedTemplateRowsForType,
  ['image-video-published-template-rows-v1'],
  {
    tags: [templateCatalogDataCacheTag],
    revalidate: templateCatalogDataCacheRevalidateSeconds,
  }
);

function serializeTemplateDetailRow(
  row: TemplateDetailRow
): SerializedTemplateDetailRow {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function deserializeTemplateDetailRow(
  row: SerializedTemplateDetailRow
): TemplateDetailRow {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

async function getCachedPublishedTemplateMetadataForType(type: TemplateType) {
  const state = templateCatalogCacheState();
  const now = Date.now();
  const cached = state.records.get(type);

  if (cached && cached.expiresAt > now) {
    return cached;
  }

  const pending = state.pending.get(type);
  if (pending) {
    return pending;
  }

  const version = state.version;
  const pendingLoad = loadPublishedTemplateRowsForTypeFromNextCache(type)
    .then((rows) => {
      const sortedRows = sortTemplateRows(
        type,
        rows.map(deserializeTemplateDetailRow)
      );
      const metadata: CachedPublishedTemplateMetadata = {
        categories: categoriesFromTemplateRows(type, sortedRows),
        expiresAt: Date.now() + templateCatalogMetadataCacheTtlMs,
        rows: sortedRows,
      };

      if (state.version === version) {
        state.records.set(type, metadata);
      }

      return metadata;
    })
    .finally(() => {
      state.pending.delete(type);
    });

  state.pending.set(type, pendingLoad);
  return pendingLoad;
}

function getCachedTemplateDetailById(id: string) {
  const state = templateCatalogCacheState();
  const now = Date.now();

  for (const cached of state.records.values()) {
    if (cached.expiresAt <= now) continue;
    const row = cached.rows.find((template) => String(template.id) === id);
    if (row) return row;
  }

  return null;
}

export function clearPublishedTemplateCatalogCache() {
  const state = templateCatalogCacheState();
  state.version += 1;
  state.records.clear();
  state.pending.clear();
  revalidateTag(templateCatalogDataCacheTag, { expire: 0 });
}

export async function listPublishedTemplates(
  params: ListPublishedTemplatesInput
): Promise<PublishedTemplatesResult> {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const locale = normalizeTemplateLocale(params.locale);
  const type = params.type ?? 'image_to_video';
  const search = params.search?.trim() ?? '';
  const requestedCategory = params.category?.trim() ?? '';
  const category = requestedCategory
    ? (normalizeTemplateCategoryForType(type, requestedCategory) ?? undefined)
    : undefined;

  const metadata = await getCachedPublishedTemplateMetadataForType(type);

  if (requestedCategory && !category) {
    return {
      list: [],
      categories: metadata.categories,
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }

  const filteredRows: TemplateDetailRow[] = [];
  for (const row of metadata.rows) {
    const rowCategory =
      normalizeTemplateCategoryForType(row.type, row.category) ?? row.category;
    if (category && rowCategory !== category) continue;
    if (!templateMatchesSearch(row, search)) continue;
    filteredRows.push(row);
  }

  const total = filteredRows.length;
  const offset = (page - 1) * pageSize;
  const rows = filteredRows.slice(offset, offset + pageSize);

  return {
    list: rows.map((row) => mapTemplateListRow(row, locale)),
    categories: metadata.categories,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function getTemplateDetail(id: string, localeInput?: string | null) {
  const locale = normalizeTemplateLocale(localeInput);
  const cachedRow = getCachedTemplateDetailById(id);
  if (cachedRow) {
    return mapTemplateDetailRow(cachedRow, locale);
  }

  const [row] = await baseTemplateDetailQuery()
    .where(
      sql`${templates.id}::text = ${id}
        and length(trim(${templates.thumbnailUrl})) > 0
        and length(trim(${templates.previewUrl})) > 0`
    )
    .limit(1);

  return row ? mapTemplateDetailRow(row, locale) : null;
}

export async function listAllTemplates() {
  const rows = await baseTemplateDetailQuery().orderBy(
    asc(templates.type),
    asc(templates.category),
    asc(templates.sortOrder),
    asc(templates.createdAt),
    asc(templates.id)
  );

  return rows.map((row) => mapTemplateDetailRow(row, 'pt'));
}
