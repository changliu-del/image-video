create table if not exists library_assets (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references assets(id),
  locale varchar(8) not null default 'pt',
  title varchar(140) not null,
  description text,
  kind varchar(32) not null,
  status varchar(24) not null default 'draft',
  source varchar(80),
  license_note text,
  tags_json jsonb not null default '[]'::jsonb,
  use_cases_json jsonb not null default '[]'::jsonb,
  quality_score integer not null default 0,
  sort_weight integer not null default 0,
  usage_count integer not null default 0,
  created_by integer references users(id),
  updated_by integer references users(id),
  published_by integer references users(id),
  published_at timestamp,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create unique index if not exists library_assets_asset_id_unique
  on library_assets (asset_id);

create index if not exists library_assets_locale_status_idx
  on library_assets (locale, status);

create index if not exists library_assets_kind_status_idx
  on library_assets (kind, status);

create index if not exists library_assets_sort_quality_idx
  on library_assets (sort_weight, quality_score);

alter table library_assets
  drop constraint if exists library_assets_kind_check,
  add constraint library_assets_kind_check
    check (kind in ('product_image', 'model_image', 'garment_image', 'scene_image', 'example_image', 'example_video'));

alter table library_assets
  drop constraint if exists library_assets_status_check,
  add constraint library_assets_status_check
    check (status in ('draft', 'published', 'archived'));

alter table library_assets
  drop constraint if exists library_assets_quality_score_check,
  add constraint library_assets_quality_score_check
    check (quality_score between 0 and 100);

alter table library_assets
  drop constraint if exists library_assets_usage_count_check,
  add constraint library_assets_usage_count_check
    check (usage_count >= 0);

alter table library_assets
  drop constraint if exists library_assets_tags_json_check,
  add constraint library_assets_tags_json_check
    check (jsonb_typeof(tags_json) = 'array');

alter table library_assets
  drop constraint if exists library_assets_use_cases_json_check,
  add constraint library_assets_use_cases_json_check
    check (
      jsonb_typeof(use_cases_json) = 'array'
      and use_cases_json <@ '["image_to_video", "apparel_image", "try_on"]'::jsonb
    );
