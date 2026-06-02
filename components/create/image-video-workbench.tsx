'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clapperboard,
  Clock3,
  Film,
  ImageIcon,
  Layers3,
  Loader2,
  Play,
  Sparkles,
  UploadCloud,
  WandSparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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
  generationId?: string;
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

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const aspectRatios: AspectRatio[] = ['9:16', '1:1', '16:9'];
const durations: DurationSeconds[] = [5, 8, 10];

const promptPresets = [
  'Slow cinematic push-in, subtle parallax, premium product lighting',
  'Handheld lifestyle motion, warm light, natural depth of field',
  'Orbit camera move, glossy highlights, clean commercial finish',
];

const historyPlaceholders = [
  'Hero product reveal',
  'Lifestyle motion draft',
  'Social cut preview',
];

function getItemImage(item: LibraryItem) {
  return item.thumbnailUrl ?? item.previewUrl ?? item.imageUrl ?? item.publicUrl ?? '';
}

function getItemLabel(item: LibraryItem) {
  return item.title ?? item.name ?? item.slug ?? String(item.id ?? 'Asset');
}

function normalizeItems(value: unknown): LibraryItem[] {
  if (Array.isArray(value)) return value as LibraryItem[];
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  for (const key of ['items', 'templates', 'assets', 'data', 'results', 'list']) {
    if (Array.isArray(record[key])) return record[key] as LibraryItem[];
  }

  return [];
}

function formatFileSize(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
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

function SectionTitle({
  icon: Icon,
  title,
  meta,
}: {
  icon: typeof ImageIcon;
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-amber-200">
          <Icon className="size-4" />
        </span>
        <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
      </div>
      {meta ? <p className="shrink-0 text-xs font-medium text-white/42">{meta}</p> : null}
    </div>
  );
}

function EmptyMedia({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-sm text-white/45">
      <Film className="mb-3 size-9 text-white/28" />
      <span>{label}</span>
    </div>
  );
}

export function ImageVideoWorkbench() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(promptPresets[0]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] = useState<DurationSeconds>(5);
  const [templates, setTemplates] = useState<LibraryItem[]>([]);
  const [assets, setAssets] = useState<LibraryItem[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<LibraryItem | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = Boolean(submitLabel);
  const trimmedPrompt = prompt.trim();
  const selectedResultUrl = resultUrl(jobStatus);
  const selectedAssetImage = selectedAsset ? getItemImage(selectedAsset) : '';
  const libraryItems = useMemo(
    () => [...assets, ...templates].filter((item) => getItemImage(item)),
    [assets, templates]
  );
  const canSubmit = Boolean(sourceFile && trimmedPrompt && !isSubmitting);

  useEffect(() => {
    if (!sourceFile) {
      setSourcePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(sourceFile);
    setSourcePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [sourceFile]);

  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
      setIsLoadingLibrary(true);
      try {
        const params = new URLSearchParams({ type: 'image_to_video' });
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
          const nextAssets = normalizeItems(assetBody);
          setTemplates(nextTemplates);
          setAssets(nextAssets);
          setSelectedAsset((current) => current ?? nextAssets[0] ?? nextTemplates[0] ?? null);
        }
      } finally {
        if (!cancelled) setIsLoadingLibrary(false);
      }
    }

    loadLibrary();
    return () => {
      cancelled = true;
    };
  }, []);

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
            statusError instanceof Error ? statusError.message : 'Status could not be loaded.'
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

  function selectSourceFile(file: File | null) {
    setError(null);
    if (!file) {
      setSourceFile(null);
      return;
    }

    const validationError = validateImage(file);
    if (validationError) {
      setSourceFile(null);
      setError(validationError);
      return;
    }

    setSourceFile(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sourceFile) {
      setError('Select a source image.');
      return;
    }

    if (!trimmedPrompt) {
      setError('Prompt is required.');
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);

    try {
      setSubmitLabel('Uploading image');
      const inputAssetId = await uploadAsset(sourceFile);

      setSubmitLabel('Starting generation');
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'image_to_video',
          inputAssetId,
          prompt: trimmedPrompt,
          aspectRatio,
          durationSeconds,
        },
        'Generation could not be started.'
      );
      const nextJobId = generation.jobId ?? generation.generationId ?? generation.id;

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
        submitError instanceof Error ? submitError.message : 'Generation could not be started.'
      );
    } finally {
      setSubmitLabel(null);
    }
  }

  return (
    <section className="min-h-[calc(100dvh-60px)] bg-gray-950 text-white md:min-h-[calc(100dvh-72px)]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <video
            src="/bg.mp4"
            className="size-full object-cover opacity-18"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(2,6,23,0.98),rgba(15,23,42,0.9)_46%,rgba(17,24,39,0.74))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_12%,rgba(34,211,238,0.14),transparent_30%),radial-gradient(circle_at_76%_8%,rgba(245,158,11,0.12),transparent_26%)]" />
        </div>

        <form onSubmit={handleSubmit} className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1 text-xs font-semibold uppercase text-white/62 backdrop-blur">
                <Sparkles className="size-3.5 text-amber-300" />
                Image to video
              </div>
              <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-4xl">
                Animate product images into polished short videos.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
                Upload a source frame, tune motion and framing, then generate a ready-to-review clip.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-white/[0.06] p-2 text-center backdrop-blur">
              {[
                ['Mode', 'I2V'],
                ['Cost', 'Preview'],
                ['Engine', 'Wanxiang'],
              ].map(([label, value]) => (
                <div key={label} className="min-w-20 px-2 py-1">
                  <div className="text-[11px] font-semibold uppercase text-white/38">{label}</div>
                  <div className="mt-1 text-sm font-semibold text-white">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
            <aside className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/25 backdrop-blur">
              <SectionTitle
                icon={Layers3}
                title="Material library"
                meta={isLoadingLibrary ? 'Loading' : `${libraryItems.length} items`}
              />

              <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-gray-950/60">
                {selectedAssetImage ? (
                  <img
                    src={selectedAssetImage}
                    alt=""
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <EmptyMedia label="No library preview" />
                )}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {libraryItems.length === 0 ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-md border border-dashed border-white/12 bg-white/[0.04]"
                    />
                  ))
                ) : (
                  libraryItems.slice(0, 9).map((item) => {
                    const itemImage = getItemImage(item);
                    const itemKey = String(item.id ?? item.slug ?? getItemLabel(item));
                    const active =
                      String(selectedAsset?.id ?? selectedAsset?.slug ?? '') ===
                      String(item.id ?? item.slug ?? '');

                    return (
                      <button
                        key={itemKey}
                        type="button"
                        title={getItemLabel(item)}
                        onClick={() => setSelectedAsset(item)}
                        className={cn(
                          'aspect-square overflow-hidden rounded-md border bg-white/[0.04] transition',
                          active
                            ? 'border-amber-300 ring-2 ring-amber-300/20'
                            : 'border-white/10 hover:border-white/28'
                        )}
                      >
                        <img src={itemImage} alt="" className="size-full object-cover" />
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,1.05fr)] xl:grid-cols-1">
              <section className="rounded-lg border border-white/10 bg-white/[0.075] p-4 shadow-2xl shadow-black/25 backdrop-blur">
                <SectionTitle icon={UploadCloud} title="Source image" />

                <label
                  htmlFor="source-file"
                  className={cn(
                    'mt-4 flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/16 bg-gray-950/58 p-4 text-center transition hover:border-white/34 hover:bg-gray-950/72',
                    isSubmitting && 'pointer-events-none opacity-70'
                  )}
                >
                  {sourcePreview ? (
                    <img
                      src={sourcePreview}
                      alt=""
                      className="max-h-[360px] w-full rounded-md object-contain"
                    />
                  ) : (
                    <>
                      <span className="flex size-16 items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-white/54">
                        <ImageIcon className="size-7" />
                      </span>
                      <span className="mt-4 flex max-w-full items-center gap-2 text-sm font-semibold text-white">
                        <UploadCloud className="size-4 text-amber-200" />
                        <span className="truncate">Select image</span>
                      </span>
                      <span className="mt-2 text-xs text-white/40">PNG, JPEG, WEBP · 10 MB max</span>
                    </>
                  )}
                </label>
                <Input
                  id="source-file"
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  className="sr-only"
                  onChange={(event) => selectSourceFile(event.target.files?.[0] ?? null)}
                  disabled={isSubmitting}
                />

                {sourceFile ? (
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/62">
                    <span className="min-w-0 truncate">{sourceFile.name}</span>
                    <span className="shrink-0">{formatFileSize(sourceFile.size)}</span>
                  </div>
                ) : null}
              </section>

              <section className="rounded-lg border border-white/10 bg-white/[0.075] p-4 shadow-2xl shadow-black/25 backdrop-blur">
                <SectionTitle icon={WandSparkles} title="Prompt and parameters" />

                <div className="mt-4 space-y-5">
                  <div>
                    <Label htmlFor="image-video-prompt" className="mb-2 text-white/72">
                      Prompt
                    </Label>
                    <textarea
                      id="image-video-prompt"
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      rows={6}
                      disabled={isSubmitting}
                      className="min-h-36 w-full resize-none rounded-lg border border-white/10 bg-gray-950/65 px-3 py-3 text-sm leading-6 text-white shadow-xs outline-none transition placeholder:text-white/28 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/20 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {promptPresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPrompt(preset)}
                        disabled={isSubmitting}
                        className="min-h-16 rounded-md border border-white/10 bg-white/[0.045] px-3 py-2 text-left text-xs font-medium leading-5 text-white/58 transition hover:border-white/24 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-2 text-white/72">Aspect ratio</Label>
                      <div className="grid grid-cols-3 rounded-lg border border-white/10 bg-gray-950/55 p-1">
                        {aspectRatios.map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={cn(
                              'h-10 rounded-md text-sm font-semibold transition-colors',
                              aspectRatio === option
                                ? 'bg-white text-gray-950 shadow-sm'
                                : 'text-white/52 hover:text-white'
                            )}
                            onClick={() => setAspectRatio(option)}
                            disabled={isSubmitting}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 text-white/72">Duration</Label>
                      <div className="grid grid-cols-3 rounded-lg border border-white/10 bg-gray-950/55 p-1">
                        {durations.map((duration) => (
                          <button
                            key={duration}
                            type="button"
                            className={cn(
                              'h-10 rounded-md text-sm font-semibold transition-colors',
                              durationSeconds === duration
                                ? 'bg-white text-gray-950 shadow-sm'
                                : 'text-white/52 hover:text-white'
                            )}
                            onClick={() => setDurationSeconds(duration)}
                            disabled={isSubmitting}
                          >
                            {duration}s
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {error ? (
                    <div
                      className="flex items-start gap-2 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100"
                      role="alert"
                    >
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={!canSubmit}
                    className="h-12 w-full rounded-lg bg-white text-sm font-bold text-gray-950 shadow-lg shadow-black/20 hover:bg-amber-100"
                  >
                    {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    {submitLabel ?? 'Generate video'}
                  </Button>
                </div>
              </section>
            </div>

            <aside className="grid gap-4">
              <section className="flex min-h-[520px] flex-col rounded-lg border border-white/10 bg-white/[0.075] p-4 shadow-2xl shadow-black/25 backdrop-blur">
                <SectionTitle
                  icon={Clapperboard}
                  title="Result"
                  meta={jobStatus?.progressLabel ?? jobStatus?.status ?? 'Idle'}
                />

                <div className="mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gray-950/78">
                  {selectedResultUrl ? (
                    selectedResultUrl.endsWith('.mp4') || selectedResultUrl.includes('.mp4?') ? (
                      <video
                        src={selectedResultUrl}
                        controls
                        playsInline
                        className="max-h-[620px] w-full object-contain"
                      />
                    ) : (
                      <img
                        src={selectedResultUrl}
                        alt=""
                        className="max-h-[620px] w-full object-contain"
                      />
                    )
                  ) : (
                    <EmptyMedia label="Video preview" />
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/54">
                  <span className="flex items-center gap-2">
                    {jobStatus?.status === 'succeeded' ? (
                      <CheckCircle2 className="size-4 text-emerald-300" />
                    ) : jobId ? (
                      <Loader2 className="size-4 animate-spin text-amber-200" />
                    ) : (
                      <Clock3 className="size-4 text-white/34" />
                    )}
                    {jobId ? `Job ${jobId}` : 'No active job'}
                  </span>
                  <span>{aspectRatio} · {durationSeconds}s</span>
                </div>

                {jobStatus?.errorMessage ? (
                  <p className="mt-3 text-sm text-red-200">{jobStatus.errorMessage}</p>
                ) : null}
              </section>

              <section className="rounded-lg border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <SectionTitle icon={Clock3} title="History" />
                <div className="mt-4 space-y-2">
                  {historyPlaceholders.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-md border border-white/10 bg-gray-950/46 p-2"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded bg-white/[0.06] text-white/38">
                        <Film className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white/72">{item}</p>
                        <p className="mt-0.5 text-xs text-white/34">Draft slot {index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </form>
      </div>
    </section>
  );
}
