import { client } from '@/lib/db/drizzle';
import { fetchWanxiangModelCatalog } from '@/lib/providers/wanxiang/models';

export type ModelCatalogAssetItem = {
  id: string;
  provider: string;
  externalId: string;
  locale: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  tags: string[];
  sortWeight: number;
};

function toStringValue(value: unknown) {
  return value == null ? '' : String(value);
}

function toNullableString(value: unknown) {
  return value == null ? null : String(value);
}

function toTags(value: unknown) {
  return Array.isArray(value)
    ? value.map((tag) => String(tag)).filter(Boolean)
    : [];
}

function mapModelAssetRow(row: Record<string, unknown>): ModelCatalogAssetItem {
  return {
    id: toStringValue(row.id),
    provider: toStringValue(row.provider),
    externalId: toStringValue(row.external_id),
    locale: toStringValue(row.locale),
    title: toStringValue(row.title),
    description: toNullableString(row.description),
    thumbnailUrl: toNullableString(row.thumbnail_url),
    imageUrl: toNullableString(row.image_url),
    videoUrl: toNullableString(row.video_url),
    tags: toTags(row.tags_json),
    sortWeight: Number(row.sort_weight ?? 0),
  };
}

export async function listModelCatalogAssets(input: {
  locale: string;
  provider?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(input.limit ?? 24, 1), 48);
  const provider = input.provider ?? 'wanxiang';
  const rows = await client`
    select
      id,
      provider,
      external_id,
      locale,
      title,
      description,
      thumbnail_url,
      image_url,
      video_url,
      tags_json,
      sort_weight
    from model_catalog_assets
    where locale = ${input.locale}
      and provider = ${provider}
      and status = 'active'
    order by sort_weight desc, updated_at desc, title asc
    limit ${limit}
  `;

  return rows.map((row) => mapModelAssetRow(row as Record<string, unknown>));
}

export async function getModelCatalogAsset(input: {
  id: string;
  provider?: string;
}) {
  const provider = input.provider ?? 'wanxiang';
  const rows = await client`
    select
      id,
      provider,
      external_id,
      locale,
      title,
      description,
      thumbnail_url,
      image_url,
      video_url,
      tags_json,
      sort_weight
    from model_catalog_assets
    where id = ${input.id}
      and provider = ${provider}
      and status = 'active'
    limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;

  return row ? mapModelAssetRow(row) : null;
}

export async function syncWanxiangModelCatalog(input: { locale: string }) {
  const providerItems = await fetchWanxiangModelCatalog({ locale: input.locale });

  for (const item of providerItems) {
    const description = item.description ?? null;
    const thumbnailUrl = item.thumbnailUrl ?? null;
    const imageUrl = item.imageUrl ?? null;
    const videoUrl = item.videoUrl ?? null;

    await client`
      insert into model_catalog_assets (
        provider,
        external_id,
        locale,
        title,
        description,
        thumbnail_url,
        image_url,
        video_url,
        tags_json,
        provider_payload_json,
        status,
        sort_weight,
        synced_at,
        created_at,
        updated_at
      )
      values (
        'wanxiang',
        ${item.externalId},
        ${input.locale},
        ${item.title},
        ${description},
        ${thumbnailUrl},
        ${imageUrl},
        ${videoUrl},
        ${JSON.stringify(item.tags)}::jsonb,
        ${JSON.stringify(item.raw)}::jsonb,
        'active',
        ${item.sortWeight},
        now(),
        now(),
        now()
      )
      on conflict (provider, external_id, locale)
      do update set
        title = excluded.title,
        description = excluded.description,
        thumbnail_url = excluded.thumbnail_url,
        image_url = excluded.image_url,
        video_url = excluded.video_url,
        tags_json = excluded.tags_json,
        provider_payload_json = excluded.provider_payload_json,
        status = 'active',
        sort_weight = excluded.sort_weight,
        synced_at = now(),
        updated_at = now()
    `;
  }

  return {
    synced: providerItems.length,
  };
}
