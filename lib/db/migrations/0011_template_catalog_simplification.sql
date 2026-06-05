ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "name" varchar(140);
--> statement-breakpoint
UPDATE "templates"
SET "name" = COALESCE(NULLIF(trim("title"), ''), NULLIF(trim("slug"), ''), "id"::text)
WHERE "name" IS NULL OR trim("name") = '';
--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "name" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "category" text;
--> statement-breakpoint
UPDATE "templates"
SET "category" = CASE
  WHEN "type" = 'image_to_video' THEN 'image_to_video'
  WHEN "type" = 'video' THEN 'image_to_video'
  ELSE 'image_to_image'
END
WHERE "category" IS NULL OR trim("category") = '';
--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "category" SET DEFAULT 'image_to_image';
--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "category" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN IF NOT EXISTS "template_id" uuid;
--> statement-breakpoint
UPDATE "generation_jobs"
SET "template_id" = NULLIF("input_json"->>'templateId', '')::uuid
WHERE "template_id" IS NULL
  AND COALESCE("input_json"->>'templateId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
--> statement-breakpoint
UPDATE "template_assets"
SET "role" = 'preview'
WHERE "role" = 'thumbnail';
--> statement-breakpoint
DROP INDEX IF EXISTS "templates_locale_slug_unique";
--> statement-breakpoint
DROP INDEX IF EXISTS "templates_locale_status_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "templates_type_status_idx";
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_slug_check";
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_type_check";
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_status_check";
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_thumbnail_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "templates" DROP CONSTRAINT IF EXISTS "templates_published_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "template_assets" DROP CONSTRAINT IF EXISTS "template_assets_role_check";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_category_check" CHECK ("category" IN ('image_to_video', 'image_to_image', 'try_on'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_assets" ADD CONSTRAINT "template_assets_role_check" CHECK ("role" IN ('preview', 'source', 'example'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "templates_category_idx" ON "templates" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generation_jobs_template_id_idx" ON "generation_jobs" ("template_id");
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "slug";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "locale";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "title";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "type";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "status";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "hook";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "cta";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "prompt_json";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "default_inputs_json";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "thumbnail_asset_id";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "published_by";
--> statement-breakpoint
ALTER TABLE "templates" DROP COLUMN IF EXISTS "published_at";
