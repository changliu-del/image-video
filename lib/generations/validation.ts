import { z } from 'zod';
import {
  MAX_TEXT_TO_IMAGE_PROMPT_LENGTH,
  MAX_UPLOAD_SIZE_BYTES,
} from './constants';
import {
  IMAGE_TO_VIDEO_CREDIT_COST,
  IMAGE_TO_VIDEO_DURATION_SECONDS,
  getApparelImageCreditCost,
  getCreditCostForDuration,
  getTryOnCreditCost,
} from './credit-costs';
import { dbIdStringSchema } from '../db/id-schema';

export {
  MAX_CTA_TEXT_LENGTH,
  MAX_HEADLINE_LENGTH,
  MAX_PRICE_TEXT_LENGTH,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_SELLING_POINT_LENGTH,
  MAX_TEXT_TO_IMAGE_PROMPT_LENGTH,
  MAX_UPLOAD_SIZE_BYTES,
} from './constants';
export {
  IMAGE_TO_VIDEO_CREDIT_COST,
  IMAGE_TO_VIDEO_DURATION_SECONDS,
  getApparelImageCreditCost,
  getCreditCostForDuration,
  getTryOnCreditCost,
} from './credit-costs';

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
] as const;

export type UploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export const UPLOAD_MIME_EXTENSIONS: Record<UploadMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
};

export const VIDEO_ASPECT_RATIOS = ['9:16', '3:4', '1:1', '16:9'] as const;
export type VideoAspectRatio = (typeof VIDEO_ASPECT_RATIOS)[number];

export const GENERATION_TYPES = [
  'image_to_video',
  'apparel_image',
  'try_on',
] as const;
export type GenerationType = (typeof GENERATION_TYPES)[number];

export const TRY_ON_MODES = ['single', 'multi'] as const;
export type TryOnMode = (typeof TRY_ON_MODES)[number];

export const idStringSchema = dbIdStringSchema;

const cleanPromptField = z
  .string()
  .trim()
  .min(1, 'Prompt is required')
  .max(MAX_TEXT_TO_IMAGE_PROMPT_LENGTH, 'Prompt is too long');

const optionalCleanPromptField = z.preprocess(
  (value) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  cleanPromptField.optional()
);

const legacyImageToVideoDurationSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }

    return value;
  },
  z.literal(IMAGE_TO_VIDEO_DURATION_SECONDS)
);

const assetIdArraySchema = z.array(idStringSchema).min(1).max(8);
const singleAssetIdArraySchema = z.array(idStringSchema).min(1).max(1);

const apparelStrengthSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }

    return value;
  },
  z.number().int().min(0).max(100)
);

const apparelVariantsSchema = z.preprocess(
  (value) => {
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return Number(value);
    }

    return value;
  },
  z.number().int().min(1).max(8)
);

const generationTypeInputSchema = z
  .enum(['image_to_video', 'image-to-video', 'apparel_image', 'try_on'])
  .transform((value) =>
    value === 'image-to-video' ? 'image_to_video' : value
  );

const generationModeInputSchema = z
  .enum([
    'image_to_video',
    'image-to-video',
    'apparel_image',
    'try_on',
    'single',
    'multi',
  ])
  .transform((value) =>
    value === 'image-to-video' ? 'image_to_video' : value
  );

const baseGenerationFields = {
  generationType: generationTypeInputSchema.optional(),
  mode: generationModeInputSchema.optional(),
  templateId: idStringSchema.optional(),
};

function assertMatchingGenerationMode(
  value: {
    generationType?: GenerationType;
    mode?: GenerationType | TryOnMode;
  },
  context: z.RefinementCtx
) {
  if (
    value.generationType &&
    value.mode &&
    value.mode !== 'single' &&
    value.mode !== 'multi' &&
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

export const imageToVideoGenerationRequestSchema = z
  .object({
    ...baseGenerationFields,
    inputAssetId: idStringSchema.optional(),
    inputAssetIds: singleAssetIdArraySchema.optional(),
    inputAsset: idStringSchema.optional(),
    prompt: cleanPromptField,
    durationSeconds: legacyImageToVideoDurationSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    assertMatchingGenerationMode(value, context);

    const requestedType = value.generationType ?? value.mode ?? 'image_to_video';
    if (requestedType !== 'image_to_video') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Use the matching request shape for this generation type',
        path: [value.generationType ? 'generationType' : 'mode'],
      });
    }

    if (!value.inputAssetId && !value.inputAsset && !value.inputAssetIds?.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'inputAssetId is required',
        path: ['inputAssetId'],
      });
    }

    const explicitInputAssetId = value.inputAssetId ?? value.inputAsset;
    if (
      explicitInputAssetId &&
      value.inputAssetIds?.length &&
      value.inputAssetIds[0] !== explicitInputAssetId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'image_to_video supports one input image',
        path: ['inputAssetIds'],
      });
    }
  })
  .transform(
    ({ generationType, inputAsset, inputAssetId, inputAssetIds, mode, ...value }) => {
      const primaryInputAssetId = inputAssetId ?? inputAsset ?? inputAssetIds![0];
      const normalizedInputAssetIds = Array.from(
        new Set([primaryInputAssetId, ...(inputAssetIds ?? [])])
      );

      return {
        ...value,
        durationSeconds: IMAGE_TO_VIDEO_DURATION_SECONDS,
        generationType: 'image_to_video' as const,
        inputAssetId: primaryInputAssetId,
        inputAssetIds: normalizedInputAssetIds,
      };
    }
  );

export const apparelImageGenerationRequestSchema = z
  .object({
    ...baseGenerationFields,
    inputAssetId: idStringSchema.optional(),
    inputAsset: idStringSchema.optional(),
    prompt: optionalCleanPromptField,
    aspectRatio: z.enum(VIDEO_ASPECT_RATIOS).optional(),
    strength: apparelStrengthSchema.optional(),
    variants: apparelVariantsSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    assertMatchingGenerationMode(value, context);

    const requestedType = value.generationType ?? value.mode;
    if (requestedType !== 'apparel_image') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'generationType must be apparel_image',
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
    generationType: 'apparel_image' as const,
    inputAssetId: inputAssetId ?? inputAsset!,
  }));

export const tryOnGenerationRequestSchema = z
  .object({
    ...baseGenerationFields,
    tryOnMode: z.enum(TRY_ON_MODES).optional(),
    modelAssetId: idStringSchema.optional(),
    modelTemplateId: idStringSchema.optional(),
    inputAssetId: idStringSchema.optional(),
    garmentAssetId: idStringSchema.optional(),
    garmentAssetIds: z.array(idStringSchema).min(1).max(8).optional(),
    prompt: optionalCleanPromptField,
    aspectRatio: z.enum(VIDEO_ASPECT_RATIOS).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    assertMatchingGenerationMode(value, context);

    const mode = value.tryOnMode ?? value.mode;
    const requestedType =
      value.generationType ?? (mode === 'single' || mode === 'multi' ? 'try_on' : value.mode);

    if (requestedType !== 'try_on') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'generationType must be try_on',
        path: [value.generationType ? 'generationType' : 'mode'],
      });
    }

    if (!value.modelAssetId && !value.inputAssetId && !value.modelTemplateId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'modelAssetId or modelTemplateId is required',
        path: ['modelTemplateId'],
      });
    }

    const tryOnMode = mode === 'multi' ? 'multi' : 'single';
    if (tryOnMode === 'single') {
      if (!value.garmentAssetId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'garmentAssetId is required for single try-on',
          path: ['garmentAssetId'],
        });
      }
    } else if (!value.garmentAssetIds || value.garmentAssetIds.length < 2) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'garmentAssetIds must include at least two assets for multi try-on',
        path: ['garmentAssetIds'],
      });
    }
  })
  .transform(({ generationType, inputAssetId, mode, tryOnMode, ...value }) => {
    const normalizedTryOnMode =
      tryOnMode ?? (mode === 'multi' ? 'multi' : 'single');
    const garmentAssetIds =
      normalizedTryOnMode === 'single'
        ? [value.garmentAssetId!]
        : value.garmentAssetIds!;
    const modelAssetId = value.modelAssetId ?? inputAssetId;

    return {
      ...value,
      generationType: 'try_on' as const,
      tryOnMode: normalizedTryOnMode,
      modelAssetId,
      inputAssetId: modelAssetId ?? garmentAssetIds[0],
      garmentAssetIds,
    };
  });

export const generationRequestSchema = z.union([
  imageToVideoGenerationRequestSchema,
  apparelImageGenerationRequestSchema,
  tryOnGenerationRequestSchema,
]);

export const generationApiRequestSchema = generationRequestSchema;

export type PresignAssetRequest = z.infer<typeof presignAssetRequestSchema>;
export type CompleteAssetRequest = z.infer<typeof completeAssetRequestSchema>;
export type ImageToVideoGenerationRequest = z.infer<
  typeof imageToVideoGenerationRequestSchema
>;
export type ApparelImageGenerationRequest = z.infer<
  typeof apparelImageGenerationRequestSchema
>;
export type TryOnGenerationRequest = z.infer<typeof tryOnGenerationRequestSchema>;
export type GenerationRequest = z.infer<typeof generationRequestSchema>;
export type GenerationApiRequest = z.infer<typeof generationApiRequestSchema>;

export function getCreditCostForGeneration(generation: GenerationRequest) {
  switch (generation.generationType) {
    case 'image_to_video':
      return IMAGE_TO_VIDEO_CREDIT_COST;
    case 'apparel_image':
      return getApparelImageCreditCost();
    case 'try_on':
      return getTryOnCreditCost(generation.tryOnMode);
  }
}
