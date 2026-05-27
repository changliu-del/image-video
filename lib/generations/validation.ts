import { z } from 'zod';

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type UploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export const UPLOAD_MIME_EXTENSIONS: Record<UploadMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export const VIDEO_ASPECT_RATIOS = ['9:16', '1:1', '16:9'] as const;
export type VideoAspectRatio = (typeof VIDEO_ASPECT_RATIOS)[number];

export const GENERATION_DURATIONS_SECONDS = [5, 8, 10] as const;
export type GenerationDurationSeconds =
  (typeof GENERATION_DURATIONS_SECONDS)[number];

export const TEMPLATE_SLUGS = [
  'flash_sale',
  'new_arrival',
  'best_seller',
] as const;
export type TemplateSlug = (typeof TEMPLATE_SLUGS)[number];

export const idStringSchema = z.preprocess(
  (value) => (typeof value === 'number' ? String(value) : value),
  z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/)
);

const cleanTextField = (maxLength: number) =>
  z.string().trim().min(1).max(maxLength);

const durationSecondsSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }

    return value;
  },
  z.union([z.literal(5), z.literal(8), z.literal(10)])
);

export const presignAssetRequestSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
    sizeBytes: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
  })
  .strict();

export const completeAssetRequestSchema = z
  .object({
    assetId: idStringSchema,
    storageKey: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .regex(/^[A-Za-z0-9/_\-.]+$/),
  })
  .strict();

export const generationRequestSchema = z
  .object({
    inputAssetId: idStringSchema.optional(),
    inputAsset: idStringSchema.optional(),
    productName: cleanTextField(120),
    headline: cleanTextField(100),
    sellingPoint: cleanTextField(280),
    priceText: cleanTextField(64),
    ctaText: cleanTextField(40),
    aspectRatio: z.enum(VIDEO_ASPECT_RATIOS),
    durationSeconds: durationSecondsSchema,
    templateSlug: z.enum(TEMPLATE_SLUGS),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.inputAssetId && !value.inputAsset) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'inputAssetId is required',
        path: ['inputAssetId'],
      });
    }
  })
  .transform(({ inputAsset, inputAssetId, ...value }) => ({
    ...value,
    inputAssetId: inputAssetId ?? inputAsset!,
  }));

export type PresignAssetRequest = z.infer<typeof presignAssetRequestSchema>;
export type CompleteAssetRequest = z.infer<typeof completeAssetRequestSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;

export function getCreditCostForDuration(
  durationSeconds: GenerationDurationSeconds
) {
  switch (durationSeconds) {
    case 5:
      return 10;
    case 8:
      return 18;
    case 10:
      return 25;
  }
}
