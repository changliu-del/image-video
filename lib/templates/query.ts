import 'server-only';

import { asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  type Asset,
  type Template,
  type TemplateTag,
  templateTags,
  templates,
} from '@/lib/db/schema';
import type { Locale } from '@/lib/marketing/content';
import type {
  TemplateCatalogItem,
  TemplateType,
} from '@/lib/templates/catalog';

type TemplateRecord = Template & {
  previewAsset: Asset | null;
  thumbnailAsset: Asset | null;
  tagRelations: Array<{ tag: TemplateTag }>;
};

export type PublishedTemplateSort = 'featured' | 'newest' | 'lowCost';

export type ListPublishedTemplatesInput = {
  locale: Locale;
  page?: number;
  pageSize?: number;
  search?: string;
  type?: TemplateType;
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

const fallbackAssetByType: Record<TemplateType, string> = {
  image: '/resources/example4.png',
  image_to_video: '/resources/example2.mp4',
  video: '/resources/example1.mp4',
};

function typeToTag(type: TemplateType) {
  if (type === 'image_to_video') {
    return 'image-to-video';
  }

  return type;
}

function ratioToTag(ratio: string) {
  return `ratio-${ratio.replace(':', '-')}`;
}

function resolveMediaType(input: {
  asset: Asset | null;
  templateType: TemplateType;
}): TemplateCatalogItem['mediaType'] {
  if (input.asset?.mimeType?.startsWith('video/')) {
    return 'video';
  }

  if (input.asset?.mimeType?.startsWith('image/')) {
    return 'image';
  }

  return input.templateType === 'image' ? 'image' : 'video';
}

export function mapTemplateRecordToCatalogItem(
  row: TemplateRecord
): TemplateCatalogItem {
  const previewAsset = row.previewAsset ?? row.thumbnailAsset;
  const tags = new Set(row.tagRelations.map((relation) => relation.tag.slug));
  tags.add(typeToTag(row.type));

  for (const ratio of row.aspectRatiosJson) {
    tags.add(ratioToTag(ratio));
  }

  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale as Locale,
    title: row.title,
    description: row.description,
    type: row.type,
    hook: row.hook,
    cta: row.cta,
    prompt: row.prompt,
    costCredits: row.costCredits,
    aspectRatios: row.aspectRatiosJson,
    durationSeconds: row.durationSeconds,
    asset: previewAsset?.publicUrl ?? fallbackAssetByType[row.type],
    mediaType: resolveMediaType({
      asset: previewAsset,
      templateType: row.type,
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

function buildWhere(input: Required<Pick<ListPublishedTemplatesInput, 'locale'>> & {
  search: string;
  tags: string[];
  type?: TemplateType;
}) {
  const conditions = [
    eq(templates.locale, input.locale),
    eq(templates.status, 'published' as const),
  ];

  if (input.type) {
    conditions.push(eq(templates.type, input.type));
  }

  if (input.search) {
    const search = `%${input.search}%`;
    conditions.push(
      or(
        ilike(templates.title, search),
        ilike(templates.description, search),
        ilike(templates.hook, search),
        ilike(templates.prompt, search),
        ilike(templates.slug, search)
      )!
    );
  }

  for (const tag of input.tags) {
    conditions.push(sql`exists (
      select 1
      from template_tag_relations ttr
      inner join ${templateTags} tt on tt.id = ttr.tag_id
      where ttr.template_id = ${templates.id}
        and tt.slug = ${tag}
    )`);
  }

  return sql.join(conditions, sql` and `);
}

function getOrderBy(sort: PublishedTemplateSort) {
  if (sort === 'newest') {
    return [desc(templates.publishedAt), desc(templates.updatedAt), asc(templates.title)];
  }

  if (sort === 'lowCost') {
    return [asc(templates.costCredits), desc(templates.sortWeight), asc(templates.title)];
  }

  return [desc(templates.sortWeight), desc(templates.updatedAt), asc(templates.title)];
}

export async function listPublishedTemplates(
  input: Locale | ListPublishedTemplatesInput
): Promise<PublishedTemplatesResult> {
  const params =
    typeof input === 'string'
      ? { locale: input }
      : input;
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const search = params.search?.trim() ?? '';
  const tags = normalizeTags(params.tags);
  const sort = params.sort ?? 'featured';
  const where = buildWhere({
    locale: params.locale,
    type: params.type,
    search,
    tags,
  });

  const [rows, totalRows] = await Promise.all([
    db.query.templates.findMany({
      where,
      with: {
        previewAsset: true,
        thumbnailAsset: true,
        tagRelations: {
          with: {
            tag: true,
          },
        },
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

export async function listAllPublishedTemplates(locale: Locale) {
  const rows = await db.query.templates.findMany({
    where: (table, { and }) =>
      and(eq(table.locale, locale), eq(table.status, 'published')),
    with: {
      previewAsset: true,
      thumbnailAsset: true,
      tagRelations: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: [desc(templates.sortWeight), desc(templates.updatedAt), asc(templates.title)],
  });

  return rows.map((row) =>
    mapTemplateRecordToCatalogItem(row as TemplateRecord)
  );
}
