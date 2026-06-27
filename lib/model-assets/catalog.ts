import { client } from '@/lib/db/drizzle';
import {
  localizeModelCategoryTags,
  modelCategoryMatchesFilters,
  modelCategoryTags,
  parseModelCategoryParts,
  type ModelCategoryParts,
} from '@/lib/model-assets/localization';

export type ModelTemplateItem = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  categoryParts: ModelCategoryParts;
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

function localizedTemplateText(
  row: Record<string, unknown>,
  key: 'prompt' | 'title',
  locale: string
) {
  const english = toStringValue(row[key]).trim();
  const portuguese = toStringValue(
    row[key === 'title' ? 'pt_title' : 'pt_prompt']
  ).trim();

  return locale === 'pt' ? portuguese || english : english;
}

function mapModelTemplateRow(
  row: Record<string, unknown>,
  locale: string
): ModelTemplateItem {
  const sortOrder = Number(row.sort_order ?? 0);
  const category = toStringValue(row.category);
  const title = localizedTemplateText(row, 'title', locale);

  return {
    id: toStringValue(row.id),
    title,
    description: toNullableString(localizedTemplateText(row, 'prompt', locale)),
    thumbnailUrl: toNullableString(row.thumbnail_url),
    imageUrl: toNullableString(row.preview_url),
    videoUrl: null,
    categoryParts: parseModelCategoryParts(category),
    tags: modelCategoryTags(category),
    displayTags: localizeModelCategoryTags(category, locale),
    sortWeight: 100_000 - sortOrder,
    thumbnailStorageKey: toNullableString(row.thumbnail_storage_key),
    imageStorageKey: toNullableString(row.preview_storage_key),
  };
}

export async function listModelTemplates(input: {
  age?: string;
  gender?: string;
  locale: string;
  limit?: number;
  style?: string;
}) {
  const limit = Math.min(Math.max(input.limit ?? 24, 1), 96);
  const queryLimit = input.age || input.gender || input.style ? 500 : limit;
  const rows = await client`
    select
      t.id,
      t.title,
      t.pt_title,
      t.category,
      t.thumbnail_url,
      t.preview_url,
      t.prompt,
      t.pt_prompt,
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
    limit ${queryLimit}
  `;

  return rows
    .filter((row) =>
      modelCategoryMatchesFilters(
        (row as Record<string, unknown>).category,
        {
          age: input.age,
          gender: input.gender,
          style: input.style,
        }
      )
    )
    .slice(0, limit)
    .map((row) =>
      mapModelTemplateRow(row as Record<string, unknown>, input.locale)
    );
}

export async function getModelTemplate(input: { id: string; locale?: string }) {
  const rows = await client`
    select
      t.id,
      t.title,
      t.pt_title,
      t.category,
      t.thumbnail_url,
      t.preview_url,
      t.prompt,
      t.pt_prompt,
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
