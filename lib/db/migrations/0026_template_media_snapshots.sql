ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "thumbnail_url" text,
  ADD COLUMN IF NOT EXISTS "preview_url" text,
  ADD COLUMN IF NOT EXISTS "thumbnail_mime_type" varchar(120),
  ADD COLUMN IF NOT EXISTS "preview_mime_type" varchar(120);

UPDATE "templates"
SET
  "thumbnail_url" = coalesce(
    nullif("templates"."thumbnail_url", ''),
    '/api/template-media/' || "templates"."thumbnail_asset_id"::text
  ),
  "preview_url" = coalesce(
    nullif("templates"."preview_url", ''),
    '/api/template-media/' || "templates"."preview_asset_id"::text
  ),
  "thumbnail_mime_type" = coalesce(
    nullif("templates"."thumbnail_mime_type", ''),
    "thumbnail_asset"."mime_type",
    'image/png'
  ),
  "preview_mime_type" = coalesce(
    nullif("templates"."preview_mime_type", ''),
    "preview_asset"."mime_type",
    'video/mp4'
  )
FROM "assets" AS "thumbnail_asset", "assets" AS "preview_asset"
WHERE "templates"."thumbnail_asset_id" = "thumbnail_asset"."id"
  AND "templates"."preview_asset_id" = "preview_asset"."id";

UPDATE "templates"
SET
  "thumbnail_url" = coalesce(
    nullif("thumbnail_url", ''),
    '/api/template-media/' || "thumbnail_asset_id"::text
  ),
  "preview_url" = coalesce(
    nullif("preview_url", ''),
    '/api/template-media/' || "preview_asset_id"::text
  ),
  "thumbnail_mime_type" = coalesce(
    nullif("thumbnail_mime_type", ''),
    'image/png'
  ),
  "preview_mime_type" = coalesce(
    nullif("preview_mime_type", ''),
    'video/mp4'
  );

ALTER TABLE "templates"
  ALTER COLUMN "thumbnail_url" SET NOT NULL,
  ALTER COLUMN "preview_url" SET NOT NULL,
  ALTER COLUMN "thumbnail_mime_type" SET NOT NULL,
  ALTER COLUMN "preview_mime_type" SET NOT NULL;

ALTER TABLE "templates"
  DROP CONSTRAINT IF EXISTS "templates_thumbnail_url_not_empty_check",
  DROP CONSTRAINT IF EXISTS "templates_preview_url_not_empty_check",
  DROP CONSTRAINT IF EXISTS "templates_thumbnail_mime_type_not_empty_check",
  DROP CONSTRAINT IF EXISTS "templates_preview_mime_type_not_empty_check",
  ADD CONSTRAINT "templates_thumbnail_url_not_empty_check"
    CHECK (length(trim("thumbnail_url")) > 0),
  ADD CONSTRAINT "templates_preview_url_not_empty_check"
    CHECK (length(trim("preview_url")) > 0),
  ADD CONSTRAINT "templates_thumbnail_mime_type_not_empty_check"
    CHECK (length(trim("thumbnail_mime_type")) > 0),
  ADD CONSTRAINT "templates_preview_mime_type_not_empty_check"
    CHECK (length(trim("preview_mime_type")) > 0);
