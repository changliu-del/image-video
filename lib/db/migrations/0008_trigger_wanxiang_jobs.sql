alter table generation_jobs
  drop constraint if exists generation_jobs_provider_task_id_unique;

drop index if exists generation_jobs_provider_task_id_unique;

alter table generation_jobs
  drop constraint if exists generation_jobs_status_check;

alter table generation_jobs
  drop constraint if exists generation_jobs_attempt_count_check;

alter table generation_jobs
  drop constraint if exists generation_jobs_provider_poll_count_check;

alter table generation_jobs
  alter column provider_task_id drop not null;

alter table generation_jobs
  alter column status set default 'queued';

alter table generation_jobs
  add column if not exists trigger_run_id text,
  add column if not exists provider_status varchar(32),
  add column if not exists attempt_count integer not null default 0,
  add column if not exists provider_poll_count integer not null default 0,
  add column if not exists submitted_at timestamp,
  add column if not exists started_at timestamp,
  add column if not exists last_provider_poll_at timestamp,
  add column if not exists next_provider_poll_at timestamp;

alter table generation_jobs
  add constraint generation_jobs_status_check
  check (status in ('queued', 'submitting', 'running', 'succeeded', 'failed'));

alter table generation_jobs
  add constraint generation_jobs_attempt_count_check
  check (attempt_count >= 0);

alter table generation_jobs
  add constraint generation_jobs_provider_poll_count_check
  check (provider_poll_count >= 0);

create unique index if not exists generation_jobs_provider_task_id_unique
  on generation_jobs (provider, provider_task_id)
  where provider_task_id is not null;

create index if not exists generation_jobs_status_next_poll_idx
  on generation_jobs (status, next_provider_poll_at);
