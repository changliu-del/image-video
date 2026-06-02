'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Palette,
  PanelsTopLeft,
  Plus,
  Shirt,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  UserRound,
  WandSparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type AspectRatio = '9:16' | '1:1' | '16:9';
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

const modelTypes = [
  'Fashion model',
  'No model',
  'Partial body',
  'Lifestyle talent',
];

const sceneOptions = [
  'Minimal studio',
  'Street editorial',
  'Luxury boutique',
  'Soft daylight',
];

const stylePresets = [
  'Clean commercial',
  'High fashion',
  'Korean catalog',
  'Premium social ad',
];

function getItemImage(item: LibraryItem | null) {
  if (!item) return '';
  return item.thumbnailUrl ?? item.previewUrl ?? item.imageUrl ?? item.publicUrl ?? '';
}

function getItemLabel(item: LibraryItem) {
  return item.title ?? item.name ?? item.slug ?? String(item.id ?? 'Asset');
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

function itemKey(item: LibraryItem) {
  return String(item.id ?? item.slug ?? getItemLabel(item));
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

function SectionTitle({
  icon: Icon,
  title,
  note,
}: {
  icon: typeof Shirt;
  title: string;
  note?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.07] text-amber-200">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {note ? <p className="text-xs text-white/45">{note}</p> : null}
        </div>
      </div>
    </div>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label className="mb-2 text-xs font-medium uppercase text-white/45">
        {label}
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option)}
            className={cn(
              'min-h-10 rounded-lg border px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
              value === option
                ? 'border-amber-300/70 bg-amber-300/15 text-white shadow-[0_0_24px_rgba(251,191,36,0.12)]'
                : 'border-white/10 bg-white/[0.045] text-white/68 hover:border-white/20 hover:bg-white/[0.075] hover:text-white'
            )}
          >
            {option}
          </button>
        ))}
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
  active: boolean;
  onClick: () => void;
}) {
  const image = getItemImage(item);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group min-w-0 rounded-lg border bg-white/[0.045] p-2 text-left transition',
        active
          ? 'border-emerald-300/70 shadow-[0_0_28px_rgba(110,231,183,0.12)]'
          : 'border-white/10 hover:border-white/25 hover:bg-white/[0.07]'
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-gray-950">
        {image ? (
          <img
            src={image}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-white/35">
            <ImageIcon className="size-5" />
          </div>
        )}
        {active ? (
          <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-300 text-gray-950">
            <CheckCircle2 className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-xs font-medium text-white/72">
        {getItemLabel(item)}
      </p>
    </button>
  );
}

export function ApparelWorkbench() {
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [templates, setTemplates] = useState<LibraryItem[]>([]);
  const [assets, setAssets] = useState<LibraryItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LibraryItem | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<LibraryItem | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [modelType, setModelType] = useState(modelTypes[0]);
  const [scene, setScene] = useState(sceneOptions[0]);
  const [style, setStyle] = useState(stylePresets[0]);
  const [prompt, setPrompt] = useState(
    'Preserve the garment details, improve drape, lighting, and merchandising appeal.'
  );
  const [negativePrompt, setNegativePrompt] = useState(
    'distorted logo, extra sleeves, broken hands, low resolution'
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [strength, setStrength] = useState(64);
  const [variants, setVariants] = useState(4);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = Boolean(submitLabel);
  const selectedResultUrl = resultUrl(jobStatus);
  const selectedTemplateId = selectedTemplate?.id ?? selectedTemplate?.slug;
  const selectedAssetId = selectedAsset?.id ?? selectedAsset?.slug;
  const sourcePreview = primaryPreview ?? getItemImage(selectedAsset);
  const sourceName = primaryFile?.name ?? (selectedAsset ? getItemLabel(selectedAsset) : null);

  const canSubmit = useMemo(() => {
    return !isSubmitting && Boolean(primaryFile || selectedAssetId);
  }, [isSubmitting, primaryFile, selectedAssetId]);

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
    let cancelled = false;

    async function loadLibrary() {
      setIsLoadingLibrary(true);
      try {
        const params = new URLSearchParams({ type: 'apparel_image' });
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

    setSelectedAsset(null);
    setPrimaryFile(file);
  }

  function selectLibraryAsset(asset: LibraryItem) {
    setError(null);
    setPrimaryFile(null);
    setSelectedAsset(asset);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!primaryFile && !selectedAssetId) {
      setError('Upload an apparel image or select one from the library.');
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);

    try {
      setSubmitLabel(primaryFile ? 'Uploading apparel image' : 'Preparing library asset');
      const inputAssetId = primaryFile ? await uploadAsset(primaryFile) : selectedAssetId;

      setSubmitLabel('Starting generation');
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'apparel_image',
          inputAssetId,
          templateId: selectedTemplateId,
          templateSlug: selectedTemplate?.slug ?? selectedTemplateId,
          prompt: [
            prompt.trim(),
            `Model type: ${modelType}.`,
            `Scene: ${scene}.`,
            `Style: ${style}.`,
            negativePrompt.trim() ? `Avoid: ${negativePrompt.trim()}.` : '',
          ]
            .filter(Boolean)
            .join(' '),
          aspectRatio,
          strength,
          variants,
        },
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
    <section className="min-h-full px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase text-white/65">
              <Sparkles className="size-3.5 text-amber-300" />
              Apparel image studio
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white md:text-4xl">
              Turn a garment shot into a polished fashion commerce visual.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
              Upload or pick a source, choose model, scene, and style direction,
              then generate campaign-ready apparel imagery.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-white/[0.055] p-2 text-center">
            {['Upload', 'Direct', 'Preview'].map((step, index) => (
              <div key={step} className="min-w-20 px-2 py-1.5">
                <div className="text-xs font-semibold text-amber-200">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="mt-1 text-xs text-white/55">{step}</div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 xl:grid-cols-[370px_minmax(0,1fr)]"
        >
          <div className="space-y-4">
            <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <SectionTitle
                icon={UploadCloud}
                title="Source apparel"
                note="PNG, JPEG, or WEBP up to 10 MB"
              />
              <label
                htmlFor="apparel-file"
                className={cn(
                  'mt-4 flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/15 bg-gray-950/55 p-3 text-center transition hover:border-amber-300/60 hover:bg-gray-950/75',
                  isSubmitting && 'pointer-events-none opacity-70'
                )}
              >
                {sourcePreview ? (
                  <img
                    src={sourcePreview}
                    alt=""
                    className="max-h-48 w-full rounded-md object-contain"
                  />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-full bg-white/10 text-white/55">
                    <ImageIcon className="size-6" />
                  </span>
                )}
                <span className="flex max-w-full items-center gap-2 truncate text-sm font-medium text-white/80">
                  <Plus className="size-4 shrink-0 text-amber-200" />
                  <span className="truncate">{sourceName ?? 'Upload apparel image'}</span>
                </span>
              </label>
              <Input
                id="apparel-file"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                className="sr-only"
                onChange={(event) => selectPrimaryFile(event.target.files?.[0] ?? null)}
                disabled={isSubmitting}
              />
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <SectionTitle
                icon={PanelsTopLeft}
                title="Material library"
                note={
                  isLoadingLibrary
                    ? 'Loading assets'
                    : `${templates.length + assets.length} library items`
                }
              />
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-white/40">
                    Base templates
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.length === 0 ? (
                      <p className="col-span-2 rounded-lg border border-dashed border-white/12 px-3 py-4 text-sm text-white/42">
                        No templates yet
                      </p>
                    ) : (
                      templates.slice(0, 4).map((template) => (
                        <LibraryTile
                          key={itemKey(template)}
                          item={template}
                          active={
                            String(selectedTemplate?.id ?? selectedTemplate?.slug) ===
                            String(template.id ?? template.slug)
                          }
                          onClick={() => setSelectedTemplate(template)}
                        />
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-white/40">
                    Apparel assets
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {assets.length === 0 ? (
                      <p className="col-span-3 rounded-lg border border-dashed border-white/12 px-3 py-4 text-sm text-white/42">
                        No assets yet
                      </p>
                    ) : (
                      assets.slice(0, 6).map((asset) => (
                        <LibraryTile
                          key={itemKey(asset)}
                          item={asset}
                          active={
                            String(selectedAsset?.id ?? selectedAsset?.slug) ===
                            String(asset.id ?? asset.slug)
                          }
                          onClick={() => selectLibraryAsset(asset)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="flex min-h-[640px] flex-col rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <SectionTitle
                  icon={WandSparkles}
                  title="Preview result"
                  note={jobStatus?.progressLabel ?? jobStatus?.status ?? 'Ready'}
                />
                {jobStatus?.status === 'succeeded' ? (
                  <CheckCircle2 className="size-5 text-emerald-300" />
                ) : jobId ? (
                  <Loader2 className="size-5 animate-spin text-white/45" />
                ) : null}
              </div>

              <div className="mt-4 flex flex-1 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(3,7,18,0.98))]">
                {selectedResultUrl ? (
                  <img
                    src={selectedResultUrl}
                    alt=""
                    className="max-h-[720px] w-full object-contain"
                  />
                ) : (
                  <div className="grid w-full gap-4 p-5 sm:grid-cols-[0.8fr_1.2fr] sm:items-center">
                    <div className="mx-auto aspect-[3/4] w-full max-w-[250px] overflow-hidden rounded-lg border border-white/10 bg-white/[0.05]">
                      {sourcePreview ? (
                        <img src={sourcePreview} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center gap-3 text-white/35">
                          <Shirt className="size-10" />
                          <span className="text-sm">Source image</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-lg border border-white/10 bg-white/[0.055] p-4">
                        <p className="text-xs font-semibold uppercase text-emerald-200">
                          Generation recipe
                        </p>
                        <div className="mt-3 grid gap-2 text-sm text-white/66">
                          <p>{modelType}</p>
                          <p>{scene}</p>
                          <p>{style}</p>
                          <p>{aspectRatio} output</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {['Detail lock', 'Studio light', 'Fabric texture', 'Clean edges'].map(
                          (item) => (
                            <div
                              key={item}
                              className="rounded-lg border border-white/10 bg-white/[0.045] p-3 text-xs font-medium text-white/55"
                            >
                              {item}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {jobStatus?.errorMessage ? (
                <p className="mt-3 text-sm text-red-300">{jobStatus.errorMessage}</p>
              ) : null}
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
              <SectionTitle icon={UserRound} title="Creative direction" />
              <div className="mt-4 space-y-5">
                <OptionGroup
                  label="Model type"
                  options={modelTypes}
                  value={modelType}
                  onChange={setModelType}
                  disabled={isSubmitting}
                />
                <OptionGroup
                  label="Scene"
                  options={sceneOptions}
                  value={scene}
                  onChange={setScene}
                  disabled={isSubmitting}
                />
                <OptionGroup
                  label="Style"
                  options={stylePresets}
                  value={style}
                  onChange={setStyle}
                  disabled={isSubmitting}
                />

                <div>
                  <Label
                    htmlFor="apparel-prompt"
                    className="mb-2 text-xs font-medium uppercase text-white/45"
                  >
                    Style prompt
                  </Label>
                  <textarea
                    id="apparel-prompt"
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    rows={4}
                    disabled={isSubmitting}
                    className="min-h-28 w-full rounded-lg border border-white/10 bg-gray-950/55 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-amber-300/70 focus:ring-3 focus:ring-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="apparel-negative-prompt"
                    className="mb-2 text-xs font-medium uppercase text-white/45"
                  >
                    Negative prompt
                  </Label>
                  <textarea
                    id="apparel-negative-prompt"
                    value={negativePrompt}
                    onChange={(event) => setNegativePrompt(event.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    className="min-h-20 w-full rounded-lg border border-white/10 bg-gray-950/55 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-amber-300/70 focus:ring-3 focus:ring-amber-300/15 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-4 rounded-lg border border-white/10 bg-gray-950/35 p-3">
                  <SectionTitle icon={SlidersHorizontal} title="Parameters" />
                  <div>
                    <Label className="mb-2 text-xs font-medium uppercase text-white/45">
                      Aspect ratio
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {aspectRatios.map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setAspectRatio(option)}
                          className={cn(
                            'h-10 rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
                            aspectRatio === option
                              ? 'border-emerald-300/70 bg-emerald-300/15 text-white'
                              : 'border-white/10 bg-white/[0.045] text-white/60 hover:border-white/20'
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label
                        htmlFor="apparel-strength"
                        className="text-xs font-medium uppercase text-white/45"
                      >
                        Creative strength
                      </Label>
                      <span className="text-xs font-semibold text-white/65">
                        {strength}
                      </span>
                    </div>
                    <input
                      id="apparel-strength"
                      type="range"
                      min="20"
                      max="90"
                      value={strength}
                      onChange={(event) => setStrength(Number(event.target.value))}
                      disabled={isSubmitting}
                      className="w-full accent-amber-300"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="apparel-variants"
                      className="mb-2 text-xs font-medium uppercase text-white/45"
                    >
                      Variants
                    </Label>
                    <select
                      id="apparel-variants"
                      value={variants}
                      onChange={(event) => setVariants(Number(event.target.value))}
                      disabled={isSubmitting}
                      className="h-10 w-full rounded-lg border border-white/10 bg-gray-950/80 px-3 text-sm text-white outline-none transition focus:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {[1, 2, 4].map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {error ? (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-12 w-full rounded-lg bg-white text-sm font-semibold text-gray-950 shadow-[0_18px_45px_rgba(255,255,255,0.12)] hover:bg-white/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Palette className="size-4" />
                  )}
                  {submitLabel ?? 'Generate apparel image'}
                </Button>
              </div>
            </section>
          </div>
        </form>
      </div>
    </section>
  );
}
