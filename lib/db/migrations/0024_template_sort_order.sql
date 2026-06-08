ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "sort_order" integer;

WITH ranked_templates AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "type", "category"
      ORDER BY "created_at", "id"
    )::integer AS "next_sort_order"
  FROM "templates"
)
UPDATE "templates"
SET "sort_order" = ranked_templates."next_sort_order"
FROM ranked_templates
WHERE "templates"."id" = ranked_templates."id"
  AND "templates"."sort_order" IS NULL;

UPDATE "templates"
SET "sort_order" = 0
WHERE "sort_order" IS NULL;

ALTER TABLE "templates"
  ALTER COLUMN "sort_order" SET DEFAULT 0,
  ALTER COLUMN "sort_order" SET NOT NULL;

ALTER TABLE "templates"
  DROP CONSTRAINT IF EXISTS "templates_sort_order_check",
  ADD CONSTRAINT "templates_sort_order_check"
    CHECK ("sort_order" >= 0);

CREATE INDEX IF NOT EXISTS "templates_type_category_sort_order_idx"
  ON "templates" ("type", "category", "sort_order", "id");
