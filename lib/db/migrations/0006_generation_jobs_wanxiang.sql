ALTER TABLE "assets" DROP CONSTRAINT IF EXISTS "assets_type_check";

UPDATE "assets"
SET "type" = CASE
  WHEN "type" = 'final_video' THEN 'final_video'
  WHEN "type" = 'raw_video' THEN 'final_video'
  ELSE 'upload'
END
WHERE "type" NOT IN ('upload', 'final_video');

ALTER TABLE "assets"
ADD CONSTRAINT "assets_type_check"
CHECK ("type" IN ('upload', 'final_image', 'final_video'));

ALTER TABLE "generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_status_check";
ALTER TABLE "generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_aspect_ratio_check";
ALTER TABLE "generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_duration_seconds_check";
ALTER TABLE "generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_template_slug_check";
DROP INDEX IF EXISTS "generation_jobs_provider_job_id_unique";

ALTER TABLE "generation_jobs"
ADD COLUMN IF NOT EXISTS "generation_type" text,
ADD COLUMN IF NOT EXISTS "try_on_mode" text,
ADD COLUMN IF NOT EXISTS "provider_task_id" text,
ADD COLUMN IF NOT EXISTS "input_json" jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS "output_json" jsonb,
ADD COLUMN IF NOT EXISTS "final_image_asset_id" uuid;

ALTER TABLE "generation_jobs"
ADD CONSTRAINT "generation_jobs_final_image_asset_id_assets_id_fk"
FOREIGN KEY ("final_image_asset_id") REFERENCES "assets"("id");

UPDATE "generation_jobs"
SET
  "status" = CASE
    WHEN "status" IN ('succeeded', 'failed') THEN "status"
    ELSE 'running'
  END,
  "generation_type" = COALESCE("generation_type", 'image_to_video'),
  "provider_task_id" = COALESCE("provider_task_id", "provider_job_id", "id"::text),
  "input_json" = CASE
    WHEN "input_json" IS NOT NULL AND "input_json" <> '{}'::jsonb THEN "input_json"
    ELSE
    jsonb_strip_nulls(jsonb_build_object(
      'generationType', 'image_to_video',
      'inputAssetId', "input_asset_id"::text,
      'prompt', "prompt",
      'negativePrompt', "negative_prompt",
      'productName', "product_name",
      'headline', "headline",
      'sellingPoint', "selling_point",
      'priceText', "price_text",
      'ctaText', "cta_text",
      'aspectRatio', "aspect_ratio",
      'durationSeconds', "duration_seconds",
      'templateSlug', "template_slug",
      'templateId', "template_id"::text
    ))
  END;

ALTER TABLE "generation_jobs"
ALTER COLUMN "generation_type" SET NOT NULL,
ALTER COLUMN "provider_task_id" SET NOT NULL,
ALTER COLUMN "input_json" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'running',
ALTER COLUMN "provider" SET DEFAULT 'wanxiang';

ALTER TABLE "generation_jobs"
ADD CONSTRAINT "generation_jobs_status_check"
CHECK ("status" IN ('running', 'succeeded', 'failed'));

ALTER TABLE "generation_jobs"
ADD CONSTRAINT "generation_jobs_type_check"
CHECK ("generation_type" IN ('image_to_video', 'apparel_image', 'try_on'));

ALTER TABLE "generation_jobs"
ADD CONSTRAINT "generation_jobs_try_on_mode_check"
CHECK ("try_on_mode" IS NULL OR "try_on_mode" IN ('single', 'multi'));

ALTER TABLE "generation_jobs"
ADD CONSTRAINT "generation_jobs_try_on_mode_type_check"
CHECK (
  ("generation_type" = 'try_on' AND "try_on_mode" IS NOT NULL)
  OR ("generation_type" <> 'try_on' AND "try_on_mode" IS NULL)
);

ALTER TABLE "generation_jobs"
ADD CONSTRAINT "generation_jobs_provider_task_id_unique"
UNIQUE ("provider", "provider_task_id");

CREATE INDEX IF NOT EXISTS "generation_jobs_type_status_idx"
ON "generation_jobs" ("generation_type", "status");

ALTER TABLE "generation_jobs"
DROP COLUMN IF EXISTS "raw_video_asset_id",
DROP COLUMN IF EXISTS "thumbnail_asset_id",
DROP COLUMN IF EXISTS "provider_job_id",
DROP COLUMN IF EXISTS "prompt",
DROP COLUMN IF EXISTS "negative_prompt",
DROP COLUMN IF EXISTS "product_name",
DROP COLUMN IF EXISTS "headline",
DROP COLUMN IF EXISTS "selling_point",
DROP COLUMN IF EXISTS "price_text",
DROP COLUMN IF EXISTS "cta_text",
DROP COLUMN IF EXISTS "aspect_ratio",
DROP COLUMN IF EXISTS "duration_seconds",
DROP COLUMN IF EXISTS "template_slug",
DROP COLUMN IF EXISTS "template_id",
DROP COLUMN IF EXISTS "started_at";
