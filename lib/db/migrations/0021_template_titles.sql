ALTER TABLE "templates"
  DROP CONSTRAINT IF EXISTS "templates_title_not_empty_check";

ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "title" varchar(140),
  ADD COLUMN IF NOT EXISTS "title_translations_json" jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE "templates"
SET "title" = "category"
WHERE "title" IS NULL OR length(trim("title")) = 0;

ALTER TABLE "templates"
  ALTER COLUMN "title" SET NOT NULL;

ALTER TABLE "templates"
  ADD CONSTRAINT "templates_title_not_empty_check"
    CHECK (length(trim("title")) > 0);

CREATE INDEX IF NOT EXISTS "templates_type_title_idx"
  ON "templates" ("type", "title");
