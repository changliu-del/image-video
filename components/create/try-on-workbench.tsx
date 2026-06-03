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
import {
  BlueBanner,
  CanvasStage,
  ExampleProducts,
  IconButtonCard,
  PanelSection,
  ResultCard,
  SegmentedOptions,
  StudioPanel,
  UploadDropzone,
} from '@/components/create/workbench-ui';
import {
  bannerCopy,
  commonWorkbenchCopy,
  tryOnWorkbenchCopy,
} from '@/components/create/workbench-copy';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { getTryOnCreditCost } from '@/lib/generations/credit-costs';
import { cn } from '@/lib/utils';

type TryOnMode = 'single' | 'multi';
type ModelSource = 'library' | 'custom';
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
  asset?: string;
  type?: string;
};

type ModelCatalogItem = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  tags?: string[];
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
const modeValues: TryOnMode[] = ['single', 'multi'];
const poseValues: PosePreset[] = ['auto', 'front', 'editorial', 'runway'];
const backgroundValues: BackgroundPreset[] = ['studio', 'street', 'minimal', 'boutique'];
const fitValues: FitPreset[] = ['natural', 'tailored', 'relaxed'];

function getItemImage(item: LibraryItem) {
  return item.thumbnailUrl ?? item.previewUrl ?? item.imageUrl ?? item.publicUrl ?? item.asset ?? '';
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

function normalizeModelItems(value: unknown): ModelCatalogItem[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  return Array.isArray(record.items) ? (record.items as ModelCatalogItem[]) : [];
}

function getModelAssetImage(item: ModelCatalogItem | null) {
  if (!item) return '';
  return item.thumbnailUrl ?? item.imageUrl ?? item.videoUrl ?? '';
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
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-gray-800">
          <Icon className="size-4 text-indigo-500" />
          <span className="truncate">{title}</span>
        </div>
        <UploadCloud className="size-4 text-gray-400" />
      </div>
      <label
        htmlFor={id}
        className={cn(
          'flex min-h-64 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-center transition hover:border-indigo-200 hover:bg-indigo-50/50',
          disabled && 'pointer-events-none opacity-70'
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="max-h-56 w-full rounded-md object-contain" />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-300">
            <ImageIcon className="size-6" />
          </span>
        )}
        <span className="mt-4 flex max-w-full items-center gap-2 truncate text-sm font-medium text-gray-700">
          <UploadCloud className="size-4 shrink-0 text-indigo-500" />
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
      <Label className="mb-2 text-gray-600">{label}</Label>
      <div className="grid gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                'flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition',
                value === option.value
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:bg-white hover:text-indigo-600'
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
          ? 'border-indigo-300 bg-indigo-50'
          : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'
      )}
      onClick={onClick}
    >
      <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
        {image ? (
          <img
            src={image}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-gray-300">
            <ImageIcon className="size-5" />
          </span>
        )}
      </div>
      <div className="mt-2 truncate text-xs font-semibold text-gray-600">
        {getItemLabel(item)}
      </div>
    </button>
  );
}

export function TryOnWorkbench() {
  const locale = useDashboardLocale();
  const copy = tryOnWorkbenchCopy[locale];
  const commonCopy = commonWorkbenchCopy[locale];
  const banner = bannerCopy[locale];
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [garmentFiles, setGarmentFiles] = useState<File[]>([]);
  const [modelPreview, setModelPreview] = useState<string | null>(null);
  const [garmentPreviews, setGarmentPreviews] = useState<string[]>([]);
  const [modelSource, setModelSource] = useState<ModelSource>('library');
  const [mode, setMode] = useState<TryOnMode>('single');
  const [pose, setPose] = useState<PosePreset>('auto');
  const [background, setBackground] = useState<BackgroundPreset>('studio');
  const [fit, setFit] = useState<FitPreset>('natural');
  const [preserveFace, setPreserveFace] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [templates, setTemplates] = useState<LibraryItem[]>([]);
  const [assets, setAssets] = useState<LibraryItem[]>([]);
  const [modelAssets, setModelAssets] = useState<ModelCatalogItem[]>([]);
  const [selectedModelAsset, setSelectedModelAsset] = useState<ModelCatalogItem | null>(null);
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<LibraryItem | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [exampleOffset, setExampleOffset] = useState(0);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = Boolean(submitLabel);
  const selectedResultUrl = resultUrl(jobStatus);
  const selectedModelPreview =
    modelSource === 'custom' ? modelPreview : getModelAssetImage(selectedModelAsset);
  const selectedModelLabel =
    modelSource === 'custom' ? modelFile?.name : selectedModelAsset?.title;
  const modeOptions = modeValues.map((value) => ({
    value,
    label: copy.modeOptions[value],
  }));

  const canSubmit = useMemo(() => {
    const hasModel = modelSource === 'custom' ? Boolean(modelFile) : Boolean(selectedModelAsset);
    if (isSubmitting || !hasModel) return false;
    return mode === 'single' ? garmentFiles.length >= 1 : garmentFiles.length >= 2;
  }, [garmentFiles.length, isSubmitting, mode, modelFile, modelSource, selectedModelAsset]);

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
        const templateParams = new URLSearchParams({
          locale,
          pageSize: '12',
          type: 'image',
        });
        const modelParams = new URLSearchParams({
          locale,
          limit: '24',
        });
        const [templateResponse, modelResponse] = await Promise.all([
          fetch(`/api/templates?${templateParams.toString()}`),
          fetch(`/api/model-assets?${modelParams.toString()}`),
        ]);

        const [templateBody, modelBody] = await Promise.all([
          templateResponse.ok ? templateResponse.json() : Promise.resolve({ list: [] }),
          modelResponse.ok ? modelResponse.json() : Promise.resolve({ items: [] }),
        ]);

        if (!cancelled) {
          const nextTemplates = normalizeItems(templateBody);
          const nextModelAssets = normalizeModelItems(modelBody);
          setTemplates(nextTemplates);
          setAssets([]);
          setModelAssets(nextModelAssets);
          setSelectedLibraryItem((current) => current ?? nextTemplates[0] ?? null);
          setSelectedModelAsset((current) => current ?? nextModelAssets[0] ?? null);
          if (nextModelAssets.length === 0) {
            setModelSource('custom');
          }
        }
      } finally {
        if (!cancelled) setIsLoadingLibrary(false);
      }
    }

    loadLibrary();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (!jobId || terminalStatus(jobStatus?.status)) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const nextStatus = await fetchJobStatus(jobId, commonCopy);
        if (!cancelled) setJobStatus(nextStatus);
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

    const validationError = validateImage(file, commonCopy);
    if (validationError) {
      setModelFile(null);
      setError(validationError);
      return;
    }

    setSelectedModelAsset(null);
    setModelSource('custom');
    setModelFile(file);
  }

  function selectGarmentFiles(files: FileList | null) {
    setError(null);
    const nextFiles = Array.from(files ?? []);
    const validationError = nextFiles.map((file) => validateImage(file, commonCopy)).find(Boolean);

    if (validationError) {
      setGarmentFiles([]);
      setError(validationError);
      return;
    }

    setGarmentFiles(mode === 'single' ? nextFiles.slice(0, 1) : nextFiles.slice(0, 4));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const useCustomModel = modelSource === 'custom';

    if ((useCustomModel && !modelFile) || (!useCustomModel && !selectedModelAsset)) {
      setError(copy.selectModelError);
      return;
    }

    if (mode === 'single' && garmentFiles.length === 0) {
      setError(copy.selectSingleGarmentError);
      return;
    }

    if (mode === 'multi' && garmentFiles.length < 2) {
      setError(copy.selectMultiGarmentError);
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);

    try {
      setSubmitLabel(useCustomModel ? copy.uploadingModel : copy.preparingModel);
      const modelAssetId = useCustomModel && modelFile ? await uploadAsset(modelFile, commonCopy) : undefined;
      const garmentAssetIds = await Promise.all(
        garmentFiles.map(async (file, index) => {
          setSubmitLabel(copy.uploadingGarment(index + 1));
          return uploadAsset(file, commonCopy);
        })
      );

      setSubmitLabel(copy.startingTryOn);
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'try_on',
          tryOnMode: mode,
          ...(modelAssetId
            ? { modelAssetId }
            : { modelCatalogAssetId: selectedModelAsset?.id }),
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
        commonCopy.generationStartError
      );
      const nextJobId = generation.jobId ?? generation.generationId ?? generation.id;

      if (!nextJobId) {
        throw new Error(commonCopy.missingJobError);
      }

      setJobId(nextJobId);
      setJobStatus({
        id: nextJobId,
        status: generation.status ?? 'queued',
        progressLabel: commonCopy.queued,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : commonCopy.generationStartError
      );
    } finally {
      setSubmitLabel(null);
    }
  }

  function selectLibraryModel(model: ModelCatalogItem) {
    setModelSource('library');
    setModelFile(null);
    setSelectedModelAsset(model);
  }

  function useCustomModelUpload(inputId = 'try-on-model') {
    setModelSource('custom');
    setSelectedModelAsset(null);
    document.getElementById(inputId)?.click();
  }

  function applyLibraryTemplate(template: LibraryItem | null | undefined) {
    if (!template) return;

    setSelectedLibraryItem(template);
    setPrompt((current) => {
      const label = getItemLabel(template);
      const trimmed = current.trim();
      return trimmed.includes(label) ? trimmed : `${trimmed} ${label}`.trim();
    });
  }

  function chooseFromLibrary() {
    if (modelAssets[0]) {
      selectLibraryModel(modelAssets[0]);
    }
    applyLibraryTemplate(selectedLibraryItem ?? templates[0]);
  }

  const baseLibraryImages = [...templates, ...assets].map(getItemImage).filter(Boolean);
  const libraryStart = baseLibraryImages.length ? exampleOffset % baseLibraryImages.length : 0;
  const libraryImages = [
    ...baseLibraryImages.slice(libraryStart),
    ...baseLibraryImages.slice(0, libraryStart),
  ].slice(0, 6);
  const statusLabel = jobStatus?.progressLabel ?? jobStatus?.status ?? (jobId ? commonCopy.generating : null);
  const garmentLabel =
    garmentFiles.length > 1 ? copy.garmentCount(garmentFiles.length) : garmentFiles[0]?.name;

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
              <Images className="size-4" />
              {commonCopy.taskFlow}
            </button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 flex-1 rounded-full bg-[#b8b8f6] text-sm font-bold text-white shadow-none hover:bg-[#a8a8ef] disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <WandSparkles className="size-4" />}
              {submitLabel ?? commonCopy.generateNow}
              <span className="font-semibold opacity-90">
                {commonCopy.credits(getTryOnCreditCost(mode))}
              </span>
            </Button>
          </div>
        }
      >
        <PanelSection title={copy.uploadGarment} required>
          <div className="grid gap-3">
            <UploadDropzone
              id="try-on-model"
              preview={selectedModelPreview}
              fileName={selectedModelLabel}
              emptyText={copy.modelEmpty}
              hint={copy.modelHint}
              disabled={isSubmitting}
              onChange={selectModelFile}
            />
            <UploadDropzone
              id="try-on-garments"
              preview={garmentPreviews[0]}
              fileName={garmentLabel}
              emptyText={mode === 'single' ? copy.garmentSingleEmpty : copy.garmentMultiEmpty}
              hint={copy.garmentHint}
              multiple={mode === 'multi'}
              disabled={isSubmitting}
              onChange={selectGarmentFiles}
            >
              {garmentPreviews.length > 1 ? (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {garmentPreviews.map((preview, index) => (
                    <img
                      key={preview}
                      src={preview}
                      alt=""
                      className="aspect-square rounded-md border border-gray-200 object-cover"
                      title={garmentFiles[index]?.name}
                    />
                  ))}
                </div>
              ) : null}
            </UploadDropzone>
          </div>
        </PanelSection>

        <PanelSection title={copy.mode} required>
          <SegmentedOptions
            options={modeOptions}
            value={mode}
            onChange={(nextMode) => {
              setMode(nextMode);
              setGarmentFiles((files) => (nextMode === 'single' ? files.slice(0, 1) : files));
            }}
            disabled={isSubmitting}
            columns={2}
          />
        </PanelSection>

        <PanelSection title={copy.chooseModel} required>
          <div className="mb-3 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setModelSource('library');
                setModelFile(null);
                setSelectedModelAsset((current) => current ?? modelAssets[0] ?? null);
              }}
              disabled={modelAssets.length === 0}
              className={cn(
                'h-10 rounded-md text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
                modelSource === 'library'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-indigo-600'
              )}
            >
              {copy.officialModel}
            </button>
            <button
              type="button"
              onClick={() => useCustomModelUpload()}
              className={cn(
                'h-10 rounded-md text-sm font-bold transition',
                modelSource === 'custom'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-indigo-600'
              )}
            >
              {copy.customModel}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {modelAssets.length === 0 ? (
              <p className="col-span-4 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                {copy.noOfficialModels}
              </p>
            ) : (
              modelAssets.slice(0, 8).map((model) => {
                const image = getModelAssetImage(model);
                const active = selectedModelAsset?.id === model.id && !modelFile;

                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => selectLibraryModel(model)}
                    className="group text-center"
                  >
                    <span
                      className={cn(
                        'block aspect-square overflow-hidden rounded-lg border bg-gray-100 transition group-hover:border-indigo-300',
                        active ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'
                      )}
                    >
                      {model.videoUrl && image === model.videoUrl ? (
                        <video src={image} muted playsInline className="size-full object-cover" />
                      ) : (
                        <img src={image} alt="" className="size-full object-cover" />
                      )}
                    </span>
                    <span className="mt-1 block truncate text-xs font-semibold text-gray-600">
                      {model.title}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </PanelSection>

        <PanelSection title={copy.featureAdjust}>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 text-xs font-bold text-gray-500">{copy.pose}</Label>
              <div className="grid grid-cols-2 gap-2">
                {poseValues.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setPose(option)}
                    className={cn(
                      'h-10 rounded-lg border text-sm font-bold transition',
                      pose === option
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 bg-white text-gray-600'
                    )}
                  >
                    {copy.poseOptions[option]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 text-xs font-bold text-gray-500">{copy.background}</Label>
              <div className="grid grid-cols-2 gap-2">
                {backgroundValues.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setBackground(option)}
                    className={cn(
                      'h-10 rounded-lg border text-sm font-bold transition',
                      background === option
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 bg-white text-gray-600'
                    )}
                  >
                    {copy.backgroundOptions[option]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 text-xs font-bold text-gray-500">{copy.fit}</Label>
              <div className="grid grid-cols-3 gap-2">
                {fitValues.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setFit(option)}
                    className={cn(
                      'h-10 rounded-lg border text-sm font-bold transition',
                      fit === option
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 bg-white text-gray-600'
                    )}
                  >
                    {copy.fitOptions[option]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PanelSection>

        <PanelSection title={copy.description}>
          <textarea
            id="try-on-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={4}
            disabled={isSubmitting}
            placeholder={copy.promptPlaceholder}
            className="min-h-28 w-full resize-none rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <label className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700">
            {copy.preserveIdentity}
            <input
              type="checkbox"
              checked={preserveFace}
              onChange={(event) => setPreserveFace(event.target.checked)}
              disabled={isSubmitting}
              className="size-4 accent-indigo-500"
            />
          </label>
        </PanelSection>

        <PanelSection
          title={copy.library}
          hint={isLoadingLibrary ? commonCopy.loadingLibrary : commonCopy.templateCount(templates.length)}
        >
          <div className="grid grid-cols-3 gap-2">
            {templates.length === 0 ? (
              <p className="col-span-3 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                {copy.noTemplates}
              </p>
            ) : (
              templates.slice(0, 6).map((template) => {
                const image = getItemImage(template);
                const active =
                  String(selectedLibraryItem?.id ?? selectedLibraryItem?.slug) ===
                  String(template.id ?? template.slug);

                return (
                  <button
                    key={String(template.id ?? template.slug ?? image)}
                    type="button"
                    onClick={() => applyLibraryTemplate(template)}
                    className={cn(
                      'aspect-square overflow-hidden rounded-lg border bg-gray-100',
                      active ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'
                    )}
                    title={getItemLabel(template)}
                  >
                    {image ? <img src={image} alt="" className="size-full object-cover" /> : null}
                  </button>
                );
              })
            )}
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
        banner={<BlueBanner title={banner.title} label={copy.banner} images={libraryImages.length ? libraryImages.slice(0, 4) : undefined} />}
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
              <div className="grid gap-4 md:grid-cols-2">
                <UploadDropzone
                  id="try-on-model-canvas"
                  preview={selectedModelPreview}
                  fileName={selectedModelLabel}
                  emptyText={copy.modelCanvasEmpty}
                  hint={copy.modelCanvasHint}
                  disabled={isSubmitting}
                  onChange={selectModelFile}
                />
                <UploadDropzone
                  id="try-on-garments-canvas"
                  preview={garmentPreviews[0]}
                  fileName={garmentLabel}
                  emptyText={copy.garmentCanvasEmpty}
                  hint={copy.garmentHint}
                  multiple={mode === 'multi'}
                  disabled={isSubmitting}
                  onChange={selectGarmentFiles}
                />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <IconButtonCard
                  icon={Images}
                  label={commonCopy.chooseFromLibrary}
                  onClick={chooseFromLibrary}
                  disabled={modelAssets.length === 0 && templates.length === 0}
                />
                <IconButtonCard
                  icon={UploadCloud}
                  label={commonCopy.uploadImage}
                  onClick={() => useCustomModelUpload('try-on-model-canvas')}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {jobStatus?.errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {jobStatus.errorMessage}
            </p>
          ) : null}

          <ExampleProducts
            images={libraryImages.length ? libraryImages : undefined}
            title={commonCopy.examples}
            refreshLabel={commonCopy.refresh}
            onRefresh={() => setExampleOffset((offset) => offset + 1)}
          />
        </div>
      </CanvasStage>
    </form>
  );
}
