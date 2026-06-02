'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Images,
  Layers3,
  Loader2,
  Play,
  Settings2,
  Sparkles,
  UploadCloud,
  Wand2,
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
    eyebrow: 'WANXIANG STYLE VIDEO',
    subtitle:
      'Turn one product image into a short commercial clip with camera motion, scene rhythm, and marketplace-ready framing.',
    inputLabel: 'Source image',
    inputHint: 'First frame or product reference',
    action: 'Generate video',
    emptyResult: 'Video preview',
    libraryType: 'image_to_video',
    promptLabel: 'Motion prompt',
    promptPlaceholder:
      'A premium ecommerce product shot, slow push-in camera, soft studio light, clean Brazilian marketplace background.',
    resultTitle: 'Video stage',
    accent: 'from-orange-500 to-amber-300',
    highlights: ['5-10s video', 'Camera motion', 'Product focus'],
  },
  apparel_image: {
    title: 'Apparel image',
    eyebrow: 'APPAREL CREATIVE IMAGE',
    subtitle:
      'Generate localized fashion merchandising images from apparel references, model style, scene mood, and commerce templates.',
    inputLabel: 'Apparel image',
    inputHint: 'Flat lay, mannequin, or clothing product image',
    action: 'Generate image',
    emptyResult: 'Image preview',
    libraryType: 'apparel_image',
    promptLabel: 'Model and scene prompt',
    promptPlaceholder:
      'Female model, Sao Paulo street style, clean catalog pose, warm daylight, premium ecommerce lookbook.',
    resultTitle: 'Apparel canvas',
    accent: 'from-emerald-400 to-teal-200',
    highlights: ['AI model', 'Scene control', 'Catalog ready'],
  },
  try_on: {
    title: 'Try-on',
    eyebrow: 'SMART TRY-ON',
    subtitle:
      'Combine model and garment references for single or multi-item try-on previews with pose, background, and styling control.',
    inputLabel: 'Model image',
    inputHint: 'Model photo or platform model asset',
    action: 'Generate try-on',
    emptyResult: 'Try-on preview',
    libraryType: 'try_on',
    promptLabel: 'Fit and styling prompt',
    promptPlaceholder:
      'Natural standing pose, preserve garment texture, neutral studio background, realistic fabric drape.',
    resultTitle: 'Try-on stage',
    accent: 'from-sky-400 to-cyan-200',
    highlights: ['Single/multi mode', 'Garment texture', 'Model consistency'],
  },
} satisfies Record<
  CreationKind,
  {
    title: string;
    eyebrow: string;
    subtitle: string;
    inputLabel: string;
    inputHint: string;
    action: string;
    emptyResult: string;
    libraryType: string;
    promptLabel: string;
    promptPlaceholder: string;
    resultTitle: string;
    accent: string;
    highlights: string[];
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
    <section className="min-h-full px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase text-white/60">
              <Sparkles className="size-3.5 text-amber-300" />
              {config.eyebrow}
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {config.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55 md:text-base">
              {config.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-2">
            {config.highlights.map((highlight) => (
              <div key={highlight} className="rounded-md bg-gray-950/60 px-3 py-3">
                <BadgeCheck className="mb-2 size-4 text-emerald-300" />
                <p className="text-xs font-medium leading-5 text-white/70">{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[370px_minmax(0,1fr)_330px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/80">
                Creation setup
              </h2>
              <p className="mt-1 text-xs text-white/40">Upload, prompt, and tune output.</p>
            </div>
            <span className={cn('rounded-full bg-linear-to-r p-2 text-gray-950', config.accent)}>
              <Wand2 className="size-4" />
            </span>
          </div>

          <div className="space-y-5">
            <div>
              <Label htmlFor="primary-file" className="mb-2 text-white/75">
                {config.inputLabel}
              </Label>
              <label
                htmlFor="primary-file"
                className={cn(
                  'group flex min-h-60 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/15 bg-gray-950/70 p-3 text-center transition hover:border-white/35 hover:bg-gray-900',
                  isSubmitting && 'pointer-events-none opacity-70'
                )}
              >
                {primaryPreview ? (
                  <img
                    src={primaryPreview}
                    alt=""
                    className="max-h-52 w-full rounded-md object-contain"
                  />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/[0.08] text-white/45 shadow-sm transition group-hover:text-white">
                    <ImageIcon className="size-6" />
                  </span>
                )}
                <span className="flex max-w-full items-center gap-2 truncate text-sm font-medium text-white/80">
                  <UploadCloud className="size-4 shrink-0" />
                  <span className="truncate">{primaryFile?.name ?? 'Select image'}</span>
                </span>
                <span className="text-xs text-white/35">{config.inputHint}</span>
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
                  <Label className="mb-2 text-white/75">Try-on mode</Label>
                  <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-gray-950/70 p-1">
                    {(['single', 'multi'] as TryOnMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={cn(
                          'h-9 rounded-md text-sm font-medium capitalize transition-colors',
                          tryOnMode === mode
                            ? 'bg-white text-gray-950 shadow-sm'
                            : 'text-white/50 hover:text-white'
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
                  <Label htmlFor="garment-files" className="mb-2 text-white/75">
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
                          className="aspect-square rounded-md border border-white/10 object-cover"
                          title={garmentFiles[index]?.name}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div>
              <Label htmlFor="prompt" className="mb-2 text-white/75">
                {config.promptLabel}
              </Label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={config.promptPlaceholder}
                rows={4}
                disabled={isSubmitting}
                className="min-h-28 w-full rounded-md border border-white/10 bg-gray-950/70 px-3 py-2 text-sm text-white shadow-xs outline-none transition-[color,box-shadow] placeholder:text-white/25 focus-visible:border-orange-300 focus-visible:ring-[3px] focus-visible:ring-orange-300/20 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2 text-white/75">
                <Settings2 className="size-3.5" />
                Aspect ratio
              </Label>
              <div className="grid grid-cols-3 rounded-lg border border-white/10 bg-gray-950/70 p-1">
                {aspectRatios.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={cn(
                      'h-9 rounded-md text-sm font-medium transition-colors',
                      aspectRatio === option
                        ? 'bg-white text-gray-950 shadow-sm'
                        : 'text-white/50 hover:text-white'
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
                <Label htmlFor="duration" className="mb-2 flex items-center gap-2 text-white/75">
                  <Clock3 className="size-3.5" />
                  Duration
                </Label>
                <select
                  id="duration"
                  value={durationSeconds}
                  onChange={(event) =>
                    setDurationSeconds(Number(event.target.value) as DurationSeconds)
                  }
                  disabled={isSubmitting}
                  className="flex h-9 w-full rounded-md border border-white/10 bg-gray-950/70 px-3 py-1 text-sm text-white shadow-xs outline-none focus-visible:border-orange-300 focus-visible:ring-[3px] focus-visible:ring-orange-300/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex items-start gap-2 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button
              type="submit"
              className={cn(
                'h-11 w-full bg-linear-to-r font-semibold text-gray-950 hover:opacity-90',
                config.accent
              )}
              disabled={!canSubmit}
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {submitLabel ?? config.action}
              {!isSubmitting ? <ArrowRight className="size-4" /> : null}
            </Button>
          </div>
        </form>

        <div className="flex min-h-[620px] flex-col rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">{config.resultTitle}</h2>
              <p className="text-xs text-white/40">
                {jobStatus?.progressLabel ?? jobStatus?.status ?? 'Idle'}
              </p>
            </div>
            {jobStatus?.status === 'succeeded' ? (
              <CheckCircle2 className="size-5 text-emerald-600" />
            ) : jobId ? (
              <Loader2 className="size-5 animate-spin text-white/50" />
            ) : null}
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gray-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_38%)]" />
            {selectedResultUrl ? (
              kind === 'image_to_video' || selectedResultUrl.endsWith('.mp4') ? (
                <video
                  src={selectedResultUrl}
                  controls
                  playsInline
                  className="relative z-10 max-h-[640px] w-full rounded-lg object-contain"
                />
              ) : (
                <img
                  src={selectedResultUrl}
                  alt=""
                  className="relative z-10 max-h-[640px] w-full rounded-lg object-contain"
                />
              )
            ) : (
              <div className="relative z-10 max-w-xs text-center text-sm text-white/45">
                {kind === 'image_to_video' ? (
                  <Play className="mx-auto mb-3 size-9" />
                ) : (
                  <ImageIcon className="mx-auto mb-3 size-9" />
                )}
                <p className="font-medium text-white/65">{config.emptyResult}</p>
                <p className="mt-2 text-xs leading-5 text-white/35">
                  Output appears here after submission. Keep prompt, template, and
                  ratio aligned for marketplace creatives.
                </p>
              </div>
            )}
          </div>

          {jobStatus?.errorMessage ? (
            <p className="mt-3 text-sm text-red-300">{jobStatus.errorMessage}</p>
          ) : null}
        </div>

        <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="mb-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Images className="size-4 text-amber-300" />
              Platform assets
            </h2>
            <p className="mt-1 text-xs text-white/40">
              {isLoadingLibrary ? 'Loading' : `${templates.length + assets.length} items`}
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-white/45">
                <Layers3 className="size-3.5" />
                Templates
              </h3>
              <div className="grid gap-2">
                {templates.length === 0 ? (
                  <p className="rounded-md border border-dashed border-white/15 p-3 text-sm text-white/40">
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
                            ? 'border-orange-300 bg-orange-300/10'
                            : 'border-white/10 bg-gray-950/45 hover:border-white/25'
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
                          <span className="flex size-12 items-center justify-center rounded bg-white/[0.06] text-white/40">
                            <ImageIcon className="size-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white/70">
                          {getItemLabel(template)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase text-white/45">
                Assets
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {assets.length === 0 ? (
                  <p className="col-span-2 rounded-md border border-dashed border-white/15 p-3 text-sm text-white/40">
                    No assets
                  </p>
                ) : (
                  assets.map((asset) => (
                    <div key={String(asset.id ?? asset.slug ?? getItemLabel(asset))}>
                      {getItemImage(asset) ? (
                        <img
                          src={getItemImage(asset)}
                          alt=""
                          className="aspect-square w-full rounded-md border border-white/10 object-cover"
                          title={getItemLabel(asset)}
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center rounded-md border border-white/10 bg-gray-950/45 text-white/40">
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
      </div>
    </section>
  );
}
