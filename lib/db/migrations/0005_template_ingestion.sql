CREATE TABLE IF NOT EXISTS "template_ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(80) NOT NULL,
	"status" varchar(24) DEFAULT 'running' NOT NULL,
	"dry_run" boolean DEFAULT false NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"stats_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error_message" text,
	"created_by" integer,
	CONSTRAINT "template_ingestion_runs_status_check" CHECK ("status" IN ('running', 'succeeded', 'failed'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_source_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid,
	"template_id" uuid,
	"asset_id" uuid,
	"source" varchar(80) NOT NULL,
	"source_url" text NOT NULL,
	"source_asset_url" text,
	"content_hash" varchar(128) NOT NULL,
	"prompt" text NOT NULL,
	"prompt_source" varchar(40) NOT NULL,
	"license_note" text,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_ingestion_runs" ADD CONSTRAINT "template_ingestion_runs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_source_records" ADD CONSTRAINT "template_source_records_run_id_template_ingestion_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."template_ingestion_runs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_source_records" ADD CONSTRAINT "template_source_records_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_source_records" ADD CONSTRAINT "template_source_records_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_ingestion_runs_source_started_idx" ON "template_ingestion_runs" ("source", "started_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "template_source_records_source_url_unique" ON "template_source_records" ("source", "source_url");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "template_source_records_content_hash_unique" ON "template_source_records" ("content_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_source_records_template_id_idx" ON "template_source_records" ("template_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "template_source_records_run_id_idx" ON "template_source_records" ("run_id");
