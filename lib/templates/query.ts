import 'server-only';

import { asc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db/drizzle';
import { assets, templates } from '@/lib/db/schema';
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

const thumbnailAsset = alias(assets, 'template_thumbnail_asset');
const previewAsset = alias(assets, 'template_preview_asset');

type TemplateListRow = {
  id: string;
  title: string;
  titleTranslations: Record<string, string>;
  type: TemplateType;
  category: string;
  thumbnailAssetId: string;
  createdAt: Date;
  updatedAt: Date;
};

type TemplateDetailRow = TemplateListRow & {
  previewAssetId: string;
  prompt: string;
  promptTranslations: Record<string, string>;
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

const supportedLocales = new Set<Locale>(['pt', 'en', 'zh']);

function normalizeTemplateLocale(value: string | null | undefined): Locale {
  return value && supportedLocales.has(value as Locale)
    ? (value as Locale)
    : 'pt';
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
    id: row.id,
    title: resolveLocalizedText(row.title, row.titleTranslations, locale),
    type: row.type,
    category: row.category,
    thumbnailUrl: `/api/template-media/${row.thumbnailAssetId}`,
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
    previewUrl: `/api/template-media/${row.previewAssetId}`,
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

function buildWhere(input: {
  search: string;
  type: TemplateType;
  category?: string;
}) {
  const conditions = [
    eq(templates.type, input.type),
    eq(thumbnailAsset.status, 'uploaded' as const),
  ];

  if (input.category) {
    conditions.push(eq(templates.category, input.category));
  }

  if (input.search) {
    const search = `%${input.search}%`;
    conditions.push(
      or(
        ilike(templates.category, search),
        ilike(templates.title, search),
        ilike(templates.prompt, search),
        sql`${templates.titleTranslations}::text ilike ${search}`,
        sql`${templates.promptTranslations}::text ilike ${search}`,
        sql`${templates.id}::text ilike ${search}`
      )!
    );
  }

  return sql.join(conditions, sql` and `);
}

function baseTemplateListQuery() {
  return db
    .select({
      id: templates.id,
      title: templates.title,
      titleTranslations: templates.titleTranslations,
      type: templates.type,
      category: templates.category,
      thumbnailAssetId: thumbnailAsset.id,
      createdAt: templates.createdAt,
      updatedAt: templates.updatedAt,
    })
    .from(templates)
    .innerJoin(thumbnailAsset, eq(templates.thumbnailAssetId, thumbnailAsset.id));
}

function baseTemplateDetailQuery() {
  return db
    .select({
      id: templates.id,
      title: templates.title,
      titleTranslations: templates.titleTranslations,
      type: templates.type,
      category: templates.category,
      thumbnailAssetId: thumbnailAsset.id,
      previewAssetId: previewAsset.id,
      prompt: templates.prompt,
      promptTranslations: templates.promptTranslations,
      createdAt: templates.createdAt,
      updatedAt: templates.updatedAt,
    })
    .from(templates)
    .innerJoin(thumbnailAsset, eq(templates.thumbnailAssetId, thumbnailAsset.id))
    .innerJoin(previewAsset, eq(templates.previewAssetId, previewAsset.id));
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

async function listTemplateCategoriesForType(type: TemplateType) {
  const rows = await db
    .select({ category: templates.category })
    .from(templates)
    .innerJoin(thumbnailAsset, eq(templates.thumbnailAssetId, thumbnailAsset.id))
    .where(
      sql`${templates.type} = ${type}
        and ${thumbnailAsset.status} = 'uploaded'`
    )
    .groupBy(templates.category)
    .orderBy(asc(templates.category));

  return sortTemplateCategories(
    type,
    rows.map((row) => row.category)
  );
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

  if (requestedCategory && !category) {
    const categories = await listTemplateCategoriesForType(type);
    return {
      list: [],
      categories,
      total: 0,
      page,
      pageSize,
      hasMore: false,
    };
  }

  const where = buildWhere({
    type,
    category,
    search,
  });

  const [rows, totalRows, categories] = await Promise.all([
    baseTemplateListQuery()
      .where(where)
      .orderBy(asc(templates.createdAt), asc(templates.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .innerJoin(thumbnailAsset, eq(templates.thumbnailAssetId, thumbnailAsset.id))
      .where(where),
    listTemplateCategoriesForType(type),
  ]);

  const total = Number(totalRows[0]?.count ?? 0);

  return {
    list: rows.map((row) => mapTemplateListRow(row, locale)),
    categories,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function getTemplateDetail(id: string, localeInput?: string | null) {
  const locale = normalizeTemplateLocale(localeInput);
  const [row] = await baseTemplateDetailQuery()
    .where(
      sql`${templates.id}::text = ${id}
        and ${thumbnailAsset.status} = 'uploaded'
        and ${previewAsset.status} = 'uploaded'`
    )
    .limit(1);

  return row ? mapTemplateDetailRow(row, locale) : null;
}

export async function listAllTemplates() {
  const rows = await baseTemplateDetailQuery().orderBy(
    asc(templates.createdAt),
    asc(templates.id)
  );

  return rows.map((row) => mapTemplateDetailRow(row, 'pt'));
}
