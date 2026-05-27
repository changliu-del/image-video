import { describe, expect, it } from 'vitest';

import {
  buildFalImageToVideoInput,
  getWanFrameCount,
} from '../lib/providers/video/fal-input';

const baseInput = {
  imageUrl: 'https://example.com/product.jpg',
  prompt: 'Premium product video',
  negativePrompt: 'blur, distortion',
  durationSeconds: 10,
  aspectRatio: '9:16',
} as const;

describe('buildFalImageToVideoInput', () => {
  it('uses frame-based duration fields for WAN v2.2 models', () => {
    const input = buildFalImageToVideoInput(
      'fal-ai/wan/v2.2-a14b/image-to-video/lora',
      baseInput
    );

    expect(input).toEqual(
      expect.objectContaining({
        image_url: baseInput.imageUrl,
        prompt: baseInput.prompt,
        negative_prompt: baseInput.negativePrompt,
        aspect_ratio: baseInput.aspectRatio,
        num_frames: 161,
        frames_per_second: 16,
      })
    );
    expect(input).not.toHaveProperty('duration');
    expect(input).not.toHaveProperty('duration_seconds');
  });

  it('maps supported MVP durations to fal frame counts', () => {
    expect(getWanFrameCount(5)).toBe(81);
    expect(getWanFrameCount(8)).toBe(129);
    expect(getWanFrameCount(10)).toBe(161);
  });

  it('uses duration for the default WAN v2.7 model without legacy duration_seconds', () => {
    const input = buildFalImageToVideoInput(
      'fal-ai/wan/v2.7/image-to-video',
      baseInput
    );

    expect(input).toEqual(
      expect.objectContaining({
        image_url: baseInput.imageUrl,
        prompt: baseInput.prompt,
        negative_prompt: baseInput.negativePrompt,
        duration: 10,
      })
    );
    expect(input).not.toHaveProperty('duration_seconds');
    expect(input).not.toHaveProperty('num_frames');
    expect(input).not.toHaveProperty('frames_per_second');
  });
});
