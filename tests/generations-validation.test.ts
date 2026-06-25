import { describe, expect, it } from 'vitest';

import {
  ALLOWED_UPLOAD_MIME_TYPES,
  IMAGE_TO_VIDEO_DURATION_SECONDS,
  IMAGE_TO_VIDEO_MAX_DURATION_SECONDS,
  IMAGE_TO_VIDEO_MIN_DURATION_SECONDS,
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
  inputAssetId: '123',
  prompt: 'Create a polished product video from the uploaded image.',
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
  it('defaults image-to-video to 5s and maps duration to credit cost', () => {
    const parsed = imageToVideoGenerationRequestSchema.parse(
      validImageToVideoRequest
    );

    expect(parsed.durationSeconds).toBe(IMAGE_TO_VIDEO_DURATION_SECONDS);
    expect(parsed.inputAssetIds).toEqual([validImageToVideoRequest.inputAssetId]);
    expect(getCreditCostForDuration(IMAGE_TO_VIDEO_DURATION_SECONDS)).toBe(10);
    expect(getCreditCostForGeneration(parsed)).toBe(10);
  });

  it('accepts 5-15s image-to-video durations and scales credit cost', () => {
    const tenSecondVideo = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      durationSeconds: 10,
    });
    const fifteenSecondVideo = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      durationSeconds: String(IMAGE_TO_VIDEO_MAX_DURATION_SECONDS),
    });

    expect(tenSecondVideo.durationSeconds).toBe(10);
    expect(fifteenSecondVideo.durationSeconds).toBe(
      IMAGE_TO_VIDEO_MAX_DURATION_SECONDS
    );
    expect(getCreditCostForGeneration(tenSecondVideo)).toBe(20);
    expect(getCreditCostForGeneration(fifteenSecondVideo)).toBe(30);
  });

  it('rejects image-to-video durations outside the 5-15s range', () => {
    expect(
      imageToVideoGenerationRequestSchema.safeParse({
        ...validImageToVideoRequest,
        durationSeconds: IMAGE_TO_VIDEO_MIN_DURATION_SECONDS - 1,
      }).success
    ).toBe(false);
    expect(
      imageToVideoGenerationRequestSchema.safeParse({
        ...validImageToVideoRequest,
        durationSeconds: IMAGE_TO_VIDEO_MAX_DURATION_SECONDS + 1,
      }).success
    ).toBe(false);
    expect(() =>
      getCreditCostForDuration(IMAGE_TO_VIDEO_MAX_DURATION_SECONDS + 1)
    ).toThrow(
      `Unsupported generation duration: ${IMAGE_TO_VIDEO_MAX_DURATION_SECONDS + 1}`
    );
  });

  it('accepts legacy 5s duration from old payloads', () => {
    const parsed = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      durationSeconds: String(IMAGE_TO_VIDEO_DURATION_SECONDS),
    });

    expect(parsed.durationSeconds).toBe(IMAGE_TO_VIDEO_DURATION_SECONDS);
    expect(getCreditCostForGeneration(parsed)).toBe(10);
  });

  it('supports the legacy image-to-video alias but normalizes to image_to_video', () => {
    const parsed = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      generationType: 'image-to-video',
    });

    expect(parsed.generationType).toBe('image_to_video');
  });

  it('accepts template metadata and defaults image-to-video to 5s', () => {
    const parsed = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      modelTemplateId: '789',
      templateId: '456',
      videoModelMode: 'wanxiang_2_7',
    });

    expect(parsed.prompt).toBe(validImageToVideoRequest.prompt);
    expect(parsed.templateId).toBe('456');
    expect(parsed.modelTemplateId).toBe('789');
    expect(parsed.videoModelMode).toBe('wanxiang_2_7');
    expect(parsed.durationSeconds).toBe(IMAGE_TO_VIDEO_DURATION_SECONDS);
  });

  it('requires a prompt for image-to-video generation', () => {
    const result = imageToVideoGenerationRequestSchema.safeParse({
      ...validImageToVideoRequest,
      prompt: '',
    });

    expect(result.success).toBe(false);
  });

  it('rejects unsupported image-to-video video and audio reference fields', () => {
    expect(
      imageToVideoGenerationRequestSchema.safeParse({
        ...validImageToVideoRequest,
        referenceVideoAssetIds: ['ref_video'],
      }).success
    ).toBe(false);
    expect(
      imageToVideoGenerationRequestSchema.safeParse({
        ...validImageToVideoRequest,
        referenceAudioAssetIds: ['ref_audio'],
      }).success
    ).toBe(false);
  });

  it('requires an input asset id and supports the inputAsset alias', () => {
    const missingAsset = imageToVideoGenerationRequestSchema.safeParse({
      ...validImageToVideoRequest,
      inputAssetId: undefined,
    });
    const aliasAsset = imageToVideoGenerationRequestSchema.parse({
      ...validImageToVideoRequest,
      inputAssetId: undefined,
      inputAsset: '124',
    });

    expect(missingAsset.success).toBe(false);
    expect(aliasAsset.inputAssetId).toBe('124');
    expect(aliasAsset.inputAssetIds).toEqual(['124']);
  });

  it('rejects multiple product images because the provider accepts one image', () => {
    const result = imageToVideoGenerationRequestSchema.safeParse({
      ...validImageToVideoRequest,
      inputAssetId: undefined,
      inputAssetIds: ['123', '124', '125'],
    });

    expect(result.success).toBe(false);
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
      inputAssetId: '123',
      prompt: 'Generate a clean studio apparel image.',
      aspectRatio: '1:1',
    });

    expect(parsed.generationType).toBe('apparel_image');
    expect(getCreditCostForGeneration(parsed)).toBe(5);
  });

  it('accepts workbench controls for apparel image requests', () => {
    const parsed = apparelImageGenerationRequestSchema.parse({
      generationType: 'apparel_image',
      inputAssetId: '123',
      prompt: 'Generate a clean studio apparel image.',
      templateId: '456',
      aspectRatio: '1:1',
      strength: '64',
      variants: 4,
    });

    expect(parsed.templateId).toBe('456');
    expect(parsed.strength).toBe(64);
    expect(parsed.variants).toBe(4);
  });

  it('requires the apparel_image discriminator', () => {
    const result = apparelImageGenerationRequestSchema.safeParse({
      inputAssetId: '123',
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
      modelAssetId: '201',
      garmentAssetId: '301',
    });

    expect(parsed.generationType).toBe('try_on');
    expect(parsed.tryOnMode).toBe('single');
    expect(parsed.inputAssetId).toBe('201');
    expect(parsed.garmentAssetIds).toEqual(['301']);
    expect(getCreditCostForGeneration(parsed)).toBe(5);
  });

  it('accepts mode as the try-on mode alias', () => {
    const parsed = tryOnGenerationRequestSchema.parse({
      generationType: 'try_on',
      mode: 'multi',
      inputAssetId: '201',
      garmentAssetIds: ['301', '302'],
    });

    expect(parsed.tryOnMode).toBe('multi');
    expect(parsed.modelAssetId).toBe('201');
    expect(getCreditCostForGeneration(parsed)).toBe(10);
  });

  it('accepts model templates for try-on requests', () => {
    const parsed = tryOnGenerationRequestSchema.parse({
      generationType: 'try_on',
      tryOnMode: 'single',
      modelTemplateId: '401',
      garmentAssetId: '301',
    });

    expect(parsed.modelTemplateId).toBe('401');
    expect(parsed.modelAssetId).toBeUndefined();
    expect(parsed.garmentAssetIds).toEqual(['301']);
  });

  it('requires at least two garments for multi try-on', () => {
    const result = tryOnGenerationRequestSchema.safeParse({
      generationType: 'try_on',
      tryOnMode: 'multi',
      modelAssetId: '201',
      garmentAssetIds: ['301'],
    });

    expect(result.success).toBe(false);
  });

  it('accepts workbench metadata on try-on requests', () => {
    const parsed = tryOnGenerationRequestSchema.parse({
      generationType: 'try_on',
      tryOnMode: 'single',
      modelAssetId: '201',
      garmentAssetId: '301',
      prompt: '',
      aspectRatio: '9:16',
      templateId: '456',
    });

    expect(parsed.prompt).toBeUndefined();
    expect(parsed.aspectRatio).toBe('9:16');
    expect(parsed.templateId).toBe('456');
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
        inputAssetId: '123',
      }).generationType
    ).toBe('apparel_image');
    expect(
      generationApiRequestSchema.parse({
        generationType: 'try_on',
        modelAssetId: '201',
        garmentAssetId: '301',
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
      inputAssetId: '123',
      prompt: 'x'.repeat(MAX_TEXT_TO_IMAGE_PROMPT_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});
