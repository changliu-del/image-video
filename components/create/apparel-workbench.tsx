'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Palette,
  PanelsTopLeft,
  UploadCloud,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CanvasStage,
  PanelSection,
  ResultCard,
  SegmentedOptions,
  StudioPanel,
} from '@/components/create/workbench-ui';
import {
  apparelWorkbenchCopy,
  commonWorkbenchCopy,
} from '@/components/create/workbench-copy';
import { TemplatePromptPicker } from '@/components/create/template-prompt-picker';
import { refreshDashboardUser } from '@/lib/dashboard/user-cache';
import {
  AuthenticationRequiredError,
  isAuthenticationRequiredError,
  redirectToSignIn,
} from '@/lib/auth/client-login';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { getApparelImageCreditCost } from '@/lib/generations/credit-costs';
import {
  normalizePublicTemplateDetail,
  type PublicTemplateDetailItem,
} from '@/lib/templates/public-client';
import { cn } from '@/lib/utils';

type AspectRatio = '9:16' | '1:1' | '16:9';

type PresignResponse = {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
};

type GenerationResponse = {
  id?: string;
  jobId?: string;
  status?: string;
};

type JobStatusResponse = {
  id?: string;
  status?: string;
  progressLabel?: string;
  finalImageUrl?: string | null;
  outputUrl?: string | null;
  imageUrl?: string | null;
  resultUrl?: string | null;
  thumbnailUrl?: string | null;
  errorMessage?: string | null;
  nextPollMs?: number | null;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const aspectRatios: AspectRatio[] = ['9:16', '1:1', '16:9'];

async function readResponseError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      error?: unknown;
      message?: unknown;
      details?: {
        fieldErrors?: Record<string, string[] | undefined>;
        formErrors?: string[];
      };
    };
    const fieldError = Object.values(body.details?.fieldErrors ?? {})
      .flat()
      .find((message): message is string => Boolean(message));

    if (fieldError) return fieldError;
    if (body.details?.formErrors?.[0]) return body.details.formErrors[0];
    if (typeof body.error === 'string') return body.error;
    if (typeof body.message === 'string') return body.message;
  } catch {}

  return fallback;
}

async function postJson<T>(url: string, body: Record<string, unknown>, fallback: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

  if (!response.ok) {
    throw new Error(await readResponseError(response, fallback));
  }

  return (await response.json()) as T;
}

function validateImage(
  file: File,
  labels: { invalidImage: string; imageTooLarge: string }
) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return labels.invalidImage;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return labels.imageTooLarge;
  }

  return null;
}

function terminalStatus(status?: string) {
  return status === 'succeeded' || status === 'failed';
}

function resultUrl(status: JobStatusResponse | null) {
  return (
    status?.finalImageUrl ??
    status?.outputUrl ??
    status?.imageUrl ??
    status?.resultUrl ??
    status?.thumbnailUrl ??
    null
  );
}

async function uploadAsset(file: File, labels: typeof commonWorkbenchCopy.en) {
  const presign = await postJson<PresignResponse>(
    '/api/assets/presign',
    {
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
    labels.uploadPrepareError
  );

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(labels.uploadFailed);
  }

  await postJson(
    '/api/assets/complete',
    {
      assetId: presign.assetId,
      storageKey: presign.storageKey,
    },
    labels.imageSaveError
  );

  return presign.assetId;
}

async function fetchJobStatus(jobId: string, labels: typeof commonWorkbenchCopy.en) {
  const generationStatus = await fetch(`/api/generations/${jobId}/status`);

  if (generationStatus.ok) {
    return (await generationStatus.json()) as JobStatusResponse;
  }

  const legacyStatus = await fetch(`/api/jobs/${jobId}`);
  if (!legacyStatus.ok) {
    throw new Error(await readResponseError(legacyStatus, labels.statusLoadError));
  }

  return (await legacyStatus.json()) as JobStatusResponse;
}

export function ApparelWorkbench({
  initialPrompt = '',
  initialTemplateId = '',
}: {
  initialPrompt?: string;
  initialTemplateId?: string;
}) {
  const locale = useDashboardLocale();
  const copy = apparelWorkbenchCopy[locale];
  const commonCopy = commonWorkbenchCopy[locale];
  const starterPrompt = initialPrompt.trim();
  const starterTemplateId = initialTemplateId.trim();
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    () => starterPrompt || copy.defaultPrompt
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    () => starterTemplateId || null
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = Boolean(submitLabel);
  const selectedResultUrl = resultUrl(jobStatus);
  const sourcePreview = primaryPreview;
  const sourceName = primaryFile?.name ?? null;
  const canSubmit = !isSubmitting && Boolean(primaryFile);

  useEffect(() => {
    if (!primaryFile) {
      setPrimaryPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(primaryFile);
    setPrimaryPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [primaryFile]);

  useEffect(() => {
    if (!starterTemplateId) return;

    let cancelled = false;
    const controller = new AbortController();

    async function loadInitialTemplate() {
      try {
        const response = await fetch(
          `/api/templates/${encodeURIComponent(starterTemplateId)}?${new URLSearchParams(
            { locale }
          )}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('initial-template-load-failed');
        }

        const detail = normalizePublicTemplateDetail(await response.json());
        if (!detail || detail.type !== 'image_to_image') return;

        if (!cancelled) {
          setError(null);
          setSelectedTemplateId(detail.id);
          setPrompt(detail.prompt);
        }
      } catch {
        if (!cancelled) {
          setSelectedTemplateId(null);
        }
      }
    }

    void loadInitialTemplate();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locale, starterTemplateId]);

  useEffect(() => {
    if (!jobId || terminalStatus(jobStatus?.status)) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const nextStatus = await fetchJobStatus(jobId, commonCopy);
        if (!cancelled) {
          setJobStatus(nextStatus);
          if (terminalStatus(nextStatus.status)) {
            void refreshDashboardUser();
          }
        }
      } catch (statusError) {
        if (!cancelled) {
          setError(
            statusError instanceof Error
              ? statusError.message
              : commonCopy.statusLoadError
          );
        }
      }
    };

    const timer = window.setTimeout(
      poll,
      jobStatus?.nextPollMs ?? (jobStatus?.status === 'queued' ? 2000 : 5000)
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [jobId, jobStatus?.nextPollMs, jobStatus?.status]);

  function selectPrimaryFile(file: File | null) {
    setError(null);
    if (!file) {
      setPrimaryFile(null);
      return;
    }

    const validationError = validateImage(file, commonCopy);
    if (validationError) {
      setPrimaryFile(null);
      setError(validationError);
      return;
    }

    setPrimaryFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sourceFile = primaryFile;
    if (!sourceFile) {
      setError(copy.uploadRequired);
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);

    try {
      setSubmitLabel(copy.uploadingImage);
      const inputAssetId = await uploadAsset(sourceFile, commonCopy);

      setSubmitLabel(copy.startingGeneration);
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'apparel_image',
          inputAssetId,
          prompt: prompt.trim(),
          aspectRatio,
          ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
        },
        commonCopy.generationStartError
      );
      const nextJobId = generation.jobId ?? generation.id;

      if (!nextJobId) {
        throw new Error(commonCopy.missingJobError);
      }

      void refreshDashboardUser();
      setJobId(nextJobId);
        setJobStatus({
          id: nextJobId,
          status: generation.status ?? 'queued',
          progressLabel: commonCopy.queued,
        });
      } catch (submitError) {
        if (isAuthenticationRequiredError(submitError)) {
          redirectToSignIn(locale);
          return;
        }

        setError(
          submitError instanceof Error
            ? submitError.message
            : commonCopy.generationStartError
        );
      } finally {
        setSubmitLabel(null);
      }
  }

  function applyTemplate(template: PublicTemplateDetailItem) {
    setError(null);
    setSelectedTemplateId(template.id);
    setPrompt(template.prompt);
  }

  const statusLabel = jobStatus?.progressLabel ?? jobStatus?.status ?? (jobId ? commonCopy.generating : null);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[calc(100dvh-58px)] flex-col bg-[#f5f7fb] text-gray-950 lg:flex-row"
    >
      <StudioPanel
        footer={
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-indigo-600"
            >
              <PanelsTopLeft className="size-4" />
              {commonCopy.taskFlow}
            </button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 flex-1 rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Palette className="size-4" />}
              {submitLabel ?? commonCopy.generateNow}
              <span className="font-semibold opacity-90">
                {commonCopy.credits(getApparelImageCreditCost())}
              </span>
            </Button>
          </div>
        }
      >
        <PanelSection title={copy.productLayout} required>
          <div
            className={cn(
              'flex min-h-36 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 px-4 py-6 text-center',
              sourcePreview && 'bg-white p-2'
            )}
          >
            {sourcePreview ? (
              <img
                src={sourcePreview}
                alt=""
                className="max-h-48 w-full rounded-md object-contain"
              />
            ) : (
              <span className="text-sm font-bold text-gray-500">
                {copy.productEmpty}
              </span>
            )}
          </div>
          {sourceName ? (
            <p className="mt-2 truncate text-xs font-semibold text-indigo-600">
              {sourceName}
            </p>
          ) : null}
        </PanelSection>

        <PanelSection title={copy.size} required>
          <SegmentedOptions
            options={aspectRatios}
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={isSubmitting}
            compact
          />
        </PanelSection>

        <PanelSection title={copy.inspiration} required>
          <textarea
            id="apparel-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={5}
            disabled={isSubmitting}
            placeholder={copy.promptPlaceholder}
            className="min-h-32 w-full resize-none rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <div className="mt-4">
            <div className="mb-2 text-sm">
              <span className="font-bold text-gray-900">{copy.promptIdeas}</span>
              <span className="ml-2 text-xs font-bold text-indigo-500">
                {copy.addFromTemplate}
              </span>
            </div>
            <TemplatePromptPicker
              type="image_to_image"
              selectedTemplateId={selectedTemplateId}
              disabled={isSubmitting}
              onApply={applyTemplate}
            />
          </div>
        </PanelSection>

        {error ? (
          <div
            className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </StudioPanel>

      <CanvasStage
        title={copy.canvasTitle}
        contentClassName="flex min-h-0 flex-1 items-center py-4"
      >
        <div className="mx-auto w-full max-w-[900px]">
          {selectedResultUrl ? (
            <ResultCard
              resultUrl={selectedResultUrl}
              status={statusLabel}
              title={copy.resultTitle}
              description={copy.resultDescription}
              minHeight="min-h-[520px]"
              waitingLabel={commonCopy.waitingUpload}
            />
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
              <label
                htmlFor="apparel-file-canvas"
                className={cn(
                  'flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg text-center transition hover:bg-gray-50',
                  isSubmitting && 'pointer-events-none opacity-60'
                )}
              >
                {sourcePreview ? (
                  <img src={sourcePreview} alt="" className="max-h-56 rounded-lg object-contain" />
                ) : (
                  <>
                    <span className="flex size-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                      <UploadCloud className="size-6" />
                    </span>
                    <span className="mt-4 text-sm font-bold text-gray-800">
                      {commonCopy.uploadClick}
                    </span>
                  </>
                )}
              </label>
              <Input
                id="apparel-file-canvas"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                className="sr-only"
                onChange={(event) => selectPrimaryFile(event.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
            </div>
          )}

          {jobStatus?.errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {jobStatus.errorMessage}
            </p>
          ) : null}

        </div>
      </CanvasStage>
    </form>
  );
}
