ALTER TABLE "templates"
  DROP CONSTRAINT IF EXISTS "templates_preview_asset_id_assets_id_fk",
  DROP CONSTRAINT IF EXISTS "templates_thumbnail_asset_id_assets_id_fk",
  DROP CONSTRAINT IF EXISTS "templates_category_check",
  DROP CONSTRAINT IF EXISTS "templates_type_check",
  DROP CONSTRAINT IF EXISTS "templates_category_not_empty_check",
  DROP CONSTRAINT IF EXISTS "templates_cost_credits_check",
  DROP CONSTRAINT IF EXISTS "templates_usage_count_check",
  DROP CONSTRAINT IF EXISTS "templates_duration_seconds_check";

DROP INDEX IF EXISTS "templates_category_idx";
DROP INDEX IF EXISTS "templates_sort_weight_idx";
DROP INDEX IF EXISTS "templates_type_idx";
DROP INDEX IF EXISTS "templates_type_category_idx";
DROP INDEX IF EXISTS "templates_thumbnail_asset_id_idx";
DROP INDEX IF EXISTS "templates_preview_asset_id_idx";

-- Existing template rows belong to the retired prompt/tag/url model. The new
-- model requires both thumbnail and preview media to exist as assets, so old
-- rows are intentionally discarded and should be re-imported through the
-- asset-backed template import flow.
DELETE FROM "templates";

ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "type" text,
  ADD COLUMN IF NOT EXISTS "thumbnail_asset_id" uuid,
  ADD COLUMN IF NOT EXISTS "preview_asset_id" uuid;

ALTER TABLE "templates"
  ALTER COLUMN "type" SET DEFAULT 'image_to_video',
  ALTER COLUMN "type" SET NOT NULL,
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "thumbnail_asset_id" SET NOT NULL,
  ALTER COLUMN "preview_asset_id" SET NOT NULL,
  ALTER COLUMN "prompt" SET NOT NULL;

ALTER TABLE "templates"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "slug",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "negative_prompt",
  DROP COLUMN IF EXISTS "reverse_prompt",
  DROP COLUMN IF EXISTS "thumbnail_url",
  DROP COLUMN IF EXISTS "preview_url",
  DROP COLUMN IF EXISTS "tags_json",
  DROP COLUMN IF EXISTS "tag_slugs",
  DROP COLUMN IF EXISTS "cost_credits",
  DROP COLUMN IF EXISTS "aspect_ratios",
  DROP COLUMN IF EXISTS "aspect_ratios_json",
  DROP COLUMN IF EXISTS "duration_seconds",
  DROP COLUMN IF EXISTS "sort_weight",
  DROP COLUMN IF EXISTS "usage_count",
  DROP COLUMN IF EXISTS "created_by",
  DROP COLUMN IF EXISTS "updated_by";

ALTER TABLE "templates"
  ADD CONSTRAINT "templates_thumbnail_asset_id_assets_id_fk"
    FOREIGN KEY ("thumbnail_asset_id") REFERENCES "assets"("id"),
  ADD CONSTRAINT "templates_preview_asset_id_assets_id_fk"
    FOREIGN KEY ("preview_asset_id") REFERENCES "assets"("id"),
  ADD CONSTRAINT "templates_type_check"
    CHECK ("type" IN ('image_to_video', 'image_to_image')),
  ADD CONSTRAINT "templates_category_not_empty_check"
    CHECK (length(trim("category")) > 0);

CREATE INDEX IF NOT EXISTS "templates_type_idx"
  ON "templates" ("type");

CREATE INDEX IF NOT EXISTS "templates_type_category_idx"
  ON "templates" ("type", "category");

CREATE INDEX IF NOT EXISTS "templates_thumbnail_asset_id_idx"
  ON "templates" ("thumbnail_asset_id");

CREATE INDEX IF NOT EXISTS "templates_preview_asset_id_idx"
  ON "templates" ("preview_asset_id");
