import { task, wait } from '@trigger.dev/sdk';

import {
  failWanxiangGenerationJob,
  runWanxiangGenerationJob,
} from '@/lib/generations/jobs';

const GENERATE_WANXIANG_MAX_ATTEMPTS = 3;
const GENERATE_WANXIANG_MAX_POLLS = 45;
const GENERATE_WANXIANG_CONCURRENCY_LIMIT = 5;

function readPositiveIntegerEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function nextPollSeconds(pollIndex: number) {
  if (pollIndex < 3) {
    return 8;
  }

  if (pollIndex < 10) {
    return 12;
  }

  return 20;
}

function formatFailedRunMessage(result: {
  jobId: string;
  errorMessage?: string | null;
}) {
  return [
    `Wanxiang generation failed: ${result.jobId}`,
    result.errorMessage,
  ]
    .filter(Boolean)
    .join(': ');
}

export const generateWanxiang = task({
  id: 'generate-wanxiang',
  queue: {
    name: 'generation-provider',
    concurrencyLimit: readPositiveIntegerEnv(
      'TRIGGER_GENERATION_CONCURRENCY_LIMIT',
      GENERATE_WANXIANG_CONCURRENCY_LIMIT
    ),
  },
  retry: {
    maxAttempts: GENERATE_WANXIANG_MAX_ATTEMPTS,
    factor: 2,
    minTimeoutInMs: 10_000,
    maxTimeoutInMs: 120_000,
    randomize: true,
  },
  run: async (payload: { jobId: string }, { ctx }) => {
    for (let pollIndex = 0; pollIndex < GENERATE_WANXIANG_MAX_POLLS; pollIndex += 1) {
      const result = await runWanxiangGenerationJob(payload, {
        attemptNumber: ctx.attempt.number,
        maxAttempts: ctx.run.maxAttempts ?? GENERATE_WANXIANG_MAX_ATTEMPTS,
        triggerRunId: ctx.run.id,
      });

      if (result.status === 'failed') {
        const message = formatFailedRunMessage(result);
        console.error(message);
        throw new Error(message);
      }

      if (result.status !== 'running') {
        return result;
      }

      await wait.for({
        seconds: nextPollSeconds(pollIndex),
      });
    }

    const timeoutMessage = `Wanxiang generation timed out: ${payload.jobId}`;
    await failWanxiangGenerationJob(payload.jobId, timeoutMessage);
    throw new Error(timeoutMessage);
  },
});
