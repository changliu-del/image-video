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
  WandSparkles,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CanvasStage,
  IconButtonCard,
  PanelSection,
  ResultCard,
  SegmentedOptions,
  StudioPanel,
  UploadDropzone,
} from '@/components/create/workbench-ui';
import {
  commonWorkbenchCopy,
  tryOnWorkbenchCopy,
} from '@/components/create/workbench-copy';
import { TemplatePromptPicker } from '@/components/create/template-prompt-picker';
import {
  getLibraryItemAssetId as getItemAssetId,
  getLibraryItemImage as getItemImage,
  getLibraryItemLabel as getItemLabel,
  normalizeLibraryItems as normalizeItems,
  type WorkbenchLibraryItem as LibraryItem,
} from '@/components/create/library-item-utils';
import { refreshDashboardUser } from '@/lib/dashboard/user-cache';
import {
  AuthenticationRequiredError,
  isAuthenticationRequiredError,
  redirectToSignIn,
} from '@/lib/auth/client-login';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { getTryOnCreditCost } from '@/lib/generations/credit-costs';
import {
  normalizePublicTemplateDetail,
  type PublicTemplateDetailItem,
} from '@/lib/templates/public-client';
import {
  localizeModelCategoryTag,
  parseModelCategoryParts,
  type ModelCategoryParts,
} from '@/lib/model-assets/localization';
import { cn } from '@/lib/utils';

type TryOnMode = 'single' | 'multi';
type TryOnAspectRatio = '1:1' | '3:4' | '9:16';
type ModelAgeFilter = 'all' | 'child' | 'youth' | 'middle' | 'senior';
type ModelGenderFilter = 'all' | 'female' | 'male';
type ModelStyleFilter = 'all' | string;

type ModelTemplateItem = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  categoryParts?: ModelCategoryParts;
  tags?: string[];
  displayTags?: string[];
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
  nextPollMs?: number | null;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MODEL_ASSET_LIMIT = 96;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const modeValues: TryOnMode[] = ['multi', 'single'];
const tryOnAspectRatios: TryOnAspectRatio[] = ['1:1', '3:4', '9:16'];
const modelAgeFilters: ModelAgeFilter[] = [
  'all',
  'child',
  'youth',
  'middle',
  'senior',
];
const modelGenderFilters: ModelGenderFilter[] = ['all', 'female', 'male'];
const modelAgeTags: Record<ModelAgeFilter, string | null> = {
  all: null,
  child: '儿童',
  youth: '青年',
  middle: '中年',
  senior: '老年',
};
const modelGenderTags: Record<ModelGenderFilter, string | null> = {
  all: null,
  female: '女',
  male: '男',
};

function normalizeModelItems(value: unknown): ModelTemplateItem[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  return Array.isArray(record.items) ? (record.items as ModelTemplateItem[]) : [];
}

function getModelAssetImage(item: ModelTemplateItem | null) {
  if (!item) return '';
  return item.imageUrl ?? item.thumbnailUrl ?? item.videoUrl ?? '';
}

function getModelDetailImage(item: ModelTemplateItem | null) {
  if (!item) return '';
  return item.imageUrl ?? item.thumbnailUrl ?? item.videoUrl ?? '';
}

function getModelDescriptionLines(item: ModelTemplateItem | null) {
  return (item?.description ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getModelTags(item: ModelTemplateItem | null) {
  return (item?.displayTags ?? item?.tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => {
      const normalized = tag.toLowerCase();
      return tag && normalized !== 'model' && normalized !== 'wanxiang' && normalized !== 'new';
    })
    .slice(0, 8);
}

function modelHasTag(item: ModelTemplateItem, tag: string | null) {
  if (!tag) return true;
  return (item.tags ?? []).some((itemTag) => itemTag.trim() === tag);
}

function getModelCategoryParts(item: ModelTemplateItem) {
  return item.categoryParts ?? parseModelCategoryParts((item.tags ?? []).join('/'));
}

function getModelStyleTag(item: ModelTemplateItem) {
  return getModelCategoryParts(item).style;
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

  if (response.status === 401) {
    throw new AuthenticationRequiredError();
  }

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

function CompactSettingGroup<T extends string | number>({
  label,
  required,
  options,
  value,
  onChange,
  disabled,
  columns,
}: {
  label: string;
  required?: boolean;
  options: readonly (T | { value: T; label: string })[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  columns: 2 | 3;
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
      <div className="mb-1.5 text-xs font-bold text-gray-500">
        {required ? <span className="mr-0.5 text-red-500">*</span> : null}
        {label}
      </div>
      <SegmentedOptions
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled}
        columns={columns}
        compact
      />
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

export function TryOnWorkbench({
  initialPrompt = '',
  initialTemplateId = '',
}: {
  initialPrompt?: string;
  initialTemplateId?: string;
}) {
  const locale = useDashboardLocale();
  const copy = tryOnWorkbenchCopy[locale];
  const commonCopy = commonWorkbenchCopy[locale];
  const starterPrompt = initialPrompt.trim();
  const starterTemplateId = initialTemplateId.trim();
  const [garmentFiles, setGarmentFiles] = useState<Array<File | null>>([
    null,
    null,
  ]);
  const [garmentPreviews, setGarmentPreviews] = useState<string[]>([]);
  const [mode, setMode] = useState<TryOnMode>('multi');
  const [aspectRatio, setAspectRatio] = useState<TryOnAspectRatio>('1:1');
  const [prompt, setPrompt] = useState(() => starterPrompt);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    () => starterTemplateId || null
  );
  const [modelAssets, setModelAssets] = useState<ModelTemplateItem[]>([]);
  const [modelAgeFilter, setModelAgeFilter] = useState<ModelAgeFilter>('all');
  const [modelGenderFilter, setModelGenderFilter] =
    useState<ModelGenderFilter>('all');
  const [modelStyleFilter, setModelStyleFilter] =
    useState<ModelStyleFilter>('all');
  const [historyItems, setHistoryItems] = useState<LibraryItem[]>([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedModelAsset, setSelectedModelAsset] = useState<ModelTemplateItem | null>(null);
  const [modelDetailAsset, setModelDetailAsset] = useState<ModelTemplateItem | null>(null);
  const [selectedGarmentAssets, setSelectedGarmentAssets] = useState<
    LibraryItem[]
  >([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = Boolean(submitLabel);
  const selectedResultUrl = resultUrl(jobStatus);
  const localGarmentFiles = useMemo(
    () => garmentFiles.filter((file): file is File => Boolean(file)),
    [garmentFiles]
  );
  const selectedGarmentAssetIds = useMemo(
    () => selectedGarmentAssets.map(getItemAssetId).filter(Boolean),
    [selectedGarmentAssets]
  );
  const selectedGarmentAsset = selectedGarmentAssets[0] ?? null;
  const selectedGarmentPreviewTiles = selectedGarmentAssets
    .map((asset) => ({
      image: getItemImage(asset),
      title: getItemLabel(asset),
    }))
    .filter((item) => item.image);
  const upperGarmentPreview =
    garmentPreviews[0] || selectedGarmentPreviewTiles[0]?.image || '';
  const lowerGarmentPreview =
    garmentPreviews[1] || selectedGarmentPreviewTiles[1]?.image || '';
  const upperGarmentLabel =
    garmentFiles[0]?.name ?? selectedGarmentPreviewTiles[0]?.title;
  const lowerGarmentLabel =
    garmentFiles[1]?.name ?? selectedGarmentPreviewTiles[1]?.title;
  const garmentWorkbenchCards =
    mode === 'single'
      ? [
          {
            key: 'single',
            image: upperGarmentPreview,
            title: upperGarmentLabel,
          },
        ]
      : [
          {
            key: 'upper',
            image: upperGarmentPreview,
            title: upperGarmentLabel,
          },
          {
            key: 'lower',
            image: lowerGarmentPreview,
            title: lowerGarmentLabel,
          },
        ];
  const garmentInputCount =
    localGarmentFiles.length + selectedGarmentAssetIds.length;
  const modeOptions = modeValues.map((value) => ({
    value,
    label: copy.modeOptions[value],
  }));
  const modelAgeOptions = modelAgeFilters.map((value) => ({
    value,
    label: copy.modelAgeOptions[value],
  }));
  const modelGenderOptions = modelGenderFilters.map((value) => ({
    value,
    label: copy.modelGenderOptions[value],
  }));
  const modelStyleOptions = useMemo(() => {
    const styles = Array.from(
      new Set(modelAssets.map(getModelStyleTag).filter(Boolean))
    );

    return [
      {
        value: 'all',
        label: copy.modelAgeOptions.all,
      },
      ...styles.map((style) => ({
        value: style,
        label: localizeModelCategoryTag(style, locale) || style,
      })),
    ];
  }, [copy.modelAgeOptions.all, locale, modelAssets]);
  const filteredModelAssets = useMemo(
    () =>
      modelAssets.filter(
        (model) =>
          modelHasTag(model, modelAgeTags[modelAgeFilter]) &&
          modelHasTag(model, modelGenderTags[modelGenderFilter]) &&
          modelHasTag(
            model,
            modelStyleFilter === 'all' ? null : modelStyleFilter
          )
      ),
    [modelAgeFilter, modelAssets, modelGenderFilter, modelStyleFilter]
  );

  const canSubmit = useMemo(() => {
    if (isSubmitting || !selectedModelAsset) return false;
    return mode === 'single'
      ? garmentInputCount >= 1
      : garmentInputCount >= 2;
  }, [garmentInputCount, isSubmitting, mode, selectedModelAsset]);

  useEffect(() => {
    const objectUrls = garmentFiles.map((file) =>
      file ? URL.createObjectURL(file) : ''
    );
    setGarmentPreviews(objectUrls);
    return () =>
      objectUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
  }, [garmentFiles]);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      setIsLoadingModels(true);
      try {
        const modelParams = new URLSearchParams({
          locale,
          limit: String(MODEL_ASSET_LIMIT),
        });
        const modelResponse = await fetch(`/api/model-assets?${modelParams.toString()}`);
        const modelBody = modelResponse.ok
          ? await modelResponse.json()
          : { items: [] };

        if (!cancelled) {
          const nextModelAssets = normalizeModelItems(modelBody);
          setModelAssets(nextModelAssets);
          setSelectedModelAsset((current) => current ?? nextModelAssets[0] ?? null);
        }
      } finally {
        if (!cancelled) setIsLoadingModels(false);
      }
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (isLoadingModels) return;

    setSelectedModelAsset((current) => {
      if (
        current &&
        filteredModelAssets.some((model) => model.id === current.id)
      ) {
        return current;
      }

      return filteredModelAssets[0] ?? null;
    });
  }, [filteredModelAssets, isLoadingModels]);

  useEffect(() => {
    if (hasLoadedHistory) return;

    let cancelled = false;

    async function loadHistory() {
      setIsLoadingHistory(true);

      try {
        const params = new URLSearchParams({
          generationType: 'try_on',
          pageSize: '12',
        });
        const response = await fetch(`/api/user-media?${params.toString()}`);

        if (!response.ok) {
          throw new Error('history-load-failed');
        }

        const body = await response.json();
        if (!cancelled) {
          setHistoryItems(normalizeItems(body));
        }
      } catch {
        if (!cancelled) {
          setHistoryItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingHistory(false);
          setHasLoadedHistory(true);
        }
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [hasLoadedHistory]);

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
        if (!detail || detail.type !== 'try_on') return;

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

  function updateMode(nextMode: TryOnMode) {
    setMode(nextMode);
    if (nextMode === 'single') {
      setGarmentFiles((files) => [files[0] ?? null, null]);
      setSelectedGarmentAssets((assets) => assets.slice(0, 1));
    }
  }

  function selectGarmentFileAt(slotIndex: 0 | 1, files: FileList | null) {
    setError(null);
    const file = files?.[0] ?? null;

    if (!file) {
      setGarmentFiles((current) => {
        const nextFiles: Array<File | null> = [current[0] ?? null, current[1] ?? null];
        nextFiles[slotIndex] = null;
        return nextFiles;
      });
      return;
    }

    const validationError = validateImage(file, commonCopy);
    if (validationError) {
      setGarmentFiles((current) => {
        const nextFiles: Array<File | null> = [current[0] ?? null, current[1] ?? null];
        nextFiles[slotIndex] = null;
        return nextFiles;
      });
      setError(validationError);
      return;
    }

    setGarmentFiles((current) => {
      const nextFiles: Array<File | null> = [current[0] ?? null, current[1] ?? null];
      nextFiles[slotIndex] = file;
      if (mode === 'single') nextFiles[1] = null;
      return nextFiles;
    });
    setSelectedGarmentAssets([]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedModelAsset) {
      setError(copy.selectModelError);
      return;
    }

    if (mode === 'single' && garmentInputCount === 0) {
      setError(copy.selectSingleGarmentError);
      return;
    }

    if (mode === 'multi' && garmentInputCount < 2) {
      setError(copy.selectMultiGarmentError);
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);

    try {
      setSubmitLabel(copy.preparingModel);
      const uploadedGarmentAssetIds = await Promise.all(
        localGarmentFiles.map(async (file, index) => {
          setSubmitLabel(copy.uploadingGarment(index + 1));
          return uploadAsset(file, commonCopy);
        })
      );
      const garmentAssetIds = [
        ...selectedGarmentAssetIds,
        ...uploadedGarmentAssetIds,
      ];

      setSubmitLabel(copy.startingTryOn);
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'try_on',
          tryOnMode: mode,
          modelTemplateId: selectedModelAsset.id,
          garmentAssetId: garmentAssetIds[0],
          garmentAssetIds,
          ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
          aspectRatio,
          prompt: prompt.trim(),
        },
        commonCopy.generationStartError
      );
      const nextJobId = generation.jobId ?? generation.generationId ?? generation.id;

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

  function selectLibraryModel(model: ModelTemplateItem) {
    setSelectedModelAsset(model);
  }

  function applyTemplate(template: PublicTemplateDetailItem) {
    setError(null);
    setSelectedTemplateId(template.id);
    setPrompt(template.prompt);
  }

  function selectLibraryGarment(asset: LibraryItem | null | undefined) {
    if (!asset || !getItemAssetId(asset)) return;

    setError(null);
    setSelectedGarmentAssets([asset]);
    setGarmentFiles([null, null]);
    setPrompt((current) => {
      const label = getItemLabel(asset);
      const trimmed = current.trim();
      return trimmed.includes(label) ? trimmed : `${trimmed} ${label}`.trim();
    });
  }

  function toggleLibraryGarment(asset: LibraryItem | null | undefined) {
    const assetId = getItemAssetId(asset);
    if (!asset || !assetId) return;

    setError(null);
    setGarmentFiles([null, null]);
    setSelectedGarmentAssets((current) => {
      const existingIndex = current.findIndex(
        (item) => getItemAssetId(item) === assetId
      );
      if (existingIndex >= 0) {
        return current.filter((_, index) => index !== existingIndex);
      }

      const maxSelectedAssets = mode === 'single' ? 1 : 2;
      if (current.length >= maxSelectedAssets) {
        return current;
      }

      return [...current, asset];
    });
    setPrompt((current) => {
      const label = getItemLabel(asset);
      const trimmed = current.trim();
      return trimmed.includes(label) ? trimmed : `${trimmed} ${label}`.trim();
    });
  }

  function chooseFromLibrary() {
    if (mode === 'single') {
      const garmentAsset =
        selectedGarmentAsset ??
        selectableHistoryItems[0];
      if (garmentAsset) {
        selectLibraryGarment(garmentAsset);
        return;
      }
    }

    if (mode === 'multi') {
      const candidates = selectableHistoryItems;
      const selectedIds = new Set(selectedGarmentAssetIds);
      const availableSlots = Math.max(
        0,
        2 - selectedGarmentAssets.length
      );
      const additions = candidates
        .filter((asset) => !selectedIds.has(getItemAssetId(asset)))
        .slice(0, Math.min(availableSlots, Math.max(0, 2 - garmentInputCount)));

      if (additions.length > 0) {
        setSelectedGarmentAssets((current) => [...current, ...additions]);
        return;
      }
    }

  }
  const selectableHistoryItems = useMemo(
    () =>
      historyItems.filter((item) => getItemAssetId(item) && getItemImage(item)),
    [historyItems]
  );
  const isChooseFromLibraryDisabled =
    isLoadingHistory || selectableHistoryItems.length === 0;
  const statusLabel = jobStatus?.progressLabel ?? jobStatus?.status ?? (jobId ? commonCopy.generating : null);
  const modelDetailImage = getModelDetailImage(modelDetailAsset);
  const modelDescriptionLines = getModelDescriptionLines(modelDetailAsset);
  const modelDetailTags = getModelTags(modelDetailAsset);

  return (
    <>
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
              className="h-12 flex-1 rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100"
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
          <div
            className={cn(
              'grid gap-3',
              mode === 'multi' ? 'grid-cols-2' : 'grid-cols-1'
            )}
          >
            {garmentWorkbenchCards.map((card) => (
              <div key={card.key}>
                <div
                  className={cn(
                    'flex min-h-28 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 px-3 py-4 text-center',
                    card.image && 'bg-white p-2'
                  )}
                >
                  {card.image ? (
                    <img
                      src={card.image}
                      alt=""
                      className="max-h-48 w-full rounded-md object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold leading-5 text-gray-500">
                      {copy.garmentWorkbenchEmpty}
                    </span>
                  )}
                </div>
                {card.title ? (
                  <p className="mt-2 truncate text-xs font-semibold text-indigo-600">
                    {card.title}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </PanelSection>

        <div className="mb-5 grid grid-cols-2 gap-2">
          <CompactSettingGroup
            label={copy.mode}
            required
            options={modeOptions}
            value={mode}
            onChange={updateMode}
            disabled={isSubmitting}
            columns={2}
          />
          <CompactSettingGroup
            label={copy.size}
            required
            options={tryOnAspectRatios}
            value={aspectRatio}
            onChange={setAspectRatio}
            disabled={isSubmitting}
            columns={3}
          />
        </div>

        <PanelSection title={copy.templateMaterials}>
          <TemplatePromptPicker
            type="try_on"
            selectedTemplateId={selectedTemplateId}
            disabled={isSubmitting}
            onApply={applyTemplate}
          />
        </PanelSection>

        <PanelSection title={copy.chooseModel} required>
          <div className="mb-3 grid gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2">
            <div className="grid grid-cols-[3.25rem_1fr] items-center gap-2">
              <span className="text-xs font-bold text-gray-500">
                {copy.modelAgeFilter}
              </span>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={copy.modelAgeFilter}
              >
                {modelAgeOptions.map((option) => {
                  const active = modelAgeFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setModelAgeFilter(option.value)}
                      disabled={isSubmitting}
                      className={cn(
                        'h-8 min-w-12 rounded-md px-3 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300',
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-[3.25rem_1fr] items-center gap-2">
              <span className="text-xs font-bold text-gray-500">
                {copy.modelGenderFilter}
              </span>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={copy.modelGenderFilter}
              >
                {modelGenderOptions.map((option) => {
                  const active = modelGenderFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setModelGenderFilter(option.value)}
                      disabled={isSubmitting}
                      className={cn(
                        'h-8 min-w-12 rounded-md px-3 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300',
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-[3.25rem_1fr] items-center gap-2">
              <span className="text-xs font-bold text-gray-500">
                {copy.modelStyleFilter}
              </span>
              <div
                className="flex flex-wrap gap-1.5"
                role="group"
                aria-label={copy.modelStyleFilter}
              >
                {modelStyleOptions.map((option) => {
                  const active = modelStyleFilter === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setModelStyleFilter(option.value)}
                      disabled={isSubmitting}
                      className={cn(
                        'h-8 min-w-12 rounded-md px-3 text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300',
                        active
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid max-h-96 grid-cols-4 gap-3 overflow-y-auto pr-1">
            {isLoadingModels ? (
              <p className="col-span-4 inline-flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm font-semibold text-gray-400">
                <Loader2 className="size-4 animate-spin" />
                {commonCopy.loadingLibrary}
              </p>
            ) : modelAssets.length === 0 ? (
              <p className="col-span-4 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                {copy.noOfficialModels}
              </p>
            ) : filteredModelAssets.length === 0 ? (
              <p className="col-span-4 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                {copy.noFilteredModels}
              </p>
            ) : (
              filteredModelAssets.map((model) => {
                const image = getModelAssetImage(model);
                const active = selectedModelAsset?.id === model.id;

                return (
                  <button
                    key={model.id}
                    type="button"
                    title={model.description ?? model.title}
                    aria-label={model.title}
                    onClick={() => setModelDetailAsset(model)}
                    className="group block min-w-0 text-center"
                  >
                    <span className="relative block">
                      <span
                        className={cn(
                          'block aspect-square overflow-hidden rounded-lg border bg-gray-100 transition group-hover:border-indigo-300',
                          active
                            ? 'border-indigo-500 ring-2 ring-indigo-100'
                            : 'border-gray-200'
                        )}
                      >
                        {model.videoUrl && image === model.videoUrl ? (
                          <video
                            src={image}
                            muted
                            playsInline
                            preload="metadata"
                            className="size-full object-cover"
                          />
                        ) : image ? (
                          <img
                            src={image}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-gray-300">
                            <ImageIcon className="size-5" />
                          </span>
                        )}
                      </span>
                      {active ? (
                        <span className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                          <CheckCircle2 className="size-4" />
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        'mt-1 block w-full truncate text-xs font-semibold transition',
                        active ? 'text-indigo-600' : 'text-gray-600 group-hover:text-indigo-600'
                      )}
                    >
                      {model.title}
                    </span>
                  </button>
                );
              })
            )}
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
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
                {modeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => updateMode(option.value)}
                    className={cn(
                      'h-11 rounded-md text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
                      mode === option.value
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:bg-white hover:text-indigo-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-5 rounded-lg bg-gray-50 p-4 md:grid-cols-2">
                <div>
                  <h2 className="mb-3 text-center text-sm font-bold text-gray-700">
                    {copy.upperGarment}
                  </h2>
                  <UploadDropzone
                    id="try-on-upper-canvas"
                    preview={upperGarmentPreview}
                    fileName={upperGarmentLabel}
                    emptyText={copy.upperGarmentEmpty}
                    hint={copy.garmentHint}
                    disabled={isSubmitting}
                    onChange={(files) => selectGarmentFileAt(0, files)}
                  />
                  <div className="mt-3 grid gap-3">
                    <IconButtonCard
                      icon={Images}
                      label={commonCopy.chooseFromLibrary}
                      onClick={chooseFromLibrary}
                      disabled={isChooseFromLibraryDisabled}
                    />
                    <IconButtonCard
                      icon={UploadCloud}
                      label={commonCopy.uploadImage}
                      onClick={() =>
                        document.getElementById('try-on-upper-canvas')?.click()
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <h2 className="mb-3 text-center text-sm font-bold text-gray-700">
                    {copy.lowerGarment}
                  </h2>
                  <UploadDropzone
                    id="try-on-lower-canvas"
                    preview={lowerGarmentPreview}
                    fileName={lowerGarmentLabel}
                    emptyText={
                      mode === 'single'
                        ? copy.lowerGarmentDisabled
                        : copy.lowerGarmentEmpty
                    }
                    hint={mode === 'single' ? copy.onePieceHint : copy.garmentHint}
                    disabled={isSubmitting || mode === 'single'}
                    onChange={(files) => selectGarmentFileAt(1, files)}
                  />
                  <div className="mt-3 grid gap-3">
                    <IconButtonCard
                      icon={Images}
                      label={commonCopy.chooseFromLibrary}
                      onClick={chooseFromLibrary}
                      disabled={isChooseFromLibraryDisabled || mode === 'single'}
                    />
                    <IconButtonCard
                      icon={UploadCloud}
                      label={commonCopy.uploadImage}
                      onClick={() =>
                        document.getElementById('try-on-lower-canvas')?.click()
                      }
                      disabled={isSubmitting || mode === 'single'}
                    />
                  </div>
                </div>
              </div>
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

      {modelDetailAsset ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${copy.modelDetailTitle}: ${modelDetailAsset.title}`}
          onClick={() => setModelDetailAsset(null)}
        >
          <div
            className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-indigo-500">
                  {copy.modelDetailTitle}
                </p>
                <h2 className="truncate text-xl font-black text-gray-950">
                  {modelDetailAsset.title}
                </h2>
              </div>
              <button
                type="button"
                aria-label={copy.close}
                title={copy.close}
                onClick={() => setModelDetailAsset(null)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid min-h-0 gap-5 overflow-y-auto p-5 md:grid-cols-[minmax(0,280px)_1fr]">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-gray-400">
                  {copy.modelDisplayImage}
                </p>
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                  {modelDetailImage ? (
                    modelDetailAsset.videoUrl &&
                    modelDetailImage === modelDetailAsset.videoUrl ? (
                      <video
                        src={modelDetailImage}
                        muted
                        playsInline
                        controls
                        className="size-full object-cover"
                      />
                    ) : (
                      <img
                        src={modelDetailImage}
                        alt=""
                        className="size-full object-cover"
                        loading="eager"
                        decoding="async"
                      />
                    )
                  ) : (
                    <span className="flex size-full items-center justify-center text-gray-300">
                      <ImageIcon className="size-8" />
                    </span>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <p className="mb-2 text-xs font-bold uppercase text-gray-400">
                  {copy.modelStyleIntro}
                </p>
                {modelDetailTags.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {modelDetailTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="space-y-2 text-sm leading-6 text-gray-700">
                  {modelDescriptionLines.length > 0 ? (
                    modelDescriptionLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))
                  ) : (
                    <p>{modelDetailAsset.title}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
              {selectedModelAsset?.id === modelDetailAsset.id ? (
                <span className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600">
                  <CheckCircle2 className="size-4" />
                  {copy.selectedModel}
                </span>
              ) : null}
              <Button
                type="button"
                onClick={() => {
                  selectLibraryModel(modelDetailAsset);
                  setModelDetailAsset(null);
                }}
                disabled={isSubmitting}
                className="rounded-full bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-700"
              >
                {copy.useThisModel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
