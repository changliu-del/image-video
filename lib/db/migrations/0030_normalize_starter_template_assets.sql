WITH starter_asset_pairs AS (
  SELECT
    old_asset."id" AS "old_id",
    external_asset."id" AS "external_id"
  FROM "assets" old_asset
  JOIN "assets" external_asset
    ON external_asset."storage_key" = regexp_replace(
      old_asset."storage_key",
      '^templates/starter/',
      'external/starter/'
    )
  WHERE old_asset."storage_key" LIKE 'templates/starter/%'
    AND old_asset."public_url" LIKE '/resources/%'
)
UPDATE "templates"
SET
  "thumbnail_asset_id" = COALESCE(
    (
      SELECT "external_id"
      FROM starter_asset_pairs
      WHERE "old_id" = "templates"."thumbnail_asset_id"
    ),
    "thumbnail_asset_id"
  ),
  "preview_asset_id" = COALESCE(
    (
      SELECT "external_id"
      FROM starter_asset_pairs
      WHERE "old_id" = "templates"."preview_asset_id"
    ),
    "preview_asset_id"
  ),
  "thumbnail_url" = CASE
    WHEN EXISTS (
      SELECT 1
      FROM starter_asset_pairs
      WHERE "old_id" = "templates"."thumbnail_asset_id"
    )
      THEN '/api/template-media/' || (
        SELECT "external_id"
        FROM starter_asset_pairs
        WHERE "old_id" = "templates"."thumbnail_asset_id"
      )::text
    ELSE "thumbnail_url"
  END,
  "preview_url" = CASE
    WHEN EXISTS (
      SELECT 1
      FROM starter_asset_pairs
      WHERE "old_id" = "templates"."preview_asset_id"
    )
      THEN '/api/template-media/' || (
        SELECT "external_id"
        FROM starter_asset_pairs
        WHERE "old_id" = "templates"."preview_asset_id"
      )::text
    ELSE "preview_url"
  END,
  "updated_at" = now()
WHERE "thumbnail_asset_id" IN (SELECT "old_id" FROM starter_asset_pairs)
   OR "preview_asset_id" IN (SELECT "old_id" FROM starter_asset_pairs);

UPDATE "assets" old_asset
SET
  "storage_key" = CASE
    WHEN EXISTS (
      SELECT 1
      FROM "assets" existing_asset
      WHERE existing_asset."storage_key" = regexp_replace(
        old_asset."storage_key",
        '^templates/starter/',
        'external/starter/'
      )
    )
      THEN 'archived/starter/' || old_asset."id"::text || '/' || substring(
        old_asset."storage_key" from '^templates/starter/(.*)$'
      )
    ELSE regexp_replace(
      old_asset."storage_key",
      '^templates/starter/',
      'external/starter/'
    )
  END,
  "updated_at" = now()
WHERE old_asset."storage_key" LIKE 'templates/starter/%'
  AND old_asset."public_url" LIKE '/resources/%';
