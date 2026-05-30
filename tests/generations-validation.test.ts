import { describe, expect, it } from 'vitest';

import {
  ALLOWED_UPLOAD_MIME_TYPES,
  GENERATION_DURATIONS_SECONDS,
  MAX_SELLING_POINT_LENGTH,
  MAX_TEXT_TO_IMAGE_PROMPT_LENGTH,
  MAX_UPLOAD_SIZE_BYTES,
  generationApiRequestSchema,
  generationRequestSchema,
  getCreditCostForDuration,
  presignAssetRequestSchema,
} from '../lib/generations/validation';

const validGenerationRequest = {
  inputAssetId: 'asset_123',
  productName: 'Velvet Matte Lipstick',
  headline: 'New Arrival',
  sellingPoint: 'Long-lasting color with a soft matte finish',
  priceText: '$19.99',
  ctaText: 'Shop Now',
  aspectRatio: '9:16',
  durationSeconds: 5,
  templateSlug: 'flash_sale',
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

describe('generationRequestSchema', () => {
  it('accepts supported generation durations and maps them to credit costs', () => {
    const expectedCosts = new Map([
      [5, 10],
      [8, 18],
      [10, 25],
    ] as const);

    for (const durationSeconds of GENERATION_DURATIONS_SECONDS) {
      const parsed = generationRequestSchema.parse({
        ...validGenerationRequest,
        durationSeconds,
      });

      expect(parsed.durationSeconds).toBe(durationSeconds);
      expect(getCreditCostForDuration(durationSeconds)).toBe(
        expectedCosts.get(durationSeconds)
      );
    }
  });

  it('coerces string durations from form payloads', () => {
    const parsed = generationRequestSchema.parse({
      ...validGenerationRequest,
      durationSeconds: '8',
    });

    expect(parsed.durationSeconds).toBe(8);
    expect(getCreditCostForDuration(parsed.durationSeconds)).toBe(18);
  });

  it('rejects unsupported generation durations', () => {
    const result = generationRequestSchema.safeParse({
      ...validGenerationRequest,
      durationSeconds: 12,
    });

    expect(result.success).toBe(false);
  });

  it('accepts long commercial prompts as the core selling point', () => {
    const sellingPoint = [
      'Use the uploaded product as the only hero object.',
      'Keep the product shape, logo, material, color, and proportions unchanged.',
      'Create cinematic lighting, smooth camera motion, premium ecommerce styling, sharp details, and realistic product rendering.',
      'Avoid extra products, readable text, deformation, blur, low resolution, cartoon styling, and cluttered backgrounds.',
    ].join(' ');

    expect(sellingPoint.length).toBeGreaterThan(280);
    expect(sellingPoint.length).toBeLessThan(MAX_SELLING_POINT_LENGTH);

    const parsed = generationRequestSchema.parse({
      ...validGenerationRequest,
      sellingPoint,
    });

    expect(parsed.sellingPoint).toBe(sellingPoint);
  });

  it('requires an input asset id and supports the legacy inputAsset alias', () => {
    const missingAsset = generationRequestSchema.safeParse({
      ...validGenerationRequest,
      inputAssetId: undefined,
    });
    const aliasAsset = generationRequestSchema.parse({
      ...validGenerationRequest,
      inputAssetId: undefined,
      inputAsset: 'asset_from_alias',
    });

    expect(missingAsset.success).toBe(false);
    expect(aliasAsset.inputAssetId).toBe('asset_from_alias');
  });

  it('accepts explicit image-to-video generation type and mode aliases', () => {
    const withGenerationType = generationRequestSchema.parse({
      ...validGenerationRequest,
      generationType: 'image-to-video',
    });
    const withMode = generationRequestSchema.parse({
      ...validGenerationRequest,
      mode: 'image-to-video',
    });

    expect(withGenerationType.generationType).toBe('image-to-video');
    expect(withMode.generationType).toBe('image-to-video');
  });

  it('rejects mismatched generation type and mode aliases', () => {
    const result = generationRequestSchema.safeParse({
      ...validGenerationRequest,
      generationType: 'image-to-video',
      mode: 'text-to-image',
    });

    expect(result.success).toBe(false);
  });
});

describe('generationApiRequestSchema', () => {
  it('accepts text-to-image requests when generation type is explicit', () => {
    const prompt =
      'A clean ecommerce hero image of a stainless steel bottle on a blue studio background';
    const parsed = generationApiRequestSchema.parse({
      generationType: 'text-to-image',
      prompt,
      aspectRatio: '1:1',
    });

    expect(parsed.generationType).toBe('text-to-image');
    if (parsed.generationType !== 'text-to-image') {
      throw new Error('Expected text-to-image request');
    }
    expect(parsed.prompt).toBe(prompt);
  });

  it('accepts mode as the text-to-image discriminator', () => {
    const parsed = generationApiRequestSchema.parse({
      mode: 'text-to-image',
      prompt: 'Minimal product render on a neutral background',
    });

    expect(parsed.generationType).toBe('text-to-image');
    if (parsed.generationType !== 'text-to-image') {
      throw new Error('Expected text-to-image request');
    }
    expect(parsed.aspectRatio).toBe('1:1');
  });

  it('enforces the text-to-image prompt length limit', () => {
    const result = generationApiRequestSchema.safeParse({
      generationType: 'text-to-image',
      prompt: 'x'.repeat(MAX_TEXT_TO_IMAGE_PROMPT_LENGTH + 1),
    });

    expect(result.success).toBe(false);
  });
});
