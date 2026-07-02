CREATE SEQUENCE "product_analytics_batches_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
CREATE SEQUENCE "product_analytics_items_id_seq" AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

CREATE TABLE "product_analytics_batches" (
  "id" integer PRIMARY KEY DEFAULT nextval('product_analytics_batches_id_seq'::regclass) NOT NULL,
  "rank_type" varchar(32) NOT NULL,
  "source_file_name" text NOT NULL,
  "row_count" integer DEFAULT 0 NOT NULL,
  "imported_by_user_id" integer REFERENCES "users"("id"),
  "metadata_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "product_analytics_batches_rank_type_check"
    CHECK ("rank_type" in ('sales', 'new', 'promoted', 'video-products')),
  CONSTRAINT "product_analytics_batches_row_count_check"
    CHECK ("row_count" >= 0),
  CONSTRAINT "product_analytics_batches_source_file_name_check"
    CHECK (length(trim("source_file_name")) > 0)
);

CREATE TABLE "product_analytics_active_batches" (
  "rank_type" varchar(32) PRIMARY KEY NOT NULL,
  "batch_id" integer NOT NULL REFERENCES "product_analytics_batches"("id"),
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "product_analytics_active_batches_rank_type_check"
    CHECK ("rank_type" in ('sales', 'new', 'promoted', 'video-products'))
);

CREATE TABLE "product_analytics_items" (
  "id" integer PRIMARY KEY DEFAULT nextval('product_analytics_items_id_seq'::regclass) NOT NULL,
  "batch_id" integer NOT NULL REFERENCES "product_analytics_batches"("id") ON DELETE CASCADE,
  "rank_type" varchar(32) NOT NULL,
  "rank" integer NOT NULL,
  "product_id" text,
  "product_name" text NOT NULL,
  "product_image_url" text,
  "price_text" text,
  "region" varchar(32),
  "shop_name" text,
  "shop_image_url" text,
  "shop_sales" integer,
  "category" text,
  "commission_rate_text" text,
  "sales" integer,
  "sales_change_text" text,
  "total_sales" integer,
  "revenue_amount" numeric(14, 2),
  "total_revenue_amount" numeric(14, 2),
  "status" text,
  "listed_at_text" text,
  "fastmoss_product_url" text,
  "tiktok_product_url" text,
  "fastmoss_shop_url" text,
  "video_title" text,
  "video_url" text,
  "video_views" integer,
  "video_sales" integer,
  "video_total_sales" integer,
  "video_total_revenue_amount" numeric(14, 2),
  "total_views" integer,
  "total_likes" integer,
  "total_comments" integer,
  "raw_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "product_analytics_items_rank_type_check"
    CHECK ("rank_type" in ('sales', 'new', 'promoted', 'video-products')),
  CONSTRAINT "product_analytics_items_rank_check"
    CHECK ("rank" > 0),
  CONSTRAINT "product_analytics_items_product_name_check"
    CHECK (length(trim("product_name")) > 0)
);

CREATE INDEX "product_analytics_batches_rank_created_idx"
  ON "product_analytics_batches" ("rank_type", "created_at");
CREATE INDEX "product_analytics_active_batch_id_idx"
  ON "product_analytics_active_batches" ("batch_id");
CREATE INDEX "product_analytics_items_batch_rank_idx"
  ON "product_analytics_items" ("batch_id", "rank");
CREATE INDEX "product_analytics_items_rank_type_rank_idx"
  ON "product_analytics_items" ("rank_type", "rank");
CREATE INDEX "product_analytics_items_product_name_idx"
  ON "product_analytics_items" ("product_name");
CREATE INDEX "product_analytics_items_category_idx"
  ON "product_analytics_items" ("category");

ALTER SEQUENCE "product_analytics_batches_id_seq" OWNED BY "product_analytics_batches"."id";
ALTER SEQUENCE "product_analytics_items_id_seq" OWNED BY "product_analytics_items"."id";
