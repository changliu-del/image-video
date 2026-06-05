create table if not exists email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email varchar(255) not null,
  purpose varchar(32) not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamp not null,
  consumed_at timestamp,
  last_sent_at timestamp not null default now(),
  created_at timestamp not null default now(),
  updated_at timestamp not null default now()
);

create index if not exists email_verification_codes_email_purpose_created_idx
  on email_verification_codes (email, purpose, created_at);

create index if not exists email_verification_codes_expires_at_idx
  on email_verification_codes (expires_at);

alter table email_verification_codes
  drop constraint if exists email_verification_codes_purpose_check,
  add constraint email_verification_codes_purpose_check
    check (purpose in ('signup'));

alter table email_verification_codes
  drop constraint if exists email_verification_codes_attempts_check,
  add constraint email_verification_codes_attempts_check
    check (attempts >= 0);
