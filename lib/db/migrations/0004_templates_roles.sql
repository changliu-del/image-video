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
	"name" varchar(140) NOT NULL,
	"description" text NOT NULL,
	"category" text DEFAULT 'image_to_image' NOT NULL,
	"prompt" text NOT NULL,
	"negative_prompt" text,
	"preview_asset_id" uuid,
	"tags_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cost_credits" integer DEFAULT 1 NOT NULL,
	"aspect_ratios_json" jsonb DEFAULT '["9:16"]'::jsonb NOT NULL,
	"duration_seconds" integer,
	"sort_weight" integer DEFAULT 0 NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "templates_category_check" CHECK ("category" IN ('image_to_video', 'image_to_image', 'try_on')),
	CONSTRAINT "templates_cost_credits_check" CHECK ("cost_credits" >= 0),
	CONSTRAINT "templates_usage_count_check" CHECK ("usage_count" >= 0),
	CONSTRAINT "templates_duration_seconds_check" CHECK ("duration_seconds" IS NULL OR "duration_seconds" IN (5, 8, 10))
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_preview_asset_id_assets_id_fk" FOREIGN KEY ("preview_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
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
CREATE INDEX IF NOT EXISTS "templates_category_idx" ON "templates" ("category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "templates_sort_weight_idx" ON "templates" ("sort_weight");
