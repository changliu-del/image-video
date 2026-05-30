import { z } from 'zod';
import {
  MAX_CTA_TEXT_LENGTH,
  MAX_HEADLINE_LENGTH,
  MAX_PRICE_TEXT_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_SELLING_POINT_LENGTH,
  MAX_TEXT_TO_IMAGE_PROMPT_LENGTH,
  MAX_UPLOAD_SIZE_BYTES,
} from './constants';

export {
  MAX_CTA_TEXT_LENGTH,
  MAX_HEADLINE_LENGTH,
  MAX_PRICE_TEXT_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_SELLING_POINT_LENGTH,
  MAX_TEXT_TO_IMAGE_PROMPT_LENGTH,
  MAX_UPLOAD_SIZE_BYTES,
} from './constants';

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

export const GENERATION_TYPES = ['image-to-video', 'text-to-image'] as const;
export type GenerationType = (typeof GENERATION_TYPES)[number];

export const idStringSchema = z.preprocess(
  (value) => (typeof value === 'number' ? String(value) : value),
  z
    .string()
    .trim()
    .min(1)
    .max(128)
    .regex(/^[A-Za-z0-9_-]+$/)
);

const cleanTextField = (maxLength: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} must be ${maxLength} characters or fewer`);

const durationSecondsSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }

    return value;
  },
  z.union([z.literal(5), z.literal(8), z.literal(10)])
);

const generationTypeSchema = z.enum(GENERATION_TYPES);

const generationModeFields = {
  generationType: generationTypeSchema.optional(),
  mode: generationTypeSchema.optional(),
};

function addMismatchedModeIssue(
  value: {
    generationType?: GenerationType;
    mode?: GenerationType;
  },
  context: z.RefinementCtx
) {
  if (
    value.generationType &&
    value.mode &&
    value.generationType !== value.mode
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'generationType and mode must match',
      path: ['mode'],
    });
  }
}

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
    ...generationModeFields,
    inputAssetId: idStringSchema.optional(),
    inputAsset: idStringSchema.optional(),
    productName: cleanTextField(MAX_PRODUCT_NAME_LENGTH, 'Product name'),
    headline: cleanTextField(MAX_HEADLINE_LENGTH, 'Headline'),
    sellingPoint: cleanTextField(
      MAX_SELLING_POINT_LENGTH,
      'Core selling point'
    ),
    priceText: cleanTextField(MAX_PRICE_TEXT_LENGTH, 'Price'),
    ctaText: cleanTextField(MAX_CTA_TEXT_LENGTH, 'CTA'),
    aspectRatio: z.enum(VIDEO_ASPECT_RATIOS),
    durationSeconds: durationSecondsSchema,
    templateSlug: z.enum(TEMPLATE_SLUGS),
  })
  .strict()
  .superRefine((value, context) => {
    addMismatchedModeIssue(value, context);

    const requestedType = value.generationType ?? value.mode ?? 'image-to-video';

    if (requestedType !== 'image-to-video') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Use the text-to-image request shape for text-to-image generations',
        path: [value.generationType ? 'generationType' : 'mode'],
      });
    }

    if (!value.inputAssetId && !value.inputAsset) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'inputAssetId is required',
        path: ['inputAssetId'],
      });
    }
  })
  .transform(({ generationType, inputAsset, inputAssetId, mode, ...value }) => ({
    ...value,
    generationType: 'image-to-video' as const,
    inputAssetId: inputAssetId ?? inputAsset!,
  }));

export const textToImageGenerationRequestSchema = z
  .object({
    generationType: z.literal('text-to-image').optional(),
    mode: z.literal('text-to-image').optional(),
    prompt: cleanTextField(MAX_TEXT_TO_IMAGE_PROMPT_LENGTH, 'Prompt'),
    aspectRatio: z.enum(VIDEO_ASPECT_RATIOS).optional().default('1:1'),
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.generationType && !value.mode) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'generationType or mode is required',
        path: ['generationType'],
      });
    }
  })
  .transform(({ generationType, mode, ...value }) => ({
    ...value,
    generationType: 'text-to-image' as const,
  }));

export const generationApiRequestSchema = z.union([
  generationRequestSchema,
  textToImageGenerationRequestSchema,
]);

export type PresignAssetRequest = z.infer<typeof presignAssetRequestSchema>;
export type CompleteAssetRequest = z.infer<typeof completeAssetRequestSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type TextToImageGenerationRequest = z.infer<
  typeof textToImageGenerationRequestSchema
>;
export type GenerationApiRequest = z.infer<typeof generationApiRequestSchema>;

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
