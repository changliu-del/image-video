alter table library_assets
  add column if not exists category varchar(32);

drop index if exists library_assets_asset_id_unique;

update library_assets
set category = case
  when kind in ('model_image', 'garment_image') then 'try_on'
  when kind = 'example_video' then 'image_to_video'
  when use_cases_json ? 'image_to_video' then 'image_to_video'
  when use_cases_json ? 'apparel_image' then 'apparel_image'
  when use_cases_json ? 'try_on' then 'try_on'
  else 'image_to_video'
end
where category is null;

insert into library_assets (
  asset_id,
  title,
  description,
  category,
  sort_weight,
  usage_count,
  created_by,
  updated_by,
  created_at,
  updated_at
)
select
  la.asset_id,
  la.title,
  la.description,
  categories.category,
  la.sort_weight,
  la.usage_count,
  la.created_by,
  la.updated_by,
  la.created_at,
  la.updated_at
from library_assets la
cross join lateral (
  values
    ('image_to_video'::varchar(32)),
    ('apparel_image'::varchar(32)),
    ('try_on'::varchar(32))
) as categories(category)
where la.use_cases_json ? categories.category
  and categories.category <> la.category
  and not exists (
    select 1
    from library_assets existing
    where existing.asset_id = la.asset_id
      and existing.category = categories.category
  );

alter table library_assets
  alter column category set not null;

drop index if exists library_assets_locale_status_idx;
drop index if exists library_assets_kind_status_idx;
drop index if exists library_assets_sort_quality_idx;

alter table library_assets
  drop constraint if exists library_assets_kind_check,
  drop constraint if exists library_assets_status_check,
  drop constraint if exists library_assets_quality_score_check,
  drop constraint if exists library_assets_tags_json_check,
  drop constraint if exists library_assets_use_cases_json_check,
  drop constraint if exists library_assets_category_check,
  add constraint library_assets_category_check
    check (category in ('image_to_video', 'apparel_image', 'try_on'));

alter table library_assets
  drop column if exists locale,
  drop column if exists kind,
  drop column if exists status,
  drop column if exists source,
  drop column if exists license_note,
  drop column if exists tags_json,
  drop column if exists use_cases_json,
  drop column if exists quality_score,
  drop column if exists published_by,
  drop column if exists published_at;

create index if not exists library_assets_category_idx
  on library_assets (category);

create index if not exists library_assets_sort_weight_idx
  on library_assets (sort_weight);

create unique index if not exists library_assets_asset_category_unique
  on library_assets (asset_id, category);
