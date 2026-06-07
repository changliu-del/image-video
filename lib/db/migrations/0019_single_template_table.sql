ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "tags_json" jsonb NOT NULL DEFAULT '[]'::jsonb;
