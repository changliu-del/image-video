create table if not exists user_media_history (
  id uuid primary key default gen_random_uuid(),
  user_id integer not null references users(id),
  asset_id uuid not null references assets(id),
  library_asset_id uuid references library_assets(id) on delete set null,
  generation_job_id uuid references generation_jobs(id) on delete set null,
  source varchar(32) not null,
  generation_type varchar(32),
  role varchar(32),
  title varchar(140),
  description text,
  visibility varchar(16) not null default 'active',
  is_favorite boolean not null default false,
  used_count integer not null default 0,
  last_used_at timestamp,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create unique index if not exists user_media_history_user_asset_source_role_unique
  on user_media_history (user_id, asset_id, source, role)
  where role is not null;

create unique index if not exists user_media_history_user_asset_source_unique
  on user_media_history (user_id, asset_id, source)
  where role is null;

create index if not exists user_media_history_user_visibility_updated_idx
  on user_media_history (user_id, visibility, updated_at desc);

create index if not exists user_media_history_user_source_updated_idx
  on user_media_history (user_id, source, updated_at desc);

create index if not exists user_media_history_user_generation_type_updated_idx
  on user_media_history (user_id, generation_type, updated_at desc);

create index if not exists user_media_history_asset_id_idx
  on user_media_history (asset_id);

create index if not exists user_media_history_library_asset_id_idx
  on user_media_history (library_asset_id);

create index if not exists user_media_history_generation_job_id_idx
  on user_media_history (generation_job_id);

alter table user_media_history
  drop constraint if exists user_media_history_source_check,
  add constraint user_media_history_source_check
    check (source in ('user_upload', 'generated_image', 'generated_video', 'ops_library_used'));

alter table user_media_history
  drop constraint if exists user_media_history_generation_type_check,
  add constraint user_media_history_generation_type_check
    check (generation_type is null or generation_type in ('image_to_video', 'apparel_image', 'try_on'));

alter table user_media_history
  drop constraint if exists user_media_history_role_check,
  add constraint user_media_history_role_check
    check (role is null or role in ('input', 'output', 'reference', 'garment', 'model'));

alter table user_media_history
  drop constraint if exists user_media_history_visibility_check,
  add constraint user_media_history_visibility_check
    check (visibility in ('active', 'hidden', 'deleted'));

alter table user_media_history
  drop constraint if exists user_media_history_used_count_check,
  add constraint user_media_history_used_count_check
    check (used_count >= 0);
