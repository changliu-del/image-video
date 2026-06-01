import 'server-only';

import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  type Asset,
  type Template,
  type TemplateTag,
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

export async function listPublishedTemplates(locale: Locale) {
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
