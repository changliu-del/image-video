'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  RotateCw,
  WandSparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { POSTHOG_EVENTS, captureClientEvent } from '@/lib/analytics/posthog';

type JobStatusValue =
  | 'queued'
  | 'running'
  | 'rendering'
  | 'succeeded'
  | 'failed';

type JobResponse = {
  id: string;
  status: JobStatusValue;
  progressLabel?: string | null;
  finalVideoUrl?: string | null;
  thumbnailUrl?: string | null;
  errorMessage?: string | null;
};

type RetryResponse = {
  jobId: string;
  status: JobStatusValue;
};

const statusMeta: Record<
  JobStatusValue,
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  queued: {
    label: 'Queued',
    tone: 'border-gray-200 bg-gray-50 text-gray-700',
    icon: Loader2
  },
  running: {
    label: 'Generating',
    tone: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: RotateCw
  },
  rendering: {
    label: 'Rendering',
    tone: 'border-orange-200 bg-orange-50 text-orange-700',
    icon: WandSparkles
  },
  succeeded: {
    label: 'Ready',
    tone: 'border-green-200 bg-green-50 text-green-700',
    icon: CheckCircle2
  },
  failed: {
    label: 'Failed',
    tone: 'border-red-200 bg-red-50 text-red-700',
    icon: AlertCircle
  }
};

const progressStatuses: JobStatusValue[] = [
  'queued',
  'running',
  'rendering',
  'succeeded'
];

function isTerminalStatus(status: JobStatusValue) {
  return status === 'succeeded' || status === 'failed';
}

async function readResponseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as {
      error?: unknown;
      message?: unknown;
    };

    if (typeof data.error === 'string') {
      return data.error;
    }

    if (typeof data.message === 'string') {
      return data.message;
    }
  } catch {}

  return fallback;
}

export function JobStatus({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<JobResponse | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;

    async function pollJob() {
      let shouldPollAgain = true;
      controller?.abort();
      controller = new AbortController();

      try {
        const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(
            await readResponseError(response, 'Job status could not be loaded.')
          );
        }

        const nextJob = (await response.json()) as JobResponse;

        if (!isActive) {
          return;
        }

        setJob(nextJob);
        setError(null);
        shouldPollAgain = !isTerminalStatus(nextJob.status);
      } catch (pollError) {
        if (!isActive || (pollError as Error).name === 'AbortError') {
          return;
        }

        setError(
          pollError instanceof Error
            ? pollError.message
            : 'Job status could not be loaded.'
        );
      } finally {
        if (isActive) {
          setIsInitialLoading(false);

          if (shouldPollAgain) {
            timer = setTimeout(pollJob, 3000);
          }
        }
      }
    }

    void pollJob();

    return () => {
      isActive = false;
      controller?.abort();

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [jobId]);

  useEffect(() => {
    setRetryError(null);
    setIsRetrying(false);
  }, [jobId]);

  const currentStatus = job?.status ?? 'queued';
  const meta = statusMeta[currentStatus];
  const StatusIcon = meta.icon;
  const activeIndex = useMemo(() => {
    if (currentStatus === 'failed') {
      return -1;
    }

    return progressStatuses.indexOf(currentStatus);
  }, [currentStatus]);

  function handleDownload() {
    if (!job?.finalVideoUrl) {
      return;
    }

    captureClientEvent(POSTHOG_EVENTS.VIDEO_DOWNLOADED, {
      jobId: job.id,
      source: 'job_status'
    });
  }

  async function handleRetry() {
    const failedJobId = job?.id ?? jobId;

    setIsRetrying(true);
    setRetryError(null);

    try {
      const response = await fetch(
        `/api/jobs/${encodeURIComponent(failedJobId)}/retry`,
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        throw new Error(
          await readResponseError(response, 'Generation could not be retried.')
        );
      }

      const retry = (await response.json()) as RetryResponse;
      router.push(`/jobs/${retry.jobId}`);
    } catch (retryFailure) {
      setRetryError(
        retryFailure instanceof Error
          ? retryFailure.message
          : 'Generation could not be retried.'
      );
      setIsRetrying(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-lg">
        <CardHeader className="gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Job {job?.id ?? jobId}</CardTitle>
            {job?.progressLabel && (
              <p className="text-sm text-muted-foreground">
                {job.progressLabel}
              </p>
            )}
          </div>
          <div
            className={cn(
              'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium',
              meta.tone
            )}
          >
            <StatusIcon
              className={cn(
                'size-4',
                (currentStatus === 'queued' || currentStatus === 'running') &&
                  'animate-spin'
              )}
            />
            {meta.label}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-4">
            {progressStatuses.map((status, index) => {
              const isComplete =
                currentStatus === 'succeeded' || index < activeIndex;
              const isActive = index === activeIndex;

              return (
                <div
                  key={status}
                  className={cn(
                    'flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2',
                    isComplete
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : isActive
                        ? 'border-orange-200 bg-orange-50 text-orange-800'
                        : 'border-gray-200 bg-white text-gray-500'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                      isComplete
                        ? 'bg-green-600 text-white'
                        : isActive
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {index + 1}
                  </span>
                  <span className="truncate text-sm font-medium">
                    {statusMeta[status].label}
                  </span>
                </div>
              );
            })}
          </div>

          {isInitialLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading status
            </div>
          )}

          {error && (
            <div
              className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {currentStatus === 'failed' && (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                {job?.errorMessage ?? 'Generation failed.'}
              </p>
              {retryError && (
                <div
                  className="flex items-start gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{retryError}</span>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Retry
              </Button>
            </div>
          )}

          {currentStatus === 'succeeded' && (
            <div className="space-y-4">
              {job?.finalVideoUrl ? (
                <video
                  className="max-h-[70dvh] w-full rounded-lg border bg-black object-contain"
                  controls
                  poster={job.thumbnailUrl ?? undefined}
                  src={job.finalVideoUrl}
                />
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-muted-foreground">
                  Video URL unavailable.
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button asChild variant="outline">
                  <Link href="/generate">
                    <WandSparkles className="size-4" />
                    New video
                  </Link>
                </Button>
                {job?.finalVideoUrl ? (
                  <Button
                    asChild
                    className="bg-orange-500 text-white hover:bg-orange-600"
                  >
                    <a
                      href={job.finalVideoUrl}
                      download
                      rel="noopener noreferrer"
                      onClick={handleDownload}
                    >
                      <Download className="size-4" />
                      Download
                    </a>
                  </Button>
                ) : (
                  <Button disabled>
                    <Download className="size-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
