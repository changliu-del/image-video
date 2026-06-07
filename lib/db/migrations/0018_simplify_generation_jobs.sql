alter table generation_jobs
  drop constraint if exists generation_jobs_try_on_mode_check,
  drop constraint if exists generation_jobs_try_on_mode_type_check,
  drop constraint if exists generation_jobs_attempt_count_check,
  drop constraint if exists generation_jobs_provider_poll_count_check,
  drop constraint if exists generation_jobs_final_image_asset_id_assets_id_fk,
  drop constraint if exists generation_jobs_final_video_asset_id_assets_id_fk;

drop index if exists generation_jobs_status_next_poll_idx;

alter table generation_jobs
  add column if not exists output_asset_id uuid;

update generation_jobs
set output_asset_id = coalesce(final_video_asset_id, final_image_asset_id)
where output_asset_id is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'generation_jobs_output_asset_id_assets_id_fk'
  ) then
    alter table generation_jobs
      add constraint generation_jobs_output_asset_id_assets_id_fk
      foreign key (output_asset_id) references assets(id);
  end if;
end $$;

create index if not exists generation_jobs_output_asset_id_idx
  on generation_jobs (output_asset_id);

alter table generation_jobs
  drop column if exists try_on_mode,
  drop column if exists final_image_asset_id,
  drop column if exists final_video_asset_id,
  drop column if exists provider_status,
  drop column if exists provider_poll_count,
  drop column if exists attempt_count,
  drop column if exists submitted_at,
  drop column if exists started_at,
  drop column if exists last_provider_poll_at,
  drop column if exists next_provider_poll_at,
  drop column if exists completed_at;
