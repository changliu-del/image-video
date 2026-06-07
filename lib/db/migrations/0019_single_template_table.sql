ALTER TABLE "templates"
  ADD COLUMN IF NOT EXISTS "tags_json" jsonb NOT NULL DEFAULT '[]'::jsonb;
--> statement-breakpoint
DO $$ BEGIN
  IF to_regclass('public.template_tag_relations') IS NOT NULL
    AND to_regclass('public.template_tags') IS NOT NULL
  THEN
    UPDATE "templates" t
    SET "tags_json" = COALESCE(
      (
        SELECT jsonb_agg(tag_rows.slug)
        FROM (
          SELECT DISTINCT tt.slug
          FROM "template_tag_relations" ttr
          INNER JOIN "template_tags" tt ON tt.id = ttr.tag_id
          WHERE ttr.template_id = t.id
          ORDER BY tt.slug
        ) tag_rows
      ),
      '[]'::jsonb
    )
    WHERE t."tags_json" = '[]'::jsonb;
  END IF;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "template_source_records";
--> statement-breakpoint
DROP TABLE IF EXISTS "template_ingestion_runs";
--> statement-breakpoint
DROP TABLE IF EXISTS "template_audit_logs";
--> statement-breakpoint
DROP TABLE IF EXISTS "template_assets";
--> statement-breakpoint
DROP TABLE IF EXISTS "template_tag_relations";
--> statement-breakpoint
DROP TABLE IF EXISTS "template_tags";
