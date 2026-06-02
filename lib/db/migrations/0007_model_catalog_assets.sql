create table if not exists model_catalog_assets (
  id uuid primary key default gen_random_uuid(),
  provider varchar(40) not null default 'wanxiang',
  external_id varchar(160) not null,
  locale varchar(8) not null default 'pt',
  title varchar(140) not null,
  description text,
  thumbnail_url text,
  image_url text,
  video_url text,
  tags_json jsonb not null default '[]'::jsonb,
  provider_payload_json jsonb not null default '{}'::jsonb,
  status varchar(24) not null default 'active',
  sort_weight integer not null default 0,
  synced_at timestamp,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  constraint model_catalog_assets_provider_external_locale_unique
    unique (provider, external_id, locale),
  constraint model_catalog_assets_status_check
    check (status in ('active', 'inactive', 'failed')),
  constraint model_catalog_assets_media_check
    check (thumbnail_url is not null or image_url is not null or video_url is not null)
);

create index if not exists model_catalog_assets_locale_status_idx
  on model_catalog_assets (locale, status);

create index if not exists model_catalog_assets_provider_status_idx
  on model_catalog_assets (provider, status);

create index if not exists model_catalog_assets_sort_weight_idx
  on model_catalog_assets (sort_weight);
