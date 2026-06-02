'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  Images,
  Layers3,
  Loader2,
  Palette,
  Shirt,
  Sparkles,
  UploadCloud,
  UserRound,
  WandSparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type TryOnMode = 'single' | 'multi';
type PosePreset = 'auto' | 'front' | 'editorial' | 'runway';
type BackgroundPreset = 'studio' | 'street' | 'minimal' | 'boutique';
type FitPreset = 'natural' | 'tailored' | 'relaxed';

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
const modeOptions: { value: TryOnMode; label: string; icon: typeof Shirt }[] = [
  { value: 'single', label: 'Single look', icon: Shirt },
  { value: 'multi', label: 'Multi look', icon: Layers3 },
];
const poseOptions: { value: PosePreset; label: string }[] = [
  { value: 'auto', label: 'Auto pose' },
  { value: 'front', label: 'Front view' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'runway', label: 'Runway' },
];
const backgroundOptions: { value: BackgroundPreset; label: string }[] = [
  { value: 'studio', label: 'Studio' },
  { value: 'street', label: 'Street' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'boutique', label: 'Boutique' },
];
const fitOptions: { value: FitPreset; label: string }[] = [
  { value: 'natural', label: 'Natural fit' },
  { value: 'tailored', label: 'Tailored' },
  { value: 'relaxed', label: 'Relaxed' },
];

function getItemImage(item: LibraryItem) {
  return item.thumbnailUrl ?? item.previewUrl ?? item.imageUrl ?? item.publicUrl ?? '';
}

function getItemLabel(item: LibraryItem) {
  return item.title ?? item.name ?? item.slug ?? String(item.id ?? 'Library item');
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

function validateImage(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Use a PNG, JPEG, or WEBP image.';
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be 10 MB or smaller.';
  }

  return null;
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

function buildTryOnPrompt(input: {
  prompt: string;
  pose: PosePreset;
  background: BackgroundPreset;
  fit: FitPreset;
  preserveFace: boolean;
}) {
  const guidance = [
    input.prompt.trim(),
    `pose: ${input.pose}`,
    `background: ${input.background}`,
    `fit: ${input.fit}`,
    input.preserveFace ? 'preserve the model identity and facial details' : '',
    'high-end fashion ecommerce try-on, realistic fabric drape, clean lighting',
  ].filter(Boolean);

  return guidance.join('; ');
}

function UploadPanel({
  id,
  title,
  icon: Icon,
  preview,
  fileName,
  multiple,
  disabled,
  onChange,
  children,
}: {
  id: string;
  title: string;
  icon: typeof Shirt;
  preview?: string | null;
  fileName?: string;
  multiple?: boolean;
  disabled?: boolean;
  onChange: (files: FileList | null) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white">
          <Icon className="size-4 text-amber-300" />
          <span className="truncate">{title}</span>
        </div>
        <UploadCloud className="size-4 text-white/45" />
      </div>
      <label
        htmlFor={id}
        className={cn(
          'flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-gray-950/70 p-3 text-center transition hover:border-amber-300/60 hover:bg-gray-900',
          disabled && 'pointer-events-none opacity-70'
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="max-h-56 w-full rounded-md object-contain" />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] text-white/55">
            <ImageIcon className="size-6" />
          </span>
        )}
        <span className="mt-4 flex max-w-full items-center gap-2 truncate text-sm font-medium text-white/78">
          <UploadCloud className="size-4 shrink-0 text-emerald-300" />
          <span className="truncate">{fileName ?? 'Upload image'}</span>
        </span>
      </label>
      <Input
        id={id}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => onChange(event.target.files)}
        disabled={disabled}
      />
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: typeof Shirt }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <Label className="mb-2 text-white/70">{label}</Label>
      <div className="grid gap-1 rounded-lg border border-white/10 bg-gray-950/70 p-1">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition',
                value === option.value
                  ? 'bg-white text-gray-950 shadow-lg shadow-black/20'
                  : 'text-white/62 hover:bg-white/[0.08] hover:text-white'
              )}
              onClick={() => onChange(option.value)}
              disabled={disabled}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LibraryTile({
  item,
  active,
  onClick,
}: {
  item: LibraryItem;
  active?: boolean;
  onClick: () => void;
}) {
  const image = getItemImage(item);

  return (
    <button
      type="button"
      className={cn(
        'group min-w-0 rounded-lg border p-2 text-left transition',
        active
          ? 'border-amber-300 bg-amber-300/10'
          : 'border-white/10 bg-white/[0.045] hover:border-white/25 hover:bg-white/[0.075]'
      )}
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden rounded-md bg-gray-950">
        {image ? (
          <img
            src={image}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-white/35">
            <ImageIcon className="size-5" />
          </span>
        )}
      </div>
      <div className="mt-2 truncate text-xs font-semibold text-white/72">
        {getItemLabel(item)}
      </div>
    </button>
  );
}

export function TryOnWorkbench() {
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [garmentFiles, setGarmentFiles] = useState<File[]>([]);
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [garmentPreviews, setGarmentPreviews] = useState<string[]>([]);
  const [mode, setMode] = useState<TryOnMode>('single');
  const [pose, setPose] = useState<PosePreset>('auto');
  const [background, setBackground] = useState<BackgroundPreset>('studio');
  const [fit, setFit] = useState<FitPreset>('natural');
  const [preserveFace, setPreserveFace] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [templates, setTemplates] = useState<LibraryItem[]>([]);
  const [assets, setAssets] = useState<LibraryItem[]>([]);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = Boolean(submitLabel);
  const selectedResultUrl = resultUrl(jobStatus);

  const canSubmit = useMemo(() => {
    if (isSubmitting || !modelFile) return false;
    return mode === 'single' ? garmentFiles.length >= 1 : garmentFiles.length >= 2;
  }, [garmentFiles.length, isSubmitting, mode, modelFile]);

  useEffect(() => {
    if (!modelFile) {
      setModelPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(modelFile);
    setModelPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [modelFile]);

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
        const params = new URLSearchParams({ type: 'try_on' });
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
          setSelectedLibraryItem((current) => current ?? nextTemplates[0] ?? nextAssets[0] ?? null);
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

  function selectModelFile(files: FileList | null) {
    setError(null);
    const file = files?.[0] ?? null;
    if (!file) {
      setModelFile(null);
      return;
    }

    const validationError = validateImage(file);
    if (validationError) {
      setModelFile(null);
      setError(validationError);
      return;
    }

    setModelFile(file);
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

    setGarmentFiles(mode === 'single' ? nextFiles.slice(0, 1) : nextFiles.slice(0, 4));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!modelFile) {
      setError('Select a model image.');
      return;
    }

    if (mode === 'single' && garmentFiles.length === 0) {
      setError('Select one garment image.');
      return;
    }

    if (mode === 'multi' && garmentFiles.length < 2) {
      setError('Multi look needs at least two garment images.');
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);

    try {
      setSubmitLabel('Uploading model');
      const modelAssetId = await uploadAsset(modelFile);
      const garmentAssetIds = await Promise.all(
        garmentFiles.map(async (file, index) => {
          setSubmitLabel(`Uploading garment ${index + 1}`);
          return uploadAsset(file);
        })
      );

      setSubmitLabel('Starting try-on');
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'try_on',
          tryOnMode: mode,
          modelAssetId,
          garmentAssetId: garmentAssetIds[0],
          garmentAssetIds,
          prompt: buildTryOnPrompt({
            prompt,
            pose,
            background,
            fit,
            preserveFace,
          }),
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
        submitError instanceof Error
          ? submitError.message
          : 'Generation could not be started.'
      );
    } finally {
      setSubmitLabel(null);
    }
  }

  return (
    <section className="min-h-full flex-1 overflow-hidden bg-gray-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_78%_8%,rgba(251,191,36,0.14),transparent_30%),linear-gradient(135deg,#020617,#111827_48%,#030712)]" />

      <form onSubmit={handleSubmit} className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/25 backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold uppercase text-white/62">
              <Sparkles className="size-3.5 text-amber-300" />
              GPTImage smart try-on
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white md:text-4xl">
              AI fashion try-on for single garments and full outfit stacks.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62 md:text-base">
              Upload a model, mix one or more clothing images, tune pose and scene, then preview the generated try-on without leaving the canvas.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['2 inputs', 'model plus garment'],
              ['4 garments', 'multi-image outfit'],
              ['5 credits', 'single try-on'],
            ].map(([stat, label]) => (
              <div key={stat} className="rounded-lg border border-white/10 bg-gray-950/45 p-4">
                <div className="text-2xl font-bold text-white">{stat}</div>
                <div className="mt-1 text-xs font-semibold uppercase text-white/45">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/25 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Material library</h2>
                <p className="mt-1 text-xs text-white/45">
                  {isLoadingLibrary ? 'Loading assets' : `${templates.length + assets.length} items`}
                </p>
              </div>
              <Images className="size-5 text-emerald-300" />
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase text-white/45">Looks</h3>
                <div className="grid grid-cols-2 gap-2">
                  {templates.length === 0 ? (
                    <p className="col-span-2 rounded-lg border border-dashed border-white/15 p-3 text-sm text-white/42">
                      No templates
                    </p>
                  ) : (
                    templates.slice(0, 6).map((template) => (
                      <LibraryTile
                        key={String(template.id ?? template.slug ?? getItemLabel(template))}
                        item={template}
                        active={selectedLibraryItem === template}
                        onClick={() => setSelectedLibraryItem(template)}
                      />
                    ))
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase text-white/45">Uploads</h3>
                <div className="grid grid-cols-2 gap-2">
                  {assets.length === 0 ? (
                    <p className="col-span-2 rounded-lg border border-dashed border-white/15 p-3 text-sm text-white/42">
                      No saved assets
                    </p>
                  ) : (
                    assets.slice(0, 8).map((asset) => (
                      <LibraryTile
                        key={String(asset.id ?? asset.slug ?? getItemLabel(asset))}
                        item={asset}
                        active={selectedLibraryItem === asset}
                        onClick={() => setSelectedLibraryItem(asset)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <UploadPanel
                id="try-on-model"
                title="Model image"
                icon={UserRound}
                preview={modelPreview}
                fileName={modelFile?.name}
                disabled={isSubmitting}
                onChange={selectModelFile}
              />

              <UploadPanel
                id="try-on-garments"
                title={mode === 'single' ? 'Garment image' : 'Garment images'}
                icon={Shirt}
                preview={garmentPreviews[0]}
                fileName={
                  garmentFiles.length > 1
                    ? `${garmentFiles.length} garments selected`
                    : garmentFiles[0]?.name
                }
                multiple={mode === 'multi'}
                disabled={isSubmitting}
                onChange={selectGarmentFiles}
              >
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
              </UploadPanel>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/25 backdrop-blur">
              <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                <SegmentedControl
                  label="Try-on mode"
                  value={mode}
                  options={modeOptions}
                  disabled={isSubmitting}
                  onChange={(nextMode) => {
                    setMode(nextMode);
                    setGarmentFiles((files) =>
                      nextMode === 'single' ? files.slice(0, 1) : files
                    );
                  }}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <SegmentedControl
                    label="Pose"
                    value={pose}
                    options={poseOptions}
                    disabled={isSubmitting}
                    onChange={setPose}
                  />
                  <SegmentedControl
                    label="Background"
                    value={background}
                    options={backgroundOptions}
                    disabled={isSubmitting}
                    onChange={setBackground}
                  />
                  <SegmentedControl
                    label="Fit"
                    value={fit}
                    options={fitOptions}
                    disabled={isSubmitting}
                    onChange={setFit}
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <Label htmlFor="try-on-prompt" className="mb-2 text-white/70">
                    Styling direction
                  </Label>
                  <textarea
                    id="try-on-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={4}
                    disabled={isSubmitting}
                    placeholder="e.g. premium editorial lighting, preserve garment color, realistic folds"
                    className="min-h-28 w-full rounded-lg border border-white/10 bg-gray-950/70 px-3 py-2 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-emerald-300/60 focus:ring-3 focus:ring-emerald-300/15 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-gray-950/70 p-3 text-sm font-semibold text-white/72">
                    Preserve identity
                    <input
                      type="checkbox"
                      checked={preserveFace}
                      onChange={(event) => setPreserveFace(event.target.checked)}
                      disabled={isSubmitting}
                      className="size-4 accent-emerald-300"
                    />
                  </label>
                  <div className="rounded-lg border border-white/10 bg-gray-950/70 p-3">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-white/45">
                      <Palette className="size-3.5 text-amber-300" />
                      Selected source
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold text-white/75">
                      {selectedLibraryItem ? getItemLabel(selectedLibraryItem) : 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {error ? (
                <div
                  className="mt-4 flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={!canSubmit}
                className="mt-5 h-12 w-full rounded-lg bg-white text-sm font-bold text-gray-950 shadow-xl shadow-black/25 hover:bg-white/90"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <WandSparkles className="size-4" />
                )}
                {submitLabel ?? 'Generate try-on'}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <section className="flex min-h-[620px] flex-col rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/25 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Result preview</h2>
                <p className="mt-1 text-xs text-white/45">
                  {jobStatus?.progressLabel ?? jobStatus?.status ?? 'Ready when inputs are set'}
                </p>
              </div>
              {jobStatus?.status === 'succeeded' ? (
                <CheckCircle2 className="size-5 text-emerald-300" />
              ) : jobId ? (
                <Loader2 className="size-5 animate-spin text-white/50" />
              ) : (
                <Sparkles className="size-5 text-amber-300" />
              )}
            </div>

            <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-gray-950">
              {selectedResultUrl ? (
                selectedResultUrl.endsWith('.mp4') ? (
                  <video
                    src={selectedResultUrl}
                    controls
                    playsInline
                    className="max-h-[720px] w-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedResultUrl}
                    alt=""
                    className="max-h-[720px] w-full object-contain"
                  />
                )
              ) : (
                <div className="px-6 text-center text-sm text-white/42">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06]">
                    <WandSparkles className="size-7 text-white/55" />
                  </div>
                  Generated try-on images will appear here.
                </div>
              )}
            </div>

            {jobStatus?.errorMessage ? (
              <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
                {jobStatus.errorMessage}
              </p>
            ) : null}
          </section>
        </div>
      </form>
    </section>
  );
}
