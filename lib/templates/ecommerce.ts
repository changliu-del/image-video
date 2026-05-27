import {
  type VideoAspectRatio,
  isVideoAspectRatio
} from '@/lib/providers/video/types';

export type EcommerceTemplateSlug = 'flash_sale';

export interface EcommerceTemplateInput {
  productName: string;
  headline?: string | null;
  sellingPoint?: string | null;
  priceText?: string | null;
  ctaText?: string | null;
  aspectRatio: VideoAspectRatio;
  durationSeconds: number;
  templateSlug?: EcommerceTemplateSlug | string | null;
}

export interface EcommerceOverlayText {
  headline: string;
  sellingPoint: string;
  priceText: string;
  ctaText: string;
}

export interface EcommercePromptTemplate {
  templateSlug: EcommerceTemplateSlug;
  prompt: string;
  negativePrompt: string;
  overlay: EcommerceOverlayText;
}

export function normalizeEcommerceTemplateSlug(
  slug: string | null | undefined
): EcommerceTemplateSlug {
  if (slug === 'flash_sale' || !slug) {
    return 'flash_sale';
  }

  return 'flash_sale';
}

export function buildEcommerceVideoPrompt(
  input: EcommerceTemplateInput
): EcommercePromptTemplate {
  const aspectRatio = assertAspectRatio(input.aspectRatio);
  const templateSlug = normalizeEcommerceTemplateSlug(input.templateSlug);
  const productName = cleanText(input.productName, 90) || 'the product';
  const sellingPoint =
    cleanText(input.sellingPoint, 140) ||
    `Showcase ${productName} with polished ecommerce styling.`;

  const overlay: EcommerceOverlayText = {
    headline: cleanText(input.headline, 42) || 'Flash Sale',
    sellingPoint,
    priceText: cleanText(input.priceText, 28),
    ctaText: cleanText(input.ctaText, 24) || 'Shop Now'
  };

  return {
    templateSlug,
    prompt: buildFlashSalePrompt({
      productName,
      sellingPoint,
      aspectRatio,
      durationSeconds: input.durationSeconds
    }),
    negativePrompt: [
      'readable text',
      'letters',
      'numbers',
      'price tags',
      'discount badges',
      'CTA buttons',
      'captions',
      'subtitles',
      'logos',
      'watermarks',
      'UI chrome',
      'distorted product',
      'extra products'
    ].join(', '),
    overlay
  };
}

function buildFlashSalePrompt(input: {
  productName: string;
  sellingPoint: string;
  aspectRatio: VideoAspectRatio;
  durationSeconds: number;
}) {
  return [
    `Create a premium ecommerce product video from the reference image for ${input.productName}.`,
    `Keep the exact product identity, shape, color, and packaging consistent with the image.`,
    `Use a ${input.aspectRatio} social-commerce composition with clean negative space for post-production overlays.`,
    `Use energetic flash-sale pacing, subtle camera motion, glossy highlights, and a polished studio background.`,
    `Visually suggest this selling point without rendering words: ${input.sellingPoint}.`,
    `The video should feel ready for a ${input.durationSeconds}-second paid social ad.`,
    'Do not render any readable text, numbers, prices, discount labels, CTA buttons, captions, logos, or watermarks; all commercial text will be added later in editing.'
  ].join(' ');
}

function assertAspectRatio(value: unknown): VideoAspectRatio {
  if (isVideoAspectRatio(value)) {
    return value;
  }

  return '9:16';
}

function cleanText(value: string | null | undefined, maxLength: number) {
  return (value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
