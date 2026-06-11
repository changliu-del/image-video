ALTER TABLE "templates"
  DROP CONSTRAINT IF EXISTS "templates_type_check";

ALTER TABLE "templates"
  ADD CONSTRAINT "templates_type_check"
    CHECK ("type" IN ('image_to_video', 'image_to_image', 'model', 'try_on'));
