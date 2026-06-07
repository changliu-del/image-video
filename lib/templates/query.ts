import 'server-only';

import { asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  type Asset,
  type Template,
  templates,
} from '@/lib/db/schema';
import type {
  TemplateCatalogItem,
  TemplateCategory,
} from '@/lib/templates/catalog';

type TemplateRecord = Template & {
  previewAsset: Asset | null;
};

export type PublishedTemplateSort = 'featured' | 'newest' | 'lowCost';

export type ListPublishedTemplatesInput = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: TemplateCategory;
  tags?: string[];
  sort?: PublishedTemplateSort;
};

export type PublishedTemplatesResult = {
  list: TemplateCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

const fallbackAssetByCategory: Record<TemplateCategory, string> = {
  image_to_image: '/resources/example4.png',
  image_to_video: '/resources/example2.mp4',
  try_on: '/resources/example3.png',
};

function categoryToTag(category: TemplateCategory) {
  if (category === 'image_to_video') {
    return 'image-to-video';
  }

  if (category === 'image_to_image') {
    return 'image';
  }

  return 'try-on';
}

function ratioToTag(ratio: string) {
  return `ratio-${ratio.replace(':', '-')}`;
}

function resolveMediaType(input: {
  asset: Asset | null;
  category: TemplateCategory;
}): TemplateCatalogItem['mediaType'] {
  if (input.asset?.mimeType?.startsWith('video/')) {
    return 'video';
  }

  if (input.asset?.mimeType?.startsWith('image/')) {
    return 'image';
  }

  return input.category === 'image_to_video' ? 'video' : 'image';
}

export function mapTemplateRecordToCatalogItem(
  row: TemplateRecord
): TemplateCatalogItem {
  const previewAsset = row.previewAsset;
  const tags = new Set(row.tagsJson);
  tags.add(categoryToTag(row.category));

  for (const ratio of row.aspectRatiosJson) {
    tags.add(ratioToTag(ratio));
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    prompt: row.prompt,
    costCredits: row.costCredits,
    aspectRatios: row.aspectRatiosJson,
    durationSeconds: row.durationSeconds,
    asset: previewAsset?.publicUrl ?? fallbackAssetByCategory[row.category],
    mediaType: resolveMediaType({
      asset: previewAsset,
      category: row.category,
    }),
    tags: Array.from(tags),
    source: 'admin',
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

function normalizeTags(tags: string[] | undefined) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => /^[a-z0-9][a-z0-9_-]*$/.test(tag))
    )
  ).slice(0, 12);
}

function buildWhere(input: {
  search: string;
  tags: string[];
  category?: TemplateCategory;
}) {
  const conditions = [];

  if (input.category) {
    conditions.push(eq(templates.category, input.category));
  }

  if (input.search) {
    const search = `%${input.search}%`;
    conditions.push(
      or(
        ilike(templates.name, search),
        ilike(templates.description, search),
        ilike(templates.prompt, search),
        sql`${templates.id}::text ilike ${search}`
      )!
    );
  }

  for (const tag of input.tags) {
    conditions.push(sql`${templates.tagsJson} ? ${tag}`);
  }

  return conditions.length ? sql.join(conditions, sql` and `) : undefined;
}

function getOrderBy(sort: PublishedTemplateSort) {
  if (sort === 'newest') {
    return [desc(templates.updatedAt), asc(templates.name)];
  }

  if (sort === 'lowCost') {
    return [asc(templates.costCredits), desc(templates.sortWeight), asc(templates.name)];
  }

  return [desc(templates.sortWeight), desc(templates.updatedAt), asc(templates.name)];
}

export async function listPublishedTemplates(
  params: ListPublishedTemplatesInput
): Promise<PublishedTemplatesResult> {
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const search = params.search?.trim() ?? '';
  const tags = normalizeTags(params.tags);
  const sort = params.sort ?? 'featured';
  const where = buildWhere({
    category: params.category,
    search,
    tags,
  });

  const [rows, totalRows] = await Promise.all([
    db.query.templates.findMany({
      where,
      with: {
        previewAsset: true,
      },
      orderBy: getOrderBy(sort),
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(templates)
      .where(where),
  ]);

  const total = Number(totalRows[0]?.count ?? 0);

  return {
    list: rows.map((row) =>
      mapTemplateRecordToCatalogItem(row as TemplateRecord)
    ),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function listAllTemplates() {
  const rows = await db.query.templates.findMany({
    with: {
      previewAsset: true,
    },
    orderBy: [desc(templates.sortWeight), desc(templates.updatedAt), asc(templates.name)],
  });

  return rows.map((row) =>
    mapTemplateRecordToCatalogItem(row as TemplateRecord)
  );
}
