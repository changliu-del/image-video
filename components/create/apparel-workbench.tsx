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
import {
  BlueBanner,
  CanvasStage,
  ChoiceGrid,
  ExampleProducts,
  IconButtonCard,
  PanelSection,
  ResultCard,
  SegmentedOptions,
  StudioPanel,
  UploadDropzone,
} from '@/components/create/workbench-ui';
import {
  apparelWorkbenchCopy,
  bannerCopy,
  commonWorkbenchCopy,
} from '@/components/create/workbench-copy';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { cn } from '@/lib/utils';

type AspectRatio = '9:16' | '1:1' | '16:9';
type CreationMode = 'quick' | 'advanced';
type ApparelModelType = 'fashion_model' | 'no_model' | 'partial_body' | 'lifestyle_talent';
type ApparelScene = 'minimal_studio' | 'street_editorial' | 'luxury_boutique' | 'soft_daylight';
type ApparelStyle = 'clean_commercial' | 'high_fashion' | 'korean_catalog' | 'premium_social_ad';

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
const modelTypeValues: ApparelModelType[] = [
  'fashion_model',
  'no_model',
  'partial_body',
  'lifestyle_talent',
];
const sceneValues: ApparelScene[] = [
  'minimal_studio',
  'street_editorial',
  'luxury_boutique',
  'soft_daylight',
];
const styleValues: ApparelStyle[] = [
  'clean_commercial',
  'high_fashion',
  'korean_catalog',
  'premium_social_ad',
];

function getItemImage(item: LibraryItem | null) {
  if (!item) return '';
  return item.thumbnailUrl ?? item.previewUrl ?? item.imageUrl ?? item.publicUrl ?? item.asset ?? '';
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
        <span className="flex size-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-500">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          {note ? <p className="text-xs text-gray-400">{note}</p> : null}
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
      <Label className="mb-2 text-xs font-medium uppercase text-gray-400">
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
                ? 'border-indigo-300 bg-indigo-50 text-indigo-600 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/40 hover:text-indigo-600'
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
        'group min-w-0 rounded-lg border bg-white p-2 text-left transition',
        active
          ? 'border-emerald-300 shadow-sm'
          : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/40'
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
        {image ? (
          <img
            src={image}
            alt=""
            className="size-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-gray-300">
            <ImageIcon className="size-5" />
          </div>
        )}
        {active ? (
          <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-300 text-gray-950">
            <CheckCircle2 className="size-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-xs font-medium text-gray-600">
        {getItemLabel(item)}
      </p>
    </button>
  );
}

export function ApparelWorkbench() {
  const locale = useDashboardLocale();
  const copy = apparelWorkbenchCopy[locale];
  const commonCopy = commonWorkbenchCopy[locale];
  const banner = bannerCopy[locale];
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [templates, setTemplates] = useState<LibraryItem[]>([]);
  const [assets, setAssets] = useState<LibraryItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<LibraryItem | null>(null);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [creationMode, setCreationMode] = useState<CreationMode>('quick');
  const [activeIdeaGroup, setActiveIdeaGroup] = useState(0);
  const [modelType, setModelType] = useState<ApparelModelType>('fashion_model');
  const [scene, setScene] = useState<ApparelScene>('minimal_studio');
  const [style, setStyle] = useState<ApparelStyle>('clean_commercial');
  const [prompt, setPrompt] = useState(() => copy.defaultPrompt);
  const [negativePrompt, setNegativePrompt] = useState(() => copy.defaultNegativePrompt);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [strength, setStrength] = useState(64);
  const [variants, setVariants] = useState(4);
  const [exampleOffset, setExampleOffset] = useState(0);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = Boolean(submitLabel);
  const selectedResultUrl = resultUrl(jobStatus);
  const selectedTemplateId = selectedTemplate?.id ?? selectedTemplate?.slug;
  const sourcePreview = primaryPreview;
  const sourceName = primaryFile?.name ?? null;
  const modelTypeOptions = modelTypeValues.map((value, index) => ({
    value,
    label: copy.modelTypes[index] ?? value,
  }));
  const sceneOptions = sceneValues.map((value, index) => ({
    value,
    label: copy.sceneOptions[index] ?? value,
  }));
  const styleOptions = styleValues.map((value, index) => ({
    value,
    label: copy.stylePresets[index] ?? value,
  }));
  const selectedModelTypeLabel =
    copy.modelTypes[modelTypeValues.indexOf(modelType)] ?? modelType;
  const selectedSceneLabel = copy.sceneOptions[sceneValues.indexOf(scene)] ?? scene;
  const selectedStyleLabel = copy.stylePresets[styleValues.indexOf(style)] ?? style;
  const activePromptGroup = copy.promptIdeaGroups[activeIdeaGroup] ?? copy.promptIdeaGroups[0];

  const canSubmit = useMemo(() => {
    return !isSubmitting && Boolean(primaryFile);
  }, [isSubmitting, primaryFile]);

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
        const params = new URLSearchParams({
          locale,
          pageSize: '12',
          type: 'image',
        });
        const templateResponse = await fetch(`/api/templates?${params.toString()}`);
        const templateBody = templateResponse.ok
          ? await templateResponse.json()
          : { list: [] };

        if (!cancelled) {
          const nextTemplates = normalizeItems(templateBody);
          setTemplates(nextTemplates);
          setAssets([]);
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

    if (!primaryFile) {
      setError(copy.uploadRequired);
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);

    try {
      setSubmitLabel(copy.uploadingImage);
      const inputAssetId = await uploadAsset(primaryFile, commonCopy);

      setSubmitLabel(copy.startingGeneration);
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'apparel_image',
          inputAssetId,
          templateId: selectedTemplateId,
          templateSlug: selectedTemplate?.slug ?? selectedTemplateId,
          prompt: [
            prompt.trim(),
            `${copy.modelType}: ${selectedModelTypeLabel}.`,
            `${copy.scene}: ${selectedSceneLabel}.`,
            `${copy.style}: ${selectedStyleLabel}.`,
            negativePrompt.trim() ? `Avoid: ${negativePrompt.trim()}.` : '',
          ]
            .filter(Boolean)
            .join(' '),
          aspectRatio,
          strength,
          variants,
        },
        commonCopy.generationStartError
      );
      const nextJobId = generation.jobId ?? generation.id;

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

  function applyPromptIdea(idea: string) {
    setCreationMode('quick');
    setPrompt(idea);
  }

  function applyTemplate(template: LibraryItem | null | undefined) {
    if (!template) return;

    setSelectedTemplate(template);
    setCreationMode('advanced');
    setPrompt((current) => {
      const label = getItemLabel(template);
      const trimmed = current.trim();
      return trimmed.includes(label) ? trimmed : `${trimmed} ${label}`.trim();
    });
  }

  const baseLibraryImages = templates.map(getItemImage).filter(Boolean);
  const libraryStart = baseLibraryImages.length ? exampleOffset % baseLibraryImages.length : 0;
  const libraryImages = [
    ...baseLibraryImages.slice(libraryStart),
    ...baseLibraryImages.slice(0, libraryStart),
  ].slice(0, 6);
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
              className="h-12 flex-1 rounded-full bg-[#b8b8f6] text-sm font-bold text-white shadow-none hover:bg-[#a8a8ef] disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Palette className="size-4" />}
              {submitLabel ?? commonCopy.generateNow}
              <span className="font-semibold opacity-90">{commonCopy.credits(8)}</span>
            </Button>
          </div>
        }
      >
        <PanelSection title={copy.productLayout} required>
          <UploadDropzone
            id="apparel-file"
            preview={sourcePreview}
            fileName={sourceName}
            emptyText={copy.productEmpty}
            hint={copy.productHint}
            disabled={isSubmitting}
            onChange={(files) => selectPrimaryFile(files?.[0] ?? null)}
          />
        </PanelSection>

        <PanelSection title={copy.size} required>
          <SegmentedOptions
            options={aspectRatios}
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={isSubmitting}
          />
        </PanelSection>

        <PanelSection title={copy.inspiration} required>
          <div className="mb-3 flex rounded-lg border border-indigo-200 bg-white">
            <button
              type="button"
              onClick={() => {
                setCreationMode('quick');
                applyPromptIdea(activePromptGroup.prompts[0] ?? copy.defaultPrompt);
              }}
              className={cn(
                'h-11 flex-1 rounded-l-lg text-sm font-bold transition',
                creationMode === 'quick'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-white text-gray-500 hover:text-indigo-600'
              )}
            >
              {copy.quick}
              <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                {copy.hot}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('advanced')}
              className={cn(
                'h-11 flex-1 rounded-r-lg text-sm font-bold transition',
                creationMode === 'advanced'
                  ? 'bg-white text-indigo-600'
                  : 'bg-gray-100 text-gray-500 hover:text-indigo-600'
              )}
            >
              {copy.advanced}
            </button>
          </div>
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
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-bold text-gray-900">{copy.promptIdeas}</span>
              <button
                type="button"
                onClick={() => applyTemplate(selectedTemplate ?? templates[0])}
                disabled={templates.length === 0}
                className="font-semibold text-gray-500 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copy.addFromTemplate}
              </button>
            </div>
            <div className="grid grid-cols-[78px_1fr] gap-3">
              <div className="space-y-2 text-sm font-semibold text-gray-500">
                {copy.promptIdeaGroups.map((group, index) => (
                  <button
                    key={group.category}
                    type="button"
                    onClick={() => {
                      setActiveIdeaGroup(index);
                      applyPromptIdea(group.prompts[0] ?? copy.defaultPrompt);
                    }}
                    className={cn(
                      'block w-full rounded-lg px-2 py-1 text-left',
                      activeIdeaGroup === index && 'bg-indigo-50 text-indigo-600'
                    )}
                  >
                    {group.category}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activePromptGroup.prompts.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => applyPromptIdea(idea)}
                    className="min-h-12 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-gray-600 transition hover:border-indigo-200 hover:text-indigo-600"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PanelSection>

        <PanelSection
          title={copy.library}
          hint={isLoadingLibrary ? commonCopy.loadingLibrary : commonCopy.templateCount(templates.length)}
        >
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-bold text-gray-400">{copy.templateMaterials}</h3>
              <div className="grid grid-cols-2 gap-2">
                {templates.length === 0 ? (
                  <p className="col-span-2 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                    {commonCopy.noTemplates}
                  </p>
                ) : (
                  templates.slice(0, 4).map((template) => {
                    const image = getItemImage(template);
                    const active =
                      String(selectedTemplate?.id ?? selectedTemplate?.slug) ===
                      String(template.id ?? template.slug);

                    return (
                      <button
                        key={itemKey(template)}
                        type="button"
                        onClick={() => setSelectedTemplate(template)}
                        className={cn(
                          'rounded-lg border bg-white p-2 text-left transition',
                          active ? 'border-indigo-500 text-indigo-600' : 'border-gray-200 text-gray-600'
                        )}
                      >
                        <div className="aspect-square overflow-hidden rounded-md bg-gray-100">
                          {image ? <img src={image} alt="" className="size-full object-cover" /> : null}
                        </div>
                        <p className="mt-2 truncate text-xs font-bold">{getItemLabel(template)}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </PanelSection>

        <PanelSection title={copy.settings}>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 text-xs font-bold text-gray-500">{copy.modelType}</Label>
              <ChoiceGrid
                options={modelTypeOptions}
                value={modelType}
                onChange={setModelType}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label className="mb-2 text-xs font-bold text-gray-500">{copy.scene}</Label>
              <ChoiceGrid
                options={sceneOptions}
                value={scene}
                onChange={setScene}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label className="mb-2 text-xs font-bold text-gray-500">{copy.style}</Label>
              <ChoiceGrid
                options={styleOptions}
                value={style}
                onChange={setStyle}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label htmlFor="apparel-strength" className="text-xs font-bold text-gray-500">
                  {copy.strength}
                </Label>
                <span className="text-xs font-bold text-indigo-600">{strength}</span>
              </div>
              <input
                id="apparel-strength"
                type="range"
                min="20"
                max="90"
                value={strength}
                onChange={(event) => setStrength(Number(event.target.value))}
                disabled={isSubmitting}
                className="w-full accent-indigo-500"
              />
            </div>
            <div>
              <Label className="mb-2 text-xs font-bold text-gray-500">{copy.variants}</Label>
              <SegmentedOptions
                options={[1, 2, 4]}
                value={variants}
                onChange={setVariants}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="apparel-negative-prompt" className="mb-2 text-xs font-bold text-gray-500">
                {copy.negative}
              </Label>
              <textarea
                id="apparel-negative-prompt"
                value={negativePrompt}
                onChange={(event) => setNegativePrompt(event.target.value)}
                rows={3}
                disabled={isSubmitting}
                className="min-h-20 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm leading-6 text-gray-800 outline-none transition focus:border-indigo-300 focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
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
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <IconButtonCard
                  icon={ImageIcon}
                  label={commonCopy.chooseFromLibrary}
                  onClick={() => applyTemplate(selectedTemplate ?? templates[0])}
                  disabled={templates.length === 0}
                />
                <IconButtonCard
                  icon={UploadCloud}
                  label={commonCopy.uploadImage}
                  onClick={() => document.getElementById('apparel-file-canvas')?.click()}
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
