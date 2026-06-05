drop index if exists library_assets_asset_id_unique;

create unique index if not exists library_assets_asset_category_unique
  on library_assets (asset_id, category);
