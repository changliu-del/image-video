import { task } from '@trigger.dev/sdk';

import { runGenerationJob } from '@/lib/generations/runner';

const GENERATE_VIDEO_MAX_ATTEMPTS = 3;

export const generateVideo = task({
  id: 'generate-video',
  retry: {
    maxAttempts: GENERATE_VIDEO_MAX_ATTEMPTS,
    factor: 2,
    minTimeoutInMs: 10_000,
    maxTimeoutInMs: 120_000,
    randomize: true
  },
  run: async (payload: { jobId: string }, { ctx }) => {
    return await runGenerationJob(payload, {
      attemptNumber: ctx.attempt.number,
      maxAttempts: ctx.run.maxAttempts ?? GENERATE_VIDEO_MAX_ATTEMPTS
    });
  }
});
