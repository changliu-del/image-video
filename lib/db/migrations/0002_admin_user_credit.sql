ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credit_balance" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_product_id" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_name" varchar(50);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_status" varchar(20);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_credit_balance_check" CHECK ("credit_balance" >= 0);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_customer_id_unique" ON "users" ("stripe_customer_id") WHERE "stripe_customer_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_subscription_id_unique" ON "users" ("stripe_subscription_id") WHERE "stripe_subscription_id" IS NOT NULL;
