import 'server-only';

type TriggerRunHandle = {
  id?: string;
};

export async function enqueueWanxiangGenerationJob(jobId: string) {
  const { tasks } = await import('@trigger.dev/sdk');
  const handle = (await tasks.trigger(
    'generate-wanxiang',
    { jobId },
    {
      idempotencyKey: `generation:${jobId}`,
      idempotencyKeyTTL: '24h',
    }
  )) as TriggerRunHandle;

  return {
    runId: handle.id ?? null,
  };
}
