CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"mime_type" text,
	"size_bytes" integer,
	"width" integer,
	"height" integer,
	"duration_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assets_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "assets_type_check" CHECK ("type" IN ('upload', 'raw_video', 'final_video', 'thumbnail')),
	CONSTRAINT "assets_status_check" CHECK ("status" IN ('pending', 'uploaded', 'failed')),
	CONSTRAINT "assets_size_bytes_check" CHECK ("size_bytes" IS NULL OR "size_bytes" >= 0),
	CONSTRAINT "assets_width_check" CHECK ("width" IS NULL OR "width" > 0),
	CONSTRAINT "assets_height_check" CHECK ("height" IS NULL OR "height" > 0),
	CONSTRAINT "assets_duration_seconds_check" CHECK ("duration_seconds" IS NULL OR "duration_seconds" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"input_asset_id" uuid NOT NULL,
	"raw_video_asset_id" uuid,
	"final_video_asset_id" uuid,
	"thumbnail_asset_id" uuid,
	"provider" text DEFAULT 'fal' NOT NULL,
	"provider_job_id" text,
	"prompt" text NOT NULL,
	"negative_prompt" text,
	"product_name" varchar(120) NOT NULL,
	"headline" varchar(100) NOT NULL,
	"selling_point" text NOT NULL,
	"price_text" varchar(64) NOT NULL,
	"aspect_ratio" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"error_message" text,
	"credit_reserved" integer DEFAULT 0 NOT NULL,
	"credit_spent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	CONSTRAINT "generation_jobs_status_check" CHECK ("status" IN ('queued', 'running', 'rendering', 'succeeded', 'failed')),
	CONSTRAINT "generation_jobs_aspect_ratio_check" CHECK ("aspect_ratio" IN ('9:16', '1:1', '16:9')),
	CONSTRAINT "generation_jobs_duration_seconds_check" CHECK ("duration_seconds" IN (5, 8, 10)),
	CONSTRAINT "generation_jobs_credit_reserved_check" CHECK ("credit_reserved" >= 0),
	CONSTRAINT "generation_jobs_credit_spent_check" CHECK ("credit_spent" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "credit_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"job_id" uuid,
	"stripe_event_id" text,
	"delta" integer NOT NULL,
	"reason" text NOT NULL,
	"balance_after" integer NOT NULL,
	"metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_ledger_reason_check" CHECK ("reason" IN ('purchase', 'reserve', 'capture', 'refund', 'admin_adjust')),
	CONSTRAINT "credit_ledger_delta_reason_check" CHECK (
		("reason" = 'reserve' AND "delta" < 0)
		OR ("reason" IN ('purchase', 'refund') AND "delta" > 0)
		OR ("reason" = 'capture' AND "delta" = 0)
		OR "reason" = 'admin_adjust'
	)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"request_json" jsonb,
	"response_json" jsonb,
	"status" text DEFAULT 'started' NOT NULL,
	"cost_usd" numeric(10, 4),
	"latency_ms" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "provider_calls_status_check" CHECK ("status" IN ('started', 'succeeded', 'failed')),
	CONSTRAINT "provider_calls_cost_usd_check" CHECK ("cost_usd" IS NULL OR "cost_usd" >= 0),
	CONSTRAINT "provider_calls_latency_ms_check" CHECK ("latency_ms" IS NULL OR "latency_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "render_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"aspect_ratio" text NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"duration_seconds" integer,
	"width" integer,
	"height" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "render_outputs_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "render_outputs_aspect_ratio_check" CHECK ("aspect_ratio" IN ('9:16', '1:1', '16:9')),
	CONSTRAINT "render_outputs_duration_seconds_check" CHECK ("duration_seconds" IS NULL OR "duration_seconds" >= 0),
	CONSTRAINT "render_outputs_width_check" CHECK ("width" IS NULL OR "width" > 0),
	CONSTRAINT "render_outputs_height_check" CHECK ("height" IS NULL OR "height" > 0)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_input_asset_id_assets_id_fk" FOREIGN KEY ("input_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_raw_video_asset_id_assets_id_fk" FOREIGN KEY ("raw_video_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_final_video_asset_id_assets_id_fk" FOREIGN KEY ("final_video_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_thumbnail_asset_id_assets_id_fk" FOREIGN KEY ("thumbnail_asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_job_id_generation_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider_calls" ADD CONSTRAINT "provider_calls_job_id_generation_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "render_outputs" ADD CONSTRAINT "render_outputs_job_id_generation_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."generation_jobs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_user_id_idx" ON "assets" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assets_user_type_status_idx" ON "assets" ("user_id", "type", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generation_jobs_user_id_idx" ON "generation_jobs" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generation_jobs_user_status_idx" ON "generation_jobs" ("user_id", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "generation_jobs_input_asset_id_idx" ON "generation_jobs" ("input_asset_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "generation_jobs_provider_job_id_unique" ON "generation_jobs" ("provider", "provider_job_id") WHERE "provider_job_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_ledger_stripe_event_id_unique" ON "credit_ledger" ("stripe_event_id") WHERE "stripe_event_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_ledger_job_reason_unique" ON "credit_ledger" ("job_id", "reason") WHERE "job_id" IS NOT NULL AND "reason" IN ('reserve', 'capture', 'refund');
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_ledger_user_created_at_idx" ON "credit_ledger" ("user_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_ledger_job_id_idx" ON "credit_ledger" ("job_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_ledger_reason_idx" ON "credit_ledger" ("reason");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_calls_job_id_idx" ON "provider_calls" ("job_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "provider_calls_provider_status_idx" ON "provider_calls" ("provider", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "render_outputs_job_id_idx" ON "render_outputs" ("job_id");
