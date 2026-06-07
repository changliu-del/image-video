ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "prompt_translations_json" jsonb NOT NULL DEFAULT '{}'::jsonb;
