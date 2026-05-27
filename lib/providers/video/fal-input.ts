import type { ImageToVideoCreateJobInput } from './types';

const WAN_FRAME_MODEL_FPS = 16;
const WAN_FRAME_MODEL_MIN_FRAMES = 17;
const WAN_FRAME_MODEL_MAX_FRAMES = 161;

type FalImageToVideoInput = Record<string, unknown>;

export function buildFalImageToVideoInput(
  model: string,
  input: ImageToVideoCreateJobInput
): FalImageToVideoInput {
  const baseInput = {
    image_url: input.imageUrl,
    prompt: input.prompt,
    negative_prompt: input.negativePrompt,
    aspect_ratio: input.aspectRatio
  };

  if (usesWanFrameDuration(model)) {
    return {
      ...baseInput,
      num_frames: getWanFrameCount(input.durationSeconds),
      frames_per_second: WAN_FRAME_MODEL_FPS,
      ...input.metadata
    };
  }

  return {
    ...baseInput,
    duration: input.durationSeconds,
    ...input.metadata
  };
}

export function getWanFrameCount(durationSeconds: number) {
  const frameCount = Math.round(durationSeconds * WAN_FRAME_MODEL_FPS) + 1;
  return Math.min(
    WAN_FRAME_MODEL_MAX_FRAMES,
    Math.max(WAN_FRAME_MODEL_MIN_FRAMES, frameCount)
  );
}

function usesWanFrameDuration(model: string) {
  return model.toLowerCase().includes('wan/v2.2');
}
