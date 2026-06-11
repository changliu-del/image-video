import { client } from '@/lib/db/drizzle';
import {
  localizeModelCategoryTags,
  modelCategoryTags,
  resolveModelPrompt,
  resolveModelTitle,
} from '@/lib/model-assets/localization';

export type ModelTemplateItem = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  tags: string[];
  displayTags: string[];
  sortWeight: number;
  thumbnailStorageKey: string | null;
  imageStorageKey: string | null;
};

function toStringValue(value: unknown) {
  return value == null ? '' : String(value);
}

function toNullableString(value: unknown) {
  const text = toStringValue(value).trim();
  return text || null;
}

function mapModelTemplateRow(
  row: Record<string, unknown>,
  locale: string
): ModelTemplateItem {
  const sortOrder = Number(row.sort_order ?? 0);
  const category = toStringValue(row.category);
  const title = resolveModelTitle({
    category,
    locale,
    title: row.title,
    translations: row.title_translations_json,
  });

  return {
    id: toStringValue(row.id),
    title,
    description: toNullableString(
      resolveModelPrompt({
        category,
        locale,
        prompt: row.prompt,
        title: row.title,
        titleTranslations: row.title_translations_json,
        translations: row.prompt_translations_json,
      })
    ),
    thumbnailUrl: toNullableString(row.thumbnail_url),
    imageUrl: toNullableString(row.preview_url),
    videoUrl: null,
    tags: modelCategoryTags(category),
    displayTags: localizeModelCategoryTags(category, locale),
    sortWeight: 100_000 - sortOrder,
    thumbnailStorageKey: toNullableString(row.thumbnail_storage_key),
    imageStorageKey: toNullableString(row.preview_storage_key),
  };
}

export async function listModelTemplates(input: {
  locale: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 24, 1), 96);
  const rows = await client`
    select
      t.id,
      t.title,
      t.title_translations_json,
      t.category,
      t.thumbnail_url,
      t.preview_url,
      t.prompt,
      t.prompt_translations_json,
      t.sort_order,
      thumbnail_asset.storage_key as thumbnail_storage_key,
      preview_asset.storage_key as preview_storage_key
    from templates t
    join assets thumbnail_asset on thumbnail_asset.id = t.thumbnail_asset_id
    join assets preview_asset on preview_asset.id = t.preview_asset_id
    where t.type = 'model'
      and length(trim(t.thumbnail_url)) > 0
      and length(trim(t.preview_url)) > 0
    order by t.sort_order asc, t.created_at asc, t.title asc
    limit ${limit}
  `;

  return rows.map((row) =>
    mapModelTemplateRow(row as Record<string, unknown>, input.locale)
  );
}

export async function getModelTemplate(input: { id: string; locale?: string }) {
  const rows = await client`
    select
      t.id,
      t.title,
      t.title_translations_json,
      t.category,
      t.thumbnail_url,
      t.preview_url,
      t.prompt,
      t.prompt_translations_json,
      t.sort_order,
      thumbnail_asset.storage_key as thumbnail_storage_key,
      preview_asset.storage_key as preview_storage_key
    from templates t
    join assets thumbnail_asset on thumbnail_asset.id = t.thumbnail_asset_id
    join assets preview_asset on preview_asset.id = t.preview_asset_id
    where t.id = ${input.id}
      and t.type = 'model'
    limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;

  return row ? mapModelTemplateRow(row, input.locale ?? 'pt') : null;
}
