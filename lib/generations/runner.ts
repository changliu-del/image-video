type LegacyGenerationRunDeps = {
  attemptNumber?: number;
  maxAttempts?: number;
};

export async function runGenerationJob(
  payload: { jobId: string },
  _deps: LegacyGenerationRunDeps = {}
) {
  throw new Error(
    `Legacy generate-video runner is disabled for generation job ${payload.jobId}; use the generate-wanxiang task instead.`
  );
}
