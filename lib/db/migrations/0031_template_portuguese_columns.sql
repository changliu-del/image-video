ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "pt_title" varchar(140),
  ADD COLUMN IF NOT EXISTS "pt_prompt" text;

UPDATE "templates"
SET
  "title" = left(
    coalesce(
      nullif("title_translations_json" ->> 'en', ''),
      nullif("title", ''),
      nullif("title_translations_json" ->> 'pt', ''),
      'Untitled template'
    ),
    140
  )
WHERE "title_translations_json" ? 'en'
  OR length(trim(coalesce("title", ''))) = 0;

UPDATE "templates"
SET
  "prompt" = coalesce(
    nullif("prompt_translations_json" ->> 'en', ''),
    nullif("prompt", ''),
    nullif("prompt_translations_json" ->> 'pt', ''),
    'Template prompt.'
  )
WHERE "prompt_translations_json" ? 'en'
  OR length(trim(coalesce("prompt", ''))) = 0;

UPDATE "templates"
SET
  "pt_title" = left(
    coalesce(
      nullif("pt_title", ''),
      nullif("title_translations_json" ->> 'pt', ''),
      nullif("title", ''),
      'Untitled template'
    ),
    140
  ),
  "pt_prompt" = coalesce(
    nullif("pt_prompt", ''),
    nullif("prompt_translations_json" ->> 'pt', ''),
    nullif("prompt", ''),
    'Template prompt.'
  );

ALTER TABLE "templates"
  ALTER COLUMN "pt_title" SET NOT NULL,
  ALTER COLUMN "pt_prompt" SET NOT NULL;

ALTER TABLE "templates"
  DROP CONSTRAINT IF EXISTS "templates_title_not_empty_check",
  DROP CONSTRAINT IF EXISTS "templates_pt_title_not_empty_check",
  DROP CONSTRAINT IF EXISTS "templates_prompt_not_empty_check",
  DROP CONSTRAINT IF EXISTS "templates_pt_prompt_not_empty_check",
  ADD CONSTRAINT "templates_title_not_empty_check"
    CHECK (length(trim("title")) > 0),
  ADD CONSTRAINT "templates_pt_title_not_empty_check"
    CHECK (length(trim("pt_title")) > 0),
  ADD CONSTRAINT "templates_prompt_not_empty_check"
    CHECK (length(trim("prompt")) > 0),
  ADD CONSTRAINT "templates_pt_prompt_not_empty_check"
    CHECK (length(trim("pt_prompt")) > 0);

ALTER TABLE "templates"
  DROP COLUMN IF EXISTS "title_translations_json",
  DROP COLUMN IF EXISTS "prompt_translations_json";
