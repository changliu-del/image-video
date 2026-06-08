ALTER TABLE "user_media_history"
  DROP CONSTRAINT IF EXISTS "user_media_history_library_asset_id_library_assets_id_fk",
  DROP CONSTRAINT IF EXISTS "user_media_history_library_asset_id_fkey";

DROP INDEX IF EXISTS "user_media_history_library_asset_id_idx";

ALTER TABLE "user_media_history"
  DROP COLUMN IF EXISTS "library_asset_id";

UPDATE "user_media_history"
SET "source" = 'user_upload'
WHERE "source" = 'ops_library_used';

ALTER TABLE "user_media_history"
  DROP CONSTRAINT IF EXISTS "user_media_history_source_check",
  ADD CONSTRAINT "user_media_history_source_check"
    CHECK ("source" IN ('user_upload', 'generated_image', 'generated_video'));

DROP TABLE IF EXISTS "library_assets";
