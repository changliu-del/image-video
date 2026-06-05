ALTER TABLE "template_tag_relations" DROP CONSTRAINT IF EXISTS "template_tag_relations_template_id_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "template_assets" DROP CONSTRAINT IF EXISTS "template_assets_template_id_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "template_audit_logs" DROP CONSTRAINT IF EXISTS "template_audit_logs_template_id_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "template_tag_relations"
  ADD CONSTRAINT "template_tag_relations_template_id_templates_id_fk"
  FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "template_assets"
  ADD CONSTRAINT "template_assets_template_id_templates_id_fk"
  FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id")
  ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "template_audit_logs"
  ADD CONSTRAINT "template_audit_logs_template_id_templates_id_fk"
  FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id")
  ON DELETE set null ON UPDATE no action;
