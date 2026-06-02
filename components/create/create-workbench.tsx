'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type CreationKind = 'image_to_video' | 'apparel_image' | 'try_on';
type TryOnMode = 'single' | 'multi';
type AspectRatio = '9:16' | '1:1' | '16:9';
type DurationSeconds = 5 | 8 | 10;

type LibraryItem = {
  id?: string | number;
  name?: string;
  title?: string;
  slug?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  publicUrl?: string;
  type?: string;
};

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
  finalVideoUrl?: string | null;
  finalImageUrl?: string | null;
  outputUrl?: string | null;
  imageUrl?: string | null;
  resultUrl?: string | null;
  thumbnailUrl?: string | null;
  errorMessage?: string | null;
};

type CreateWorkbenchProps = {
  kind: CreationKind;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const aspectRatios: AspectRatio[] = ['9:16', '1:1', '16:9'];
const durations: DurationSeconds[] = [5, 8, 10];

const copy = {
  image_to_video: {
    title: 'Image to video',
    inputLabel: 'Source image',
    action: 'Generate video',
    emptyResult: 'Video preview',
    libraryType: 'image_to_video',
  },
  apparel_image: {
    title: 'Apparel image',
    inputLabel: 'Apparel image',
    action: 'Generate image',
    emptyResult: 'Image preview',
    libraryType: 'apparel_image',
  },
  try_on: {
    title: 'Try-on',
    inputLabel: 'Model image',
    action: 'Generate try-on',
    emptyResult: 'Try-on preview',
    libraryType: 'try_on',
  },
} satisfies Record<
  CreationKind,
  {
    title: string;
    inputLabel: string;
    action: string;
    emptyResult: string;
    libraryType: string;
  }
>;

function getItemImage(item: LibraryItem) {
  return item.thumbnailUrl ?? item.previewUrl ?? item.imageUrl ?? item.publicUrl ?? '';
}

function getItemLabel(item: LibraryItem) {
  return item.title ?? item.name ?? item.slug ?? String(item.id ?? 'Template');
}

function normalizeItems(value: unknown): LibraryItem[] {
  if (Array.isArray(value)) return value as LibraryItem[];
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  for (const key of ['items', 'templates', 'assets', 'data', 'results']) {
    if (Array.isArray(record[key])) return record[key] as LibraryItem[];
  }

  return [];
}

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

  if (!response.ok) {
    throw new Error(await readResponseError(response, fallback));
  }

  return (await response.json()) as T;
}

function validateImage(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Use a PNG, JPEG, or WEBP image.';
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 10 MB or smaller.';
  }

  return null;
}

function terminalStatus(status?: string) {
  return status === 'succeeded' || status === 'failed';
}

function resultUrl(status: JobStatusResponse | null) {
  return (
    status?.finalVideoUrl ??
    status?.finalImageUrl ??
    status?.outputUrl ??
    status?.imageUrl ??
    status?.resultUrl ??
    status?.thumbnailUrl ??
    null
  );
}

async function uploadAsset(file: File) {
  const presign = await postJson<PresignResponse>(
    '/api/assets/presign',
    {
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
    'Upload could not be prepared.'
  );

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Image upload failed.');
  }

  await postJson(
    '/api/assets/complete',
    {
      assetId: presign.assetId,
      storageKey: presign.storageKey,
    },
    'Image could not be saved.'
  );

  return presign.assetId;
}

async function fetchJobStatus(jobId: string) {
  const generationStatus = await fetch(`/api/generations/${jobId}/status`);

  if (generationStatus.ok) {
    return (await generationStatus.json()) as JobStatusResponse;
  }

  const legacyStatus = await fetch(`/api/jobs/${jobId}`);
  if (!legacyStatus.ok) {
    throw new Error(await readResponseError(legacyStatus, 'Status could not be loaded.'));
  }

  return (await legacyStatus.json()) as JobStatusResponse;
}

export function CreateWorkbench({ kind }: CreateWorkbenchProps) {
  const config = copy[kind];
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [garmentFiles, setGarmentFiles] = useState<File[]>([]);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [garmentPreviews, setGarmentPreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] = useState<DurationSeconds>(5);
  const [tryOnMode, setTryOnMode] = useState<TryOnMode>('single');
  const [templates, setTemplates] = useState<LibraryItem[]>([]);
  const [assets, setAssets] = useState<LibraryItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LibraryItem | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = Boolean(submitLabel);
  const selectedResultUrl = resultUrl(jobStatus);
  const selectedTemplateId = selectedTemplate?.id ?? selectedTemplate?.slug;

  const canSubmit = useMemo(() => {
    if (!primaryFile || isSubmitting) return false;
    if (kind === 'try_on') return garmentFiles.length > 0;
    return true;
  }, [garmentFiles.length, isSubmitting, kind, primaryFile]);

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
    const objectUrls = garmentFiles.map((file) => URL.createObjectURL(file));
    setGarmentPreviews(objectUrls);
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [garmentFiles]);

  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
      setIsLoadingLibrary(true);
      try {
        const params = new URLSearchParams({ type: config.libraryType });
        const [templateResponse, assetResponse] = await Promise.all([
          fetch(`/api/creative-templates?${params.toString()}`),
          fetch(`/api/library-assets?${params.toString()}`),
        ]);

        const [templateBody, assetBody] = await Promise.all([
          templateResponse.ok ? templateResponse.json() : Promise.resolve({ items: [] }),
          assetResponse.ok ? assetResponse.json() : Promise.resolve({ items: [] }),
        ]);

        if (!cancelled) {
          const nextTemplates = normalizeItems(templateBody);
          setTemplates(nextTemplates);
          setAssets(normalizeItems(assetBody));
          setSelectedTemplate((current) => current ?? nextTemplates[0] ?? null);
        }
      } finally {
        if (!cancelled) setIsLoadingLibrary(false);
      }
    }

    loadLibrary();
    return () => {
      cancelled = true;
    };
  }, [config.libraryType]);

  useEffect(() => {
    if (!jobId || terminalStatus(jobStatus?.status)) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const nextStatus = await fetchJobStatus(jobId);
        if (!cancelled) setJobStatus(nextStatus);
      } catch (statusError) {
        if (!cancelled) {
          setError(
            statusError instanceof Error
              ? statusError.message
              : 'Status could not be loaded.'
          );
        }
      }
    };

    poll();
    const timer = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [jobId, jobStatus?.status]);

  function selectPrimaryFile(file: File | null) {
    setError(null);
    if (!file) {
      setPrimaryFile(null);
      return;
    }

    const validationError = validateImage(file);
    if (validationError) {
      setPrimaryFile(null);
      setError(validationError);
      return;
    }

    setPrimaryFile(file);
  }

  function selectGarmentFiles(files: FileList | null) {
    setError(null);
    const nextFiles = Array.from(files ?? []);
    const validationError = nextFiles.map(validateImage).find(Boolean);

    if (validationError) {
      setGarmentFiles([]);
      setError(validationError);
      return;
    }

    setGarmentFiles(tryOnMode === 'single' ? nextFiles.slice(0, 1) : nextFiles.slice(0, 4));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!primaryFile) {
      setError(`Select a ${config.inputLabel.toLowerCase()}.`);
      return;
    }

    if (kind === 'try_on' && garmentFiles.length === 0) {
      setError('Select at least one garment image.');
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);

    try {
      setSubmitLabel('Uploading image');
      const primaryAssetId = await uploadAsset(primaryFile);
      const garmentAssetIds =
        kind === 'try_on'
          ? await Promise.all(
              garmentFiles.map(async (file, index) => {
                setSubmitLabel(`Uploading garment ${index + 1}`);
                return uploadAsset(file);
              })
            )
          : [];

      setSubmitLabel('Starting generation');
      const basePayload = {
        generationType: kind,
        prompt: prompt.trim(),
        aspectRatio,
        templateId: selectedTemplateId,
        templateSlug: selectedTemplate?.slug ?? selectedTemplateId,
      };
      const payload =
        kind === 'image_to_video'
          ? {
              ...basePayload,
              inputAssetId: primaryAssetId,
              durationSeconds,
            }
          : kind === 'apparel_image'
            ? {
                ...basePayload,
                inputAssetId: primaryAssetId,
              }
            : {
                ...basePayload,
                tryOnMode,
                modelAssetId: primaryAssetId,
                garmentAssetId: garmentAssetIds[0],
                garmentAssetIds,
              };

      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        payload,
        'Generation could not be started.'
      );
      const nextJobId = generation.jobId ?? generation.id;

      if (!nextJobId) {
        throw new Error('Generation response did not include a job id.');
      }

      setJobId(nextJobId);
      setJobStatus({
        id: nextJobId,
        status: generation.status ?? 'queued',
        progressLabel: 'Queued',
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Generation could not be started.'
      );
    } finally {
      setSubmitLabel(null);
    }
  }

  return (
    <section className="flex-1 bg-gray-50 px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-4 xl:grid-cols-[360px_minmax(0,1fr)_320px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h1 className="text-lg font-semibold text-gray-950">{config.title}</h1>
            <Sparkles className="size-5 text-orange-600" />
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="primary-file" className="mb-2">
                {config.inputLabel}
              </Label>
              <label
                htmlFor="primary-file"
                className={cn(
                  'flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-center hover:border-gray-400',
                  isSubmitting && 'pointer-events-none opacity-70'
                )}
              >
                {primaryPreview ? (
                  <img
                    src={primaryPreview}
                    alt=""
                    className="max-h-48 w-full rounded-md object-contain"
                  />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                    <ImageIcon className="size-6" />
                  </span>
                )}
                <span className="flex max-w-full items-center gap-2 truncate text-sm font-medium text-gray-800">
                  <UploadCloud className="size-4 shrink-0" />
                  <span className="truncate">{primaryFile?.name ?? 'Select image'}</span>
                </span>
              </label>
              <Input
                id="primary-file"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                className="sr-only"
                onChange={(event) => selectPrimaryFile(event.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
            </div>

            {kind === 'try_on' ? (
              <div className="space-y-3">
                <div>
                  <Label className="mb-2">Try-on mode</Label>
                  <div className="grid grid-cols-2 rounded-lg border bg-gray-50 p-1">
                    {(['single', 'multi'] as TryOnMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={cn(
                          'h-9 rounded-md text-sm font-medium capitalize transition-colors',
                          tryOnMode === mode
                            ? 'bg-white text-gray-950 shadow-sm'
                            : 'text-gray-600 hover:text-gray-950'
                        )}
                        onClick={() => {
                          setTryOnMode(mode);
                          setGarmentFiles((files) =>
                            mode === 'single' ? files.slice(0, 1) : files
                          );
                        }}
                        disabled={isSubmitting}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="garment-files" className="mb-2">
                    Garment image
                  </Label>
                  <Input
                    id="garment-files"
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    multiple={tryOnMode === 'multi'}
                    onChange={(event) => selectGarmentFiles(event.target.files)}
                    disabled={isSubmitting}
                  />
                  {garmentPreviews.length > 0 ? (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {garmentPreviews.map((preview, index) => (
                        <img
                          key={preview}
                          src={preview}
                          alt=""
                          className="aspect-square rounded-md border object-cover"
                          title={garmentFiles[index]?.name}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div>
              <Label htmlFor="prompt" className="mb-2">
                Prompt
              </Label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                disabled={isSubmitting}
                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <Label className="mb-2">Aspect ratio</Label>
              <div className="grid grid-cols-3 rounded-lg border bg-gray-50 p-1">
                {aspectRatios.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      'h-9 rounded-md text-sm font-medium transition-colors',
                      aspectRatio === option
                        ? 'bg-white text-gray-950 shadow-sm'
                        : 'text-gray-600 hover:text-gray-950'
                    )}
                    onClick={() => setAspectRatio(option)}
                    disabled={isSubmitting}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {kind === 'image_to_video' ? (
              <div>
                <Label htmlFor="duration" className="mb-2">
                  Duration
                </Label>
                <select
                  id="duration"
                  value={durationSeconds}
                  onChange={(event) =>
                    setDurationSeconds(Number(event.target.value) as DurationSeconds)
                  }
                  disabled={isSubmitting}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {durations.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration}s
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {error ? (
              <div
                className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitLabel ?? config.action}
            </Button>
          </div>
        </form>

        <div className="flex min-h-[560px] flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-950">Result</h2>
              <p className="text-xs text-gray-500">
                {jobStatus?.progressLabel ?? jobStatus?.status ?? 'Idle'}
              </p>
            </div>
            {jobStatus?.status === 'succeeded' ? (
              <CheckCircle2 className="size-5 text-emerald-600" />
            ) : jobId ? (
              <Loader2 className="size-5 animate-spin text-gray-500" />
            ) : null}
          </div>

          <div className="flex flex-1 items-center justify-center rounded-lg bg-gray-950">
            {selectedResultUrl ? (
              kind === 'image_to_video' || selectedResultUrl.endsWith('.mp4') ? (
                <video
                  src={selectedResultUrl}
                  controls
                  playsInline
                  className="max-h-[640px] w-full rounded-lg object-contain"
                />
              ) : (
                <img
                  src={selectedResultUrl}
                  alt=""
                  className="max-h-[640px] w-full rounded-lg object-contain"
                />
              )
            ) : (
              <div className="text-center text-sm text-gray-400">
                <ImageIcon className="mx-auto mb-3 size-8" />
                {config.emptyResult}
              </div>
            )}
          </div>

          {jobStatus?.errorMessage ? (
            <p className="mt-3 text-sm text-red-600">{jobStatus.errorMessage}</p>
          ) : null}
        </div>

        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-950">Platform assets</h2>
            <p className="text-xs text-gray-500">
              {isLoadingLibrary ? 'Loading' : `${templates.length + assets.length} items`}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                Templates
              </h3>
              <div className="grid gap-2">
                {templates.length === 0 ? (
                  <p className="rounded-md border border-dashed p-3 text-sm text-gray-500">
                    No templates
                  </p>
                ) : (
                  templates.map((template) => {
                    const templateKey = String(template.id ?? template.slug ?? getItemLabel(template));
                    const active =
                      String(selectedTemplate?.id ?? selectedTemplate?.slug) ===
                      String(template.id ?? template.slug);
                    return (
                      <button
                        key={templateKey}
                        type="button"
                        className={cn(
                          'flex items-center gap-3 rounded-md border p-2 text-left transition-colors',
                          active
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        {getItemImage(template) ? (
                          <img
                            src={getItemImage(template)}
                            alt=""
                            className="size-12 rounded object-cover"
                          />
                        ) : (
                          <span className="flex size-12 items-center justify-center rounded bg-gray-100 text-gray-500">
                            <ImageIcon className="size-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-800">
                          {getItemLabel(template)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-gray-500">
                Assets
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {assets.length === 0 ? (
                  <p className="col-span-2 rounded-md border border-dashed p-3 text-sm text-gray-500">
                    No assets
                  </p>
                ) : (
                  assets.map((asset) => (
                    <div key={String(asset.id ?? asset.slug ?? getItemLabel(asset))}>
                      {getItemImage(asset) ? (
                        <img
                          src={getItemImage(asset)}
                          alt=""
                          className="aspect-square w-full rounded-md border object-cover"
                          title={getItemLabel(asset)}
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded-md border bg-gray-50 text-gray-500">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
