DROP TABLE IF EXISTS "__id_migration_assets";
DROP TABLE IF EXISTS "__id_migration_templates";
DROP TABLE IF EXISTS "__id_migration_generation_jobs";
DROP TABLE IF EXISTS "__id_migration_user_media_history";
DROP TABLE IF EXISTS "__id_migration_credit_ledger";
DROP TABLE IF EXISTS "__id_migration_email_verification_codes";

CREATE TABLE "__id_migration_assets" (
  "old_id" uuid PRIMARY KEY,
  "new_id" integer NOT NULL UNIQUE
);
CREATE TABLE "__id_migration_templates" (
  "old_id" uuid PRIMARY KEY,
  "new_id" integer NOT NULL UNIQUE
);
CREATE TABLE "__id_migration_generation_jobs" (
  "old_id" uuid PRIMARY KEY,
  "new_id" integer NOT NULL UNIQUE
);
CREATE TABLE "__id_migration_user_media_history" (
  "old_id" uuid PRIMARY KEY,
  "new_id" integer NOT NULL UNIQUE
);
CREATE TABLE "__id_migration_credit_ledger" (
  "old_id" uuid PRIMARY KEY,
  "new_id" integer NOT NULL UNIQUE
);
CREATE TABLE "__id_migration_email_verification_codes" (
  "old_id" uuid PRIMARY KEY,
  "new_id" integer NOT NULL UNIQUE
);

INSERT INTO "__id_migration_assets" ("old_id", "new_id")
SELECT "id", (row_number() OVER (ORDER BY "created_at", "id") - 1)::integer
FROM "assets";

INSERT INTO "__id_migration_templates" ("old_id", "new_id")
SELECT "id", (row_number() OVER (ORDER BY "created_at", "id") - 1)::integer
FROM "templates";

INSERT INTO "__id_migration_generation_jobs" ("old_id", "new_id")
SELECT "id", (row_number() OVER (ORDER BY "created_at", "id") - 1)::integer
FROM "generation_jobs";

INSERT INTO "__id_migration_user_media_history" ("old_id", "new_id")
SELECT "id", (row_number() OVER (ORDER BY "created_at", "id") - 1)::integer
FROM "user_media_history";

INSERT INTO "__id_migration_credit_ledger" ("old_id", "new_id")
SELECT "id", (row_number() OVER (ORDER BY "created_at", "id") - 1)::integer
FROM "credit_ledger";

INSERT INTO "__id_migration_email_verification_codes" ("old_id", "new_id")
SELECT "id", (row_number() OVER (ORDER BY "created_at", "id") - 1)::integer
FROM "email_verification_codes";

ALTER TABLE "assets" ADD COLUMN "id_new" integer;
UPDATE "assets"
SET "id_new" = "__id_migration_assets"."new_id"
FROM "__id_migration_assets"
WHERE "assets"."id" = "__id_migration_assets"."old_id";
ALTER TABLE "assets" ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "templates"
  ADD COLUMN "id_new" integer,
  ADD COLUMN "thumbnail_asset_id_new" integer,
  ADD COLUMN "preview_asset_id_new" integer;
UPDATE "templates"
SET
  "id_new" = "__id_migration_templates"."new_id",
  "thumbnail_asset_id_new" = "thumbnail_asset_map"."new_id",
  "preview_asset_id_new" = "preview_asset_map"."new_id"
FROM "__id_migration_templates",
  "__id_migration_assets" "thumbnail_asset_map",
  "__id_migration_assets" "preview_asset_map"
WHERE "templates"."id" = "__id_migration_templates"."old_id"
  AND "thumbnail_asset_map"."old_id" = "templates"."thumbnail_asset_id"
  AND "preview_asset_map"."old_id" = "templates"."preview_asset_id";
ALTER TABLE "templates"
  ALTER COLUMN "id_new" SET NOT NULL,
  ALTER COLUMN "thumbnail_asset_id_new" SET NOT NULL,
  ALTER COLUMN "preview_asset_id_new" SET NOT NULL;

ALTER TABLE "generation_jobs"
  ADD COLUMN "id_new" integer,
  ADD COLUMN "input_asset_id_new" integer,
  ADD COLUMN "output_asset_id_new" integer;
UPDATE "generation_jobs"
SET
  "id_new" = "__id_migration_generation_jobs"."new_id",
  "input_asset_id_new" = "input_asset_map"."new_id",
  "output_asset_id_new" = (
    SELECT "new_id"
    FROM "__id_migration_assets"
    WHERE "__id_migration_assets"."old_id" = "generation_jobs"."output_asset_id"
  )
FROM "__id_migration_generation_jobs",
  "__id_migration_assets" "input_asset_map"
WHERE "generation_jobs"."id" = "__id_migration_generation_jobs"."old_id"
  AND "input_asset_map"."old_id" = "generation_jobs"."input_asset_id";
ALTER TABLE "generation_jobs"
  ALTER COLUMN "id_new" SET NOT NULL,
  ALTER COLUMN "input_asset_id_new" SET NOT NULL;

ALTER TABLE "user_media_history"
  ADD COLUMN "id_new" integer,
  ADD COLUMN "asset_id_new" integer,
  ADD COLUMN "generation_job_id_new" integer;
UPDATE "user_media_history"
SET
  "id_new" = "__id_migration_user_media_history"."new_id",
  "asset_id_new" = "asset_map"."new_id",
  "generation_job_id_new" = (
    SELECT "new_id"
    FROM "__id_migration_generation_jobs"
    WHERE "__id_migration_generation_jobs"."old_id" = "user_media_history"."generation_job_id"
  )
FROM "__id_migration_user_media_history",
  "__id_migration_assets" "asset_map"
WHERE "user_media_history"."id" = "__id_migration_user_media_history"."old_id"
  AND "asset_map"."old_id" = "user_media_history"."asset_id";
ALTER TABLE "user_media_history"
  ALTER COLUMN "id_new" SET NOT NULL,
  ALTER COLUMN "asset_id_new" SET NOT NULL;

ALTER TABLE "credit_ledger"
  ADD COLUMN "id_new" integer,
  ADD COLUMN "job_id_new" integer;
UPDATE "credit_ledger"
SET
  "id_new" = "__id_migration_credit_ledger"."new_id",
  "job_id_new" = (
    SELECT "new_id"
    FROM "__id_migration_generation_jobs"
    WHERE "__id_migration_generation_jobs"."old_id" = "credit_ledger"."job_id"
  )
FROM "__id_migration_credit_ledger"
WHERE "credit_ledger"."id" = "__id_migration_credit_ledger"."old_id";
ALTER TABLE "credit_ledger" ALTER COLUMN "id_new" SET NOT NULL;

ALTER TABLE "email_verification_codes" ADD COLUMN "id_new" integer;
UPDATE "email_verification_codes"
SET "id_new" = "__id_migration_email_verification_codes"."new_id"
FROM "__id_migration_email_verification_codes"
WHERE "email_verification_codes"."id" = "__id_migration_email_verification_codes"."old_id";
ALTER TABLE "email_verification_codes" ALTER COLUMN "id_new" SET NOT NULL;

UPDATE "generation_jobs"
SET "input_json" = jsonb_set(
  "generation_jobs"."input_json",
  '{inputAssetId}',
  to_jsonb("__id_migration_assets"."new_id"::text),
  false
)
FROM "__id_migration_assets"
WHERE "generation_jobs"."input_json" ? 'inputAssetId'
  AND "generation_jobs"."input_json" ->> 'inputAssetId' = "__id_migration_assets"."old_id"::text;

UPDATE "generation_jobs"
SET "input_json" = jsonb_set(
  "generation_jobs"."input_json",
  '{templateId}',
  to_jsonb("__id_migration_templates"."new_id"::text),
  false
)
FROM "__id_migration_templates"
WHERE "generation_jobs"."input_json" ? 'templateId'
  AND "generation_jobs"."input_json" ->> 'templateId' = "__id_migration_templates"."old_id"::text;

UPDATE "generation_jobs"
SET "input_json" = jsonb_set(
  "generation_jobs"."input_json",
  '{inputAssetIds}',
  COALESCE(
    (
      SELECT jsonb_agg(
        to_jsonb(COALESCE("__id_migration_assets"."new_id"::text, "asset_ids"."old_id"))
        ORDER BY "asset_ids"."ord"
      )
      FROM jsonb_array_elements_text("generation_jobs"."input_json" -> 'inputAssetIds')
        WITH ORDINALITY AS "asset_ids"("old_id", "ord")
      LEFT JOIN "__id_migration_assets"
        ON "__id_migration_assets"."old_id"::text = "asset_ids"."old_id"
    ),
    '[]'::jsonb
  ),
  false
)
WHERE jsonb_typeof("generation_jobs"."input_json" -> 'inputAssetIds') = 'array';

UPDATE "credit_ledger"
SET "metadata_json" = jsonb_set(
  "credit_ledger"."metadata_json",
  '{inputAssetId}',
  to_jsonb("__id_migration_assets"."new_id"::text),
  false
)
FROM "__id_migration_assets"
WHERE "credit_ledger"."metadata_json" ? 'inputAssetId'
  AND "credit_ledger"."metadata_json" ->> 'inputAssetId' = "__id_migration_assets"."old_id"::text;

UPDATE "credit_ledger"
SET "metadata_json" = jsonb_set(
  "credit_ledger"."metadata_json",
  '{templateId}',
  to_jsonb("__id_migration_templates"."new_id"::text),
  false
)
FROM "__id_migration_templates"
WHERE "credit_ledger"."metadata_json" ? 'templateId'
  AND "credit_ledger"."metadata_json" ->> 'templateId' = "__id_migration_templates"."old_id"::text;

ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_thumbnail_asset_id_assets_id_fk";
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_preview_asset_id_assets_id_fk";
ALTER TABLE "generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_input_asset_id_assets_id_fk";
ALTER TABLE "generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_output_asset_id_assets_id_fk";
ALTER TABLE "credit_ledger" DROP CONSTRAINT IF EXISTS "credit_ledger_job_id_generation_jobs_id_fk";
ALTER TABLE "user_media_history" DROP CONSTRAINT IF EXISTS "user_media_history_asset_id_fkey";
ALTER TABLE "user_media_history" DROP CONSTRAINT IF EXISTS "user_media_history_generation_job_id_fkey";

DROP INDEX IF EXISTS "templates_type_category_sort_order_idx";
DROP INDEX IF EXISTS "templates_thumbnail_asset_id_idx";
DROP INDEX IF EXISTS "templates_preview_asset_id_idx";
DROP INDEX IF EXISTS "generation_jobs_input_asset_id_idx";
DROP INDEX IF EXISTS "generation_jobs_output_asset_id_idx";
DROP INDEX IF EXISTS "credit_ledger_job_id_idx";
DROP INDEX IF EXISTS "credit_ledger_job_reason_unique";
DROP INDEX IF EXISTS "user_media_history_asset_id_idx";
DROP INDEX IF EXISTS "user_media_history_generation_job_id_idx";
DROP INDEX IF EXISTS "user_media_history_user_asset_source_role_unique";
DROP INDEX IF EXISTS "user_media_history_user_asset_source_unique";

ALTER TABLE "email_verification_codes" DROP CONSTRAINT IF EXISTS "email_verification_codes_pkey";
ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "assets_pkey";
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_pkey";
ALTER TABLE "generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_pkey";
ALTER TABLE "user_media_history" DROP CONSTRAINT IF EXISTS "user_media_history_pkey";
ALTER TABLE "credit_ledger" DROP CONSTRAINT IF EXISTS "credit_ledger_pkey";

ALTER TABLE "email_verification_codes" DROP COLUMN "id";
ALTER TABLE "email_verification_codes" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "assets" DROP COLUMN "id";
ALTER TABLE "assets" RENAME COLUMN "id_new" TO "id";

ALTER TABLE "templates"
  DROP COLUMN "id",
  DROP COLUMN "thumbnail_asset_id",
  DROP COLUMN "preview_asset_id";
ALTER TABLE "templates" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "templates" RENAME COLUMN "thumbnail_asset_id_new" TO "thumbnail_asset_id";
ALTER TABLE "templates" RENAME COLUMN "preview_asset_id_new" TO "preview_asset_id";

ALTER TABLE "generation_jobs"
  DROP COLUMN "id",
  DROP COLUMN "input_asset_id",
  DROP COLUMN "output_asset_id";
ALTER TABLE "generation_jobs" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "generation_jobs" RENAME COLUMN "input_asset_id_new" TO "input_asset_id";
ALTER TABLE "generation_jobs" RENAME COLUMN "output_asset_id_new" TO "output_asset_id";

ALTER TABLE "user_media_history"
  DROP COLUMN "id",
  DROP COLUMN "asset_id",
  DROP COLUMN "generation_job_id";
ALTER TABLE "user_media_history" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "user_media_history" RENAME COLUMN "asset_id_new" TO "asset_id";
ALTER TABLE "user_media_history" RENAME COLUMN "generation_job_id_new" TO "generation_job_id";

ALTER TABLE "credit_ledger"
  DROP COLUMN "id",
  DROP COLUMN "job_id";
ALTER TABLE "credit_ledger" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "credit_ledger" RENAME COLUMN "job_id_new" TO "job_id";

DROP SEQUENCE IF EXISTS "email_verification_codes_id_seq";
DROP SEQUENCE IF EXISTS "assets_id_seq";
DROP SEQUENCE IF EXISTS "templates_id_seq";
DROP SEQUENCE IF EXISTS "generation_jobs_id_seq";
DROP SEQUENCE IF EXISTS "user_media_history_id_seq";
DROP SEQUENCE IF EXISTS "credit_ledger_id_seq";

CREATE SEQUENCE "email_verification_codes_id_seq" AS integer
  MINVALUE 0 START WITH 0 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE "assets_id_seq" AS integer
  MINVALUE 0 START WITH 0 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE "templates_id_seq" AS integer
  MINVALUE 0 START WITH 0 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE "generation_jobs_id_seq" AS integer
  MINVALUE 0 START WITH 0 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE "user_media_history_id_seq" AS integer
  MINVALUE 0 START WITH 0 INCREMENT BY 1 NO CYCLE;
CREATE SEQUENCE "credit_ledger_id_seq" AS integer
  MINVALUE 0 START WITH 0 INCREMENT BY 1 NO CYCLE;

ALTER TABLE "email_verification_codes"
  ALTER COLUMN "id" SET DEFAULT nextval('email_verification_codes_id_seq'::regclass);
ALTER TABLE "assets"
  ALTER COLUMN "id" SET DEFAULT nextval('assets_id_seq'::regclass);
ALTER TABLE "templates"
  ALTER COLUMN "id" SET DEFAULT nextval('templates_id_seq'::regclass);
ALTER TABLE "generation_jobs"
  ALTER COLUMN "id" SET DEFAULT nextval('generation_jobs_id_seq'::regclass);
ALTER TABLE "user_media_history"
  ALTER COLUMN "id" SET DEFAULT nextval('user_media_history_id_seq'::regclass);
ALTER TABLE "credit_ledger"
  ALTER COLUMN "id" SET DEFAULT nextval('credit_ledger_id_seq'::regclass);

ALTER TABLE "email_verification_codes" ADD CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id");
ALTER TABLE "assets" ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");
ALTER TABLE "templates" ADD CONSTRAINT "templates_pkey" PRIMARY KEY ("id");
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id");
ALTER TABLE "user_media_history" ADD CONSTRAINT "user_media_history_pkey" PRIMARY KEY ("id");
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id");

ALTER TABLE "templates"
  ADD CONSTRAINT "templates_thumbnail_asset_id_assets_id_fk"
    FOREIGN KEY ("thumbnail_asset_id") REFERENCES "assets"("id"),
  ADD CONSTRAINT "templates_preview_asset_id_assets_id_fk"
    FOREIGN KEY ("preview_asset_id") REFERENCES "assets"("id");

ALTER TABLE "generation_jobs"
  ADD CONSTRAINT "generation_jobs_input_asset_id_assets_id_fk"
    FOREIGN KEY ("input_asset_id") REFERENCES "assets"("id"),
  ADD CONSTRAINT "generation_jobs_output_asset_id_assets_id_fk"
    FOREIGN KEY ("output_asset_id") REFERENCES "assets"("id");

ALTER TABLE "credit_ledger"
  ADD CONSTRAINT "credit_ledger_job_id_generation_jobs_id_fk"
    FOREIGN KEY ("job_id") REFERENCES "generation_jobs"("id");

ALTER TABLE "user_media_history"
  ADD CONSTRAINT "user_media_history_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "assets"("id"),
  ADD CONSTRAINT "user_media_history_generation_job_id_fkey"
    FOREIGN KEY ("generation_job_id") REFERENCES "generation_jobs"("id") ON DELETE SET NULL;

ALTER TABLE "user_media_history"
  DROP CONSTRAINT IF EXISTS "user_media_history_source_check",
  ADD CONSTRAINT "user_media_history_source_check"
    CHECK ("source" in ('user_upload', 'generated_image', 'generated_video')),
  DROP CONSTRAINT IF EXISTS "user_media_history_generation_type_check",
  ADD CONSTRAINT "user_media_history_generation_type_check"
    CHECK ("generation_type" is null or "generation_type" in ('image_to_video', 'apparel_image', 'try_on')),
  DROP CONSTRAINT IF EXISTS "user_media_history_role_check",
  ADD CONSTRAINT "user_media_history_role_check"
    CHECK ("role" is null or "role" in ('input', 'output', 'reference', 'garment', 'model')),
  DROP CONSTRAINT IF EXISTS "user_media_history_visibility_check",
  ADD CONSTRAINT "user_media_history_visibility_check"
    CHECK ("visibility" in ('active', 'hidden', 'deleted')),
  DROP CONSTRAINT IF EXISTS "user_media_history_used_count_check",
  ADD CONSTRAINT "user_media_history_used_count_check"
    CHECK ("used_count" >= 0);

CREATE INDEX "templates_type_category_sort_order_idx"
  ON "templates" ("type", "category", "sort_order", "id");
CREATE INDEX "templates_thumbnail_asset_id_idx" ON "templates" ("thumbnail_asset_id");
CREATE INDEX "templates_preview_asset_id_idx" ON "templates" ("preview_asset_id");
CREATE INDEX "generation_jobs_input_asset_id_idx" ON "generation_jobs" ("input_asset_id");
CREATE INDEX "generation_jobs_output_asset_id_idx" ON "generation_jobs" ("output_asset_id");
CREATE INDEX "credit_ledger_job_id_idx" ON "credit_ledger" ("job_id");
CREATE UNIQUE INDEX "credit_ledger_job_reason_unique"
  ON "credit_ledger" ("job_id", "reason")
  WHERE "job_id" is not null and "reason" in ('reserve', 'capture', 'refund');
CREATE INDEX "user_media_history_asset_id_idx" ON "user_media_history" ("asset_id");
CREATE INDEX "user_media_history_generation_job_id_idx" ON "user_media_history" ("generation_job_id");
CREATE UNIQUE INDEX "user_media_history_user_asset_source_role_unique"
  ON "user_media_history" ("user_id", "asset_id", "source", "role")
  WHERE "role" is not null;
CREATE UNIQUE INDEX "user_media_history_user_asset_source_unique"
  ON "user_media_history" ("user_id", "asset_id", "source")
  WHERE "role" is null;
CREATE INDEX IF NOT EXISTS "user_media_history_user_visibility_updated_idx"
  ON "user_media_history" ("user_id", "visibility", "updated_at");
CREATE INDEX IF NOT EXISTS "user_media_history_user_source_updated_idx"
  ON "user_media_history" ("user_id", "source", "updated_at");
CREATE INDEX IF NOT EXISTS "user_media_history_user_generation_type_updated_idx"
  ON "user_media_history" ("user_id", "generation_type", "updated_at");

UPDATE "templates"
SET
  "thumbnail_url" = CASE
    WHEN "thumbnail_url" LIKE '/api/template-media/%'
      THEN '/api/template-media/' || "thumbnail_asset_id"::text
    ELSE "thumbnail_url"
  END,
  "preview_url" = CASE
    WHEN "preview_url" LIKE '/api/template-media/%'
      THEN '/api/template-media/' || "preview_asset_id"::text
    ELSE "preview_url"
  END
WHERE "thumbnail_url" LIKE '/api/template-media/%'
   OR "preview_url" LIKE '/api/template-media/%';

ALTER SEQUENCE "email_verification_codes_id_seq" OWNED BY "email_verification_codes"."id";
ALTER SEQUENCE "assets_id_seq" OWNED BY "assets"."id";
ALTER SEQUENCE "templates_id_seq" OWNED BY "templates"."id";
ALTER SEQUENCE "generation_jobs_id_seq" OWNED BY "generation_jobs"."id";
ALTER SEQUENCE "user_media_history_id_seq" OWNED BY "user_media_history"."id";
ALTER SEQUENCE "credit_ledger_id_seq" OWNED BY "credit_ledger"."id";

ALTER SEQUENCE IF EXISTS "users_id_seq"
  MINVALUE 1
  START WITH 1
  RESTART WITH 1;
ALTER TABLE "users"
  ALTER COLUMN "id" SET DEFAULT nextval('users_id_seq'::regclass);
ALTER SEQUENCE IF EXISTS "users_id_seq" OWNED BY "users"."id";
ALTER TABLE "users"
  DROP CONSTRAINT IF EXISTS "users_id_positive_check",
  ADD CONSTRAINT "users_id_positive_check" CHECK ("id" > 0);

SELECT setval(
  'email_verification_codes_id_seq'::regclass,
  COALESCE((SELECT max("id") FROM "email_verification_codes"), 0),
  EXISTS (SELECT 1 FROM "email_verification_codes")
);
SELECT setval(
  'assets_id_seq'::regclass,
  COALESCE((SELECT max("id") FROM "assets"), 0),
  EXISTS (SELECT 1 FROM "assets")
);
SELECT setval(
  'templates_id_seq'::regclass,
  COALESCE((SELECT max("id") FROM "templates"), 0),
  EXISTS (SELECT 1 FROM "templates")
);
SELECT setval(
  'generation_jobs_id_seq'::regclass,
  COALESCE((SELECT max("id") FROM "generation_jobs"), 0),
  EXISTS (SELECT 1 FROM "generation_jobs")
);
SELECT setval(
  'user_media_history_id_seq'::regclass,
  COALESCE((SELECT max("id") FROM "user_media_history"), 0),
  EXISTS (SELECT 1 FROM "user_media_history")
);
SELECT setval(
  'credit_ledger_id_seq'::regclass,
  COALESCE((SELECT max("id") FROM "credit_ledger"), 0),
  EXISTS (SELECT 1 FROM "credit_ledger")
);
SELECT setval(
  'users_id_seq'::regclass,
  GREATEST(COALESCE((SELECT max("id") FROM "users"), 1), 1),
  EXISTS (SELECT 1 FROM "users")
);

DROP TABLE "__id_migration_assets";
DROP TABLE "__id_migration_templates";
DROP TABLE "__id_migration_generation_jobs";
DROP TABLE "__id_migration_user_media_history";
DROP TABLE "__id_migration_credit_ledger";
DROP TABLE "__id_migration_email_verification_codes";
