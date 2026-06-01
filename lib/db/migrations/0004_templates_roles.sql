UPDATE "users"
SET "role" = 'admin'
WHERE "is_admin" = true AND "role" <> 'admin';
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('member', 'ops', 'admin'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"locale" varchar(8) DEFAULT 'pt' NOT NULL,
	"title" varchar(140) NOT NULL,
	"description" text NOT NULL,
	"type" text DEFAULT 'image_to_video' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"hook" varchar(220) NOT NULL,
	"cta" varchar(80),
	"prompt" text NOT NULL,
	"negative_prompt" text,
	"prompt_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"default_inputs_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"preview_asset_id" uuid,
	"thumbnail_asset_id" uuid,
	"cost_credits" integer DEFAULT 1 NOT NULL,
	"aspect_ratios_json" jsonb DEFAULT '["9:16"]'::jsonb NOT NULL,
	"duration_seconds" integer,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"published_by" integer,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "templates_slug_check" CHECK ("slug" ~ '^[a-z0-9][a-z0-9_-]*$'),
	CONSTRAINT "templates_type_check" CHECK ("type" IN ('image', 'image_to_video', 'video')),
	CONSTRAINT "templates_status_check" CHECK ("status" IN ('draft', 'published', 'archived')),
	CONSTRAINT "templates_cost_credits_check" CHECK ("cost_credits" >= 0),
	CONSTRAINT "templates_usage_count_check" CHECK ("usage_count" >= 0),
	CONSTRAINT "templates_duration_seconds_check" CHECK ("duration_seconds" IS NULL OR "duration_seconds" IN (5, 8, 10))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"group" varchar(40) NOT NULL,
	"label_pt" varchar(80) NOT NULL,
	"label_en" varchar(80) NOT NULL,
	"label_zh" varchar(80) NOT NULL,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "template_tags_group_check" CHECK ("group" IN ('goal', 'type', 'industry', 'channel', 'funnel', 'cost', 'aspect_ratio'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_tag_relations" (
	"template_id" uuid NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "template_tag_relations_template_id_tag_id_pk" PRIMARY KEY("template_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"role" varchar(24) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "template_assets_role_check" CHECK ("role" IN ('thumbnail', 'preview', 'source', 'example'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid,
	"actor_id" integer,
	"action" varchar(60) NOT NULL,
	"before_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"after_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_preview_asset_id_assets_id_fk" FOREIGN KEY ("preview_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_thumbnail_asset_id_assets_id_fk" FOREIGN KEY ("thumbnail_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_tag_relations" ADD CONSTRAINT "template_tag_relations_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_tag_relations" ADD CONSTRAINT "template_tag_relations_tag_id_template_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."template_tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_assets" ADD CONSTRAINT "template_assets_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_assets" ADD CONSTRAINT "template_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_audit_logs" ADD CONSTRAINT "template_audit_logs_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_audit_logs" ADD CONSTRAINT "template_audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD COLUMN IF NOT EXISTS "template_id" uuid;
--> statement-breakpoint
ALTER TABLE "generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_template_slug_check";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_template_slug_check" CHECK (length(trim("template_slug")) > 0);
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
CREATE UNIQUE INDEX IF NOT EXISTS "templates_locale_slug_unique" ON "templates" ("locale", "slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "templates_locale_status_idx" ON "templates" ("locale", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "templates_type_status_idx" ON "templates" ("type", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "templates_sort_weight_idx" ON "templates" ("sort_weight");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "template_tags_slug_unique" ON "template_tags" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_tags_group_idx" ON "template_tags" ("group");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_tag_relations_tag_id_idx" ON "template_tag_relations" ("tag_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "template_assets_template_asset_role_unique" ON "template_assets" ("template_id", "asset_id", "role");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_assets_template_id_idx" ON "template_assets" ("template_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_assets_asset_id_idx" ON "template_assets" ("asset_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_audit_logs_template_id_idx" ON "template_audit_logs" ("template_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_audit_logs_actor_id_idx" ON "template_audit_logs" ("actor_id");
