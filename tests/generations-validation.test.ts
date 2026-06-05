import { describe, expect, it } from 'vitest';

import {
  ALLOWED_UPLOAD_MIME_TYPES,
  GENERATION_DURATIONS_SECONDS,
  MAX_TEXT_TO_IMAGE_PROMPT_LENGTH,
  MAX_UPLOAD_SIZE_BYTES,
  apparelImageGenerationRequestSchema,
  generationApiRequestSchema,
  getCreditCostForDuration,
  getCreditCostForGeneration,
  imageToVideoGenerationRequestSchema,
  presignAssetRequestSchema,
  tryOnGenerationRequestSchema,
} from '../lib/generations/validation';

const validImageToVideoRequest = {
  generationType: 'image_to_video',
  inputAssetId: 'asset_123',
  prompt: 'Create a polished product video from the uploaded image.',
  aspectRatio: '9:16',
  durationSeconds: 5,
} as const;

describe('presignAssetRequestSchema', () => {
  it('allows the supported upload mime types at the 10 MB limit', () => {
    for (const mimeType of ALLOWED_UPLOAD_MIME_TYPES) {
      const parsed = presignAssetRequestSchema.parse({
        fileName: 'product-image',
        mimeType,
        sizeBytes: MAX_UPLOAD_SIZE_BYTES,
      });

      expect(parsed.mimeType).toBe(mimeType);
      expect(parsed.sizeBytes).toBe(MAX_UPLOAD_SIZE_BYTES);
    }
  });

  it('rejects unsupported upload mime types', () => {
    const result = presignAssetRequestSchema.safeParse({
      fileName: 'product.gif',
      mimeType: 'image/gif',
      sizeBytes: 1024,
    });

    expect(result.success).toBe(false);
  });

  it('rejects uploads larger than 10 MB', () => {
    const result = presignAssetRequestSchema.safeParse({
      fileName: 'product.png',
      mimeType: 'image/png',
      sizeBytes: MAX_UPLOAD_SIZE_BYTES + 1,
    });

    expect(result.success).toBe(false);
  });
});

describe('imageToVideoGenerationRequestSchema', () => {
  it('accepts supported generation durations and maps them to credit costs', () => {
    const expectedCosts = new Map([
      [5, 10],
      [8, 18],
      [10, 25],
    ] as const);

    for (const durationSeconds of GENERATION_DURATIONS_SECONDS) {
      const parsed = imageToVideoGenerationRequestSchema.parse({
        ...validImageToVideoRequest,
        durationSeconds,
      });

      expect(parsed.durationSeconds).toBe(durationSeconds);
      expect(getCreditCostForDuration(durationSeconds)).toBe(
        expectedCosts.get(durationSeconds)
      );
      expect(getCreditCostForGeneration(parsed)).toBe(
        expectedCosts.get(durationSeconds)
      );
    }
  });

  it('coerces string durations from form payloads', () => {
    const parsed = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      durationSeconds: '8',
    });

    expect(parsed.durationSeconds).toBe(8);
    expect(getCreditCostForGeneration(parsed)).toBe(18);
  });

  it('supports the legacy image-to-video alias but normalizes to image_to_video', () => {
    const parsed = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      generationType: 'image-to-video',
    });

    expect(parsed.generationType).toBe('image_to_video');
  });

  it('accepts optional workbench fields and treats an empty prompt as omitted', () => {
    const parsed = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      prompt: '',
      templateId: 'template_123',
    });

    expect(parsed.prompt).toBeUndefined();
    expect(parsed.templateId).toBe('template_123');
  });

  it('requires an input asset id and supports the inputAsset alias', () => {
    const missingAsset = imageToVideoGenerationRequestSchema.safeParse({
      ...validImageToVideoRequest,
      inputAssetId: undefined,
    });
    const aliasAsset = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      inputAssetId: undefined,
      inputAsset: 'asset_from_alias',
    });

    expect(missingAsset.success).toBe(false);
    expect(aliasAsset.inputAssetId).toBe('asset_from_alias');
  });

  it('rejects mismatched generation type and mode aliases', () => {
    const result = imageToVideoGenerationRequestSchema.safeParse({
      ...validImageToVideoRequest,
      generationType: 'image_to_video',
      mode: 'apparel_image',
    });

    expect(result.success).toBe(false);
  });
});

describe('apparelImageGenerationRequestSchema', () => {
  it('accepts apparel image requests', () => {
    const parsed = apparelImageGenerationRequestSchema.parse({
      generationType: 'apparel_image',
      inputAssetId: 'asset_123',
      prompt: 'Generate a clean studio apparel image.',
      aspectRatio: '1:1',
    });

    expect(parsed.generationType).toBe('apparel_image');
    expect(getCreditCostForGeneration(parsed)).toBe(5);
  });

  it('accepts workbench controls for apparel image requests', () => {
    const parsed = apparelImageGenerationRequestSchema.parse({
      generationType: 'apparel_image',
      inputAssetId: 'asset_123',
      prompt: 'Generate a clean studio apparel image.',
      templateId: 'template_123',
      aspectRatio: '1:1',
      strength: '64',
      variants: 4,
    });

    expect(parsed.templateId).toBe('template_123');
    expect(parsed.strength).toBe(64);
    expect(parsed.variants).toBe(4);
  });

  it('requires the apparel_image discriminator', () => {
    const result = apparelImageGenerationRequestSchema.safeParse({
      inputAssetId: 'asset_123',
      prompt: 'Generate a clean studio apparel image.',
    });

    expect(result.success).toBe(false);
  });
});

describe('tryOnGenerationRequestSchema', () => {
  it('accepts single try-on requests', () => {
    const parsed = tryOnGenerationRequestSchema.parse({
      generationType: 'try_on',
      tryOnMode: 'single',
      modelAssetId: 'model_asset',
      garmentAssetId: 'garment_asset',
    });

    expect(parsed.generationType).toBe('try_on');
    expect(parsed.tryOnMode).toBe('single');
    expect(parsed.inputAssetId).toBe('model_asset');
    expect(parsed.garmentAssetIds).toEqual(['garment_asset']);
    expect(getCreditCostForGeneration(parsed)).toBe(5);
  });

  it('accepts mode as the try-on mode alias', () => {
    const parsed = tryOnGenerationRequestSchema.parse({
      generationType: 'try_on',
      mode: 'multi',
      inputAssetId: 'model_asset',
      garmentAssetIds: ['top_asset', 'bottom_asset'],
    });

    expect(parsed.tryOnMode).toBe('multi');
    expect(parsed.modelAssetId).toBe('model_asset');
    expect(getCreditCostForGeneration(parsed)).toBe(10);
  });

  it('requires at least two garments for multi try-on', () => {
    const result = tryOnGenerationRequestSchema.safeParse({
      generationType: 'try_on',
      tryOnMode: 'multi',
      modelAssetId: 'model_asset',
      garmentAssetIds: ['top_asset'],
    });

    expect(result.success).toBe(false);
  });

  it('accepts workbench metadata on try-on requests', () => {
    const parsed = tryOnGenerationRequestSchema.parse({
      generationType: 'try_on',
      tryOnMode: 'single',
      modelAssetId: 'model_asset',
      garmentAssetId: 'garment_asset',
      prompt: '',
      aspectRatio: '9:16',
      templateId: 'template_123',
    });

    expect(parsed.prompt).toBeUndefined();
    expect(parsed.aspectRatio).toBe('9:16');
    expect(parsed.templateId).toBe('template_123');
  });
});

describe('generationApiRequestSchema', () => {
  it('accepts all supported generation types', () => {
    expect(
      generationApiRequestSchema.parse(validImageToVideoRequest).generationType
    ).toBe('image_to_video');
    expect(
      generationApiRequestSchema.parse({
        generationType: 'apparel_image',
        inputAssetId: 'asset_123',
      }).generationType
    ).toBe('apparel_image');
    expect(
      generationApiRequestSchema.parse({
        generationType: 'try_on',
        modelAssetId: 'model_asset',
        garmentAssetId: 'garment_asset',
      }).generationType
    ).toBe('try_on');
  });

  it('rejects removed text-to-image requests', () => {
    const result = generationApiRequestSchema.safeParse({
      generationType: 'text-to-image',
      prompt: 'Minimal product render on a neutral background',
    });

    expect(result.success).toBe(false);
  });

  it('enforces prompt length where prompts are accepted', () => {
    const result = generationApiRequestSchema.safeParse({
      generationType: 'apparel_image',
      inputAssetId: 'asset_123',
      prompt: 'x'.repeat(MAX_TEXT_TO_IMAGE_PROMPT_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});
