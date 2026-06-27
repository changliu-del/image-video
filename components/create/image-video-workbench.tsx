'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  FolderOpen,
  ImagePlus,
  Layers3,
  Loader2,
  Play,
  Sparkles,
  UserRound,
  Video,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  CanvasStage,
  PanelSection,
  ResultCard,
  StudioPanel,
} from '@/components/create/workbench-ui';
import { EmptyMaterialVideoCard } from '@/components/create/empty-material-video-card';
import {
  commonWorkbenchCopy,
  imageVideoWorkbenchCopy,
} from '@/components/create/workbench-copy';
import { refreshDashboardUser } from '@/lib/dashboard/user-cache';
import {
  IMAGE_TO_VIDEO_DURATION_SECONDS,
  IMAGE_TO_VIDEO_MAX_DURATION_SECONDS,
  IMAGE_TO_VIDEO_MIN_DURATION_SECONDS,
  getCreditCostForDuration,
} from '@/lib/generations/credit-costs';
import {
  normalizeImageVideoModelMode,
  type ImageVideoModelMode,
} from '@/lib/generations/video-models';
import type { DashboardLocale } from '@/lib/dashboard/content';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { homepageWorkbenchMaterials } from '@/lib/marketing/homepage-materials';
import {
  localizeModelCategoryTag,
  parseModelCategoryParts,
  type ModelCategoryParts,
} from '@/lib/model-assets/localization';
import { imageToVideoTemplateCategories } from '@/lib/templates/category-config';
import { getTemplateCategoryLabel } from '@/lib/templates/catalog';
import {
  normalizePublicTemplateDetail,
  normalizePublicTemplateItems,
  type PublicTemplateDetailItem,
  type PublicTemplateItem,
} from '@/lib/templates/public-client';
import { cn } from '@/lib/utils';

type CompleteAssetResponse = {
  assetId: string;
  status: string;
  publicUrl?: string | null;
};

type GenerationResponse = {
  id?: string;
  generationId?: string;
  jobId?: string;
  status?: string;
};

type JobStatusResponse = {
  id?: string;
  generationType?: string;
  durationSeconds?: number | null;
  inputAssetId?: string | null;
  inputAssetIds?: string[];
  inputImageUrl?: string | null;
  inputImageUrls?: string[];
  prompt?: string | null;
  status?: string;
  progressLabel?: string;
  templateId?: string | null;
  modelTemplateId?: string | null;
  videoModelMode?: ImageVideoModelMode | string | null;
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
const MIN_REFERENCE_IMAGE_DIMENSION_PX = 240;
const MAX_REFERENCE_IMAGE_DIMENSION_PX = 8000;
const MAX_REFERENCE_IMAGE_FILE_COUNT = 1;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ACCEPTED_REFERENCE_IMAGE_TYPES = ACCEPTED_IMAGE_TYPES;
const MODEL_ASSET_LIMIT = 96;
const defaultTemplateCategory: string = imageToVideoTemplateCategories[0] ?? '';
const LAST_IMAGE_VIDEO_TASK_KEY = 'image-video:last-task:v1';
const emptyMaterialPosters = [
  '/resources/showcase.png',
  '/resources/example2.png',
  '/resources/example5.png',
] as const;
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

const imageVideoModelModes: Array<{
  value: ImageVideoModelMode;
  icon: typeof Sparkles;
}> = [
  { value: 'wanxiang_2_7', icon: Sparkles },
  { value: 'wanxiang_2_6_first_frame', icon: Video },
];
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

const materialPickerCopy = {
  pt: {
    templateLibrary: 'Templates',
    loadingTemplates: 'Carregando templates',
    templateError: 'Não foi possível carregar o template.',
    emptyTemplates: 'Nenhum template nesta categoria.',
    retry: 'Tentar novamente',
  },
  en: {
    templateLibrary: 'Templates',
    loadingTemplates: 'Loading templates',
    templateError: 'Template could not be loaded.',
    emptyTemplates: 'No templates in this category.',
    retry: 'Retry',
  },
  zh: {
    templateLibrary: '模板',
    loadingTemplates: '加载模板中',
    templateError: '模板加载失败。',
    emptyTemplates: '当前类目暂无模板。',
    retry: '重试',
  },
};

const taskFlowPanelCopy = {
  pt: {
    title: 'Fluxo',
    close: 'Fechar',
    currentTask: 'Tarefa atual',
    noTask: 'Nenhuma tarefa iniciada ainda.',
    status: 'Status',
    prompt: 'Prompt',
    input: 'Imagem de entrada',
    output: 'Resultado',
    generatingHint:
      'A tarefa está em andamento. Acompanhe o progresso aqui; o vídeo aparece à direita quando terminar.',
    readyHint: 'Tarefa concluída. O resultado está disponível à direita.',
    failedHint: 'A tarefa falhou. Veja a mensagem de erro e tente novamente.',
    progressHint:
      'Gerando agora. Abra o fluxo para acompanhar o progresso.',
    viewTaskFlow: 'Ver fluxo',
  },
  en: {
    title: 'Flow',
    close: 'Close',
    currentTask: 'Current task',
    noTask: 'No task has been started yet.',
    status: 'Status',
    prompt: 'Prompt',
    input: 'Input image',
    output: 'Result',
    generatingHint:
      'This task is still generating. Track progress here; the video will appear on the right when it is ready.',
    readyHint: 'Task complete. The result is available on the right.',
    failedHint: 'The task failed. Check the error message and try again.',
    progressHint:
      'Generation is running. Open the flow to track progress.',
    viewTaskFlow: 'View flow',
  },
  zh: {
    title: '任务流',
    close: '关闭',
    currentTask: '当前任务',
    noTask: '还没有生成任务。',
    status: '任务状态',
    prompt: '生成描述',
    input: '参考图片',
    output: '生成结果',
    generatingHint:
      '任务正在生成中，可在这里查看进度；完成后视频会自动显示在右侧。',
    readyHint: '任务已完成，右侧可以查看生成视频。',
    failedHint: '任务失败，请查看错误信息后重新生成。',
    progressHint: '任务正在生成中，可打开任务流查看进度。',
    viewTaskFlow: '查看任务流',
  },
};

type PersistedImageVideoTask = {
  jobId: string;
  durationSeconds?: number;
  prompt?: string;
  templateId?: string;
  videoModelMode?: ImageVideoModelMode;
  modelTemplateId?: string;
  inputAssetId?: string;
  inputImageUrl?: string | null;
  status?: JobStatusResponse | null;
  updatedAt: number;
};

function formatFileSize(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    const cleanup = () => URL.revokeObjectURL(objectUrl);

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      cleanup();
      resolve({ width, height });
    };
    image.onerror = () => {
      cleanup();
      reject(new Error('reference-image-load-failed'));
    };
    image.src = objectUrl;
  });
}

async function validateReferenceFile(
  file: File,
  labels: {
    invalidReference: string;
    referenceTooLarge: string;
    referenceDimensionInvalid: (
      width: number,
      height: number,
      min: number,
      max: number
    ) => string;
  }
) {
  if (!ACCEPTED_REFERENCE_IMAGE_TYPES.includes(file.type)) {
    return labels.invalidReference;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return labels.referenceTooLarge;
  }

  let dimensions: { width: number; height: number };
  try {
    dimensions = await readImageDimensions(file);
  } catch {
    return labels.invalidReference;
  }

  const outsideDimensionRange =
    dimensions.width < MIN_REFERENCE_IMAGE_DIMENSION_PX ||
    dimensions.height < MIN_REFERENCE_IMAGE_DIMENSION_PX ||
    dimensions.width > MAX_REFERENCE_IMAGE_DIMENSION_PX ||
    dimensions.height > MAX_REFERENCE_IMAGE_DIMENSION_PX;

  if (outsideDimensionRange) {
    return labels.referenceDimensionInvalid(
      dimensions.width,
      dimensions.height,
      MIN_REFERENCE_IMAGE_DIMENSION_PX,
      MAX_REFERENCE_IMAGE_DIMENSION_PX
    );
  }

  return null;
}

function normalizeModelItems(value: unknown): ModelTemplateItem[] {
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  return Array.isArray(record.items) ? (record.items as ModelTemplateItem[]) : [];
}

function getModelAssetImage(item: ModelTemplateItem | null) {
  if (!item) return '';
  return item.imageUrl ?? item.thumbnailUrl ?? item.videoUrl ?? '';
}

function getModelDescriptionLines(item: ModelTemplateItem | null) {
  return (item?.description ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function modelHasTag(item: ModelTemplateItem, tag: string | null) {
  if (!tag) return true;
  return (item.tags ?? []).some((itemTag) => itemTag.trim() === tag);
}

function getModelCategoryParts(item: ModelTemplateItem) {
  return (
    item.categoryParts ?? parseModelCategoryParts((item.tags ?? []).join('/'))
  );
}

function getModelStyleTag(item: ModelTemplateItem) {
  return getModelCategoryParts(item).style;
}

function buildPromptWithAppearingModel(
  prompt: string,
  model: ModelTemplateItem | null,
  labels: {
    appearingModelPromptPrefix: (name: string) => string;
  }
) {
  if (!model) return prompt;

  const modelPromptPrefix = labels.appearingModelPromptPrefix(model.title);
  if (prompt.includes(modelPromptPrefix)) return prompt;

  const modelLines = [
    modelPromptPrefix,
    ...getModelDescriptionLines(model).slice(0, 2),
  ].filter(Boolean);

  return `${prompt}\n\n${modelLines.join('\n')}`.trim();
}

type ReferenceMaterialCopy = {
  referencePanelTitle: string;
  close: string;
  uploadReferenceImage: string;
  referenceDimensionHint: (min: number, max: number) => string;
  referenceMaterialCount: (count: number) => string;
};

function ReferenceMaterialPanel({
  copy,
  disabled,
  referenceFileCount,
  referenceImageFiles,
  onClose,
  onSelect,
}: {
  copy: ReferenceMaterialCopy;
  disabled?: boolean;
  referenceFileCount: number;
  referenceImageFiles: File[];
  onClose: () => void;
  onSelect: (files: FileList | null) => void | Promise<void>;
}) {
  const uploadActions = [
    {
      label: copy.uploadReferenceImage,
      icon: ImagePlus,
      files: referenceImageFiles,
    },
  ];

  return (
    <div className="mt-3 min-h-[300px] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-xl font-black text-gray-900">
          {copy.referencePanelTitle}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700"
        >
          {copy.close}
        </button>
      </div>

      <div className="grid overflow-hidden rounded-2xl bg-indigo-50">
        {uploadActions.map((action, index) => {
          const Icon = action.icon;
          const inputId = 'reference-image-file';

          return (
            <label
              key={inputId}
              htmlFor={inputId}
              className={cn(
                'inline-flex h-14 cursor-pointer items-center justify-center gap-2 text-sm font-bold text-indigo-600 transition hover:bg-indigo-100',
                index > 0 && 'border-l border-white'
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">{action.label}</span>
              <input
                id={inputId}
                type="file"
                accept={ACCEPTED_REFERENCE_IMAGE_TYPES.join(',')}
                disabled={disabled}
                className="sr-only"
                onChange={(event) => {
                  void onSelect(event.target.files);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs font-semibold text-gray-500">
        {copy.referenceDimensionHint(
          MIN_REFERENCE_IMAGE_DIMENSION_PX,
          MAX_REFERENCE_IMAGE_DIMENSION_PX
        )}
      </p>

      {referenceFileCount ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold text-gray-500">
            {copy.referenceMaterialCount(referenceFileCount)}
          </p>
          <div className="grid gap-2">
            {uploadActions.flatMap((action) =>
              action.files.map((file) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600"
                >
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-gray-400">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type TemplateDetailCopy = typeof imageVideoWorkbenchCopy.en;

function TemplateDetailModal({
  copy,
  detail,
  error,
  isLoading,
  locale,
  materialCopy,
  onApply,
  onClose,
  onRetry,
  template,
}: {
  copy: TemplateDetailCopy;
  detail: PublicTemplateDetailItem | null;
  error: boolean;
  isLoading: boolean;
  locale: DashboardLocale;
  materialCopy: typeof materialPickerCopy.en;
  onApply: () => void;
  onClose: () => void;
  onRetry: () => void;
  template: PublicTemplateItem;
}) {
  const displayTemplate = detail ?? template;
  const categoryLabel = displayTemplate.category
    ? getTemplateCategoryLabel(displayTemplate.category, locale)
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/55 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto grid max-h-[calc(100dvh-48px)] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <h2 className="min-w-0 truncate text-lg font-black text-gray-950">
            {copy.templateDetailTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
            aria-label={copy.close}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {isLoading ? (
            <div className="grid min-h-[420px] place-items-center text-sm font-semibold text-gray-500">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {materialCopy.loadingTemplates}
              </span>
            </div>
          ) : error || !detail ? (
            <div className="grid min-h-[360px] place-items-center text-center">
              <div>
                <p className="text-sm font-semibold text-gray-950">
                  {materialCopy.templateError}
                </p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 inline-flex h-10 items-center rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-900"
                >
                  {materialCopy.retry}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.58fr)]">
              <video
                src={displayTemplate.previewUrl}
                poster={displayTemplate.thumbnailUrl}
                className="aspect-[4/5] w-full rounded-lg bg-gray-100 object-cover"
                autoPlay
                controls
                loop
                muted
                playsInline
                preload="metadata"
              />

              <div className="flex min-w-0 flex-col gap-5">
                <div>
                  <p className="text-xs font-black uppercase text-gray-500">
                    {copy.templateTitle}
                  </p>
                  <p className="mt-2 text-xl font-black text-gray-950">
                    {displayTemplate.title}
                  </p>
                </div>

                {categoryLabel ? (
                  <div>
                    <p className="text-xs font-black uppercase text-gray-500">
                      {copy.templateCategory}
                    </p>
                    <p className="mt-2 text-sm font-bold text-gray-800">
                      {categoryLabel}
                    </p>
                  </div>
                ) : null}

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase text-gray-500">
                    {copy.templatePrompt}
                  </p>
                  <p className="mt-2 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                    {detail.prompt}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={onApply}
                  className="mt-auto h-11 rounded-full bg-indigo-600 text-sm font-black text-white hover:bg-indigo-700"
                >
                  {copy.useTemplate}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ImageVideoModelLibraryDrawer({
  copy,
  disabled,
  filteredModels,
  isLoading,
  modelAgeFilter,
  modelAgeOptions,
  modelError,
  modelGenderFilter,
  modelGenderOptions,
  modelStyleFilter,
  modelStyleOptions,
  onAgeChange,
  onClose,
  onGenderChange,
  onRetry,
  onSelect,
  onStyleChange,
  selectedModelAsset,
}: {
  copy: TemplateDetailCopy;
  disabled?: boolean;
  filteredModels: ModelTemplateItem[];
  isLoading: boolean;
  modelAgeFilter: ModelAgeFilter;
  modelAgeOptions: Array<{ value: ModelAgeFilter; label: string }>;
  modelError: boolean;
  modelGenderFilter: ModelGenderFilter;
  modelGenderOptions: Array<{ value: ModelGenderFilter; label: string }>;
  modelStyleFilter: ModelStyleFilter;
  modelStyleOptions: Array<{ value: ModelStyleFilter; label: string }>;
  onAgeChange: (value: ModelAgeFilter) => void;
  onClose: () => void;
  onGenderChange: (value: ModelGenderFilter) => void;
  onRetry: () => void;
  onSelect: (model: ModelTemplateItem) => void;
  onStyleChange: (value: ModelStyleFilter) => void;
  selectedModelAsset: ModelTemplateItem | null;
}) {
  const filterRows: Array<{
    label: string;
    options: Array<{ value: string; label: string }>;
    value: string;
    onChange: (value: string) => void;
  }> = [
    {
      label: copy.modelGenderFilter,
      options: modelGenderOptions,
      value: modelGenderFilter,
      onChange: (value) => onGenderChange(value as ModelGenderFilter),
    },
    {
      label: copy.modelStyleFilter,
      options: modelStyleOptions,
      value: modelStyleFilter,
      onChange: onStyleChange,
    },
    {
      label: copy.modelAgeFilter,
      options: modelAgeOptions,
      value: modelAgeFilter,
      onChange: (value) => onAgeChange(value as ModelAgeFilter),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-950/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={copy.modelLibraryTitle}
    >
      <div className="ml-auto flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-indigo-500">
              {copy.appearingModelAction}
            </p>
            <h2 className="truncate text-xl font-black text-gray-950">
              {copy.modelLibraryTitle}
            </h2>
          </div>
          <button
            type="button"
            aria-label={copy.close}
            title={copy.close}
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 space-y-3">
            {filterRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[3rem_1fr] items-center gap-2"
              >
                <span className="text-sm font-semibold text-gray-600">
                  {row.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {row.options.map((option) => {
                    const active = row.value === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={active}
                        disabled={disabled}
                        onClick={() => row.onChange(option.value)}
                        className={cn(
                          'h-8 rounded-md px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
                          active
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-950'
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 text-sm font-semibold text-gray-400">
              <Loader2 className="size-4 animate-spin" />
              {copy.loadingModels}
            </div>
          ) : modelError ? (
            <div className="grid min-h-80 place-items-center rounded-lg border border-red-100 bg-red-50 p-6 text-center">
              <div>
                <AlertCircle className="mx-auto size-7 text-red-500" />
                <p className="mt-3 text-sm font-semibold text-red-700">
                  {copy.modelLibraryError}
                </p>
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 h-9 rounded-md bg-white px-4 text-sm font-bold text-red-600 shadow-sm ring-1 ring-red-100"
                >
                  {copy.retryModels}
                </button>
              </div>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm font-semibold text-gray-400">
              {copy.noFilteredModels}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 pb-6">
              {filteredModels.map((model) => {
                const image = getModelAssetImage(model);
                const active = selectedModelAsset?.id === model.id;

                return (
                  <button
                    key={model.id}
                    type="button"
                    disabled={disabled}
                    title={model.description ?? model.title}
                    onClick={() => onSelect(model)}
                    className="group min-w-0 text-center disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="relative block">
                      <span
                        className={cn(
                          'block aspect-[4/5] overflow-hidden rounded-lg border bg-gray-100 transition group-hover:border-indigo-300',
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
                          <span className="grid size-full place-items-center text-gray-300">
                            <UserRound className="size-6" />
                          </span>
                        )}
                      </span>
                      {active ? (
                        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-indigo-600 text-white shadow-sm">
                          <CheckCircle2 className="size-4" />
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        'mt-2 block truncate text-xs font-semibold transition',
                        active
                          ? 'text-indigo-600'
                          : 'text-gray-600 group-hover:text-indigo-600'
                      )}
                    >
                      {model.title}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskFlowDrawer({
  copy,
  inputPreview,
  isOpen,
  jobId,
  jobStatus,
  onClose,
  prompt,
  resultPreview,
  statusLabel,
}: {
  copy: typeof taskFlowPanelCopy.en;
  inputPreview?: string | null;
  isOpen: boolean;
  jobId?: string | null;
  jobStatus: JobStatusResponse | null;
  onClose: () => void;
  prompt: string;
  resultPreview?: string | null;
  statusLabel?: string | null;
}) {
  if (!isOpen) return null;

  const failed = jobStatus?.status === 'failed';
  const completed = jobStatus?.status === 'succeeded';
  const hint = failed
    ? copy.failedHint
    : completed
      ? copy.readyHint
      : jobId
        ? copy.generatingHint
        : copy.noTask;
  const resultIsVideo =
    Boolean(resultPreview) &&
    (resultPreview?.endsWith('.mp4') || resultPreview?.includes('.mp4?'));

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/45 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase text-indigo-600">
              {copy.currentTask}
            </p>
            <h2 className="mt-1 text-xl font-black text-gray-950">
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-950"
            aria-label={copy.close}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold leading-6 text-indigo-800">
            {hint}
          </div>

          {jobId ? (
            <>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-gray-400">
                      {copy.status}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-gray-600">
                    {failed ? (
                      <AlertCircle className="size-3.5 text-red-500" />
                    ) : completed ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                    ) : (
                      <Loader2 className="size-3.5 animate-spin text-indigo-500" />
                    )}
                    {statusLabel ?? jobStatus?.status}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-black uppercase text-gray-400">
                  {copy.input}
                </p>
                {inputPreview ? (
                  <img
                    src={inputPreview}
                    alt=""
                    className="mt-3 aspect-[4/5] w-full rounded-lg bg-gray-100 object-cover"
                  />
                ) : (
                  <div className="mt-3 grid aspect-[4/5] place-items-center rounded-lg bg-gray-100 text-gray-300">
                    <ImagePlus className="size-8" />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-black uppercase text-gray-400">
                  {copy.prompt}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-gray-800">
                  {prompt || '-'}
                </p>
              </div>

              {resultPreview ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-black uppercase text-gray-400">
                    {copy.output}
                  </p>
                  <div className="mt-3 overflow-hidden rounded-lg bg-gray-950">
                    {resultIsVideo ? (
                      <video
                        src={resultPreview}
                        controls
                        playsInline
                        className="max-h-72 w-full object-contain"
                      />
                    ) : (
                      <img
                        src={resultPreview}
                        alt=""
                        className="max-h-72 w-full object-contain"
                      />
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
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

function shouldPollJobStatus(status: JobStatusResponse | null) {
  if (status?.status === 'failed') return false;
  if (status?.status === 'succeeded') return !resultUrl(status);
  return true;
}

function inputImageUrl(status: JobStatusResponse | null) {
  return status?.inputImageUrl ?? status?.inputImageUrls?.[0] ?? null;
}

function normalizeDurationSeconds(value: unknown) {
  const duration = Number(value);

  if (!Number.isInteger(duration)) {
    return IMAGE_TO_VIDEO_DURATION_SECONDS;
  }

  return Math.min(
    IMAGE_TO_VIDEO_MAX_DURATION_SECONDS,
    Math.max(IMAGE_TO_VIDEO_MIN_DURATION_SECONDS, duration)
  );
}

function readPersistedImageVideoTask() {
  if (typeof window === 'undefined') return null;

  try {
    const rawTask = window.localStorage.getItem(LAST_IMAGE_VIDEO_TASK_KEY);
    if (!rawTask) return null;

    const task = JSON.parse(rawTask) as Partial<PersistedImageVideoTask>;
    if (!task.jobId || typeof task.jobId !== 'string') return null;

    return {
      jobId: task.jobId,
      durationSeconds: normalizeDurationSeconds(task.durationSeconds),
      prompt: typeof task.prompt === 'string' ? task.prompt : undefined,
      templateId:
        typeof task.templateId === 'string' ? task.templateId : undefined,
      videoModelMode: normalizeImageVideoModelMode(task.videoModelMode),
      modelTemplateId:
        typeof task.modelTemplateId === 'string'
          ? task.modelTemplateId
          : undefined,
      inputAssetId:
        typeof task.inputAssetId === 'string' ? task.inputAssetId : undefined,
      inputImageUrl:
        typeof task.inputImageUrl === 'string' ? task.inputImageUrl : null,
      status: task.status ?? null,
      updatedAt: typeof task.updatedAt === 'number' ? task.updatedAt : 0,
    } satisfies PersistedImageVideoTask;
  } catch {
    return null;
  }
}

function writePersistedImageVideoTask(task: PersistedImageVideoTask) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      LAST_IMAGE_VIDEO_TASK_KEY,
      JSON.stringify(task)
    );
  } catch {
    // Persistence is best-effort; the in-memory task state remains valid.
  }
}

function clearCurrentJobUrl() {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.delete('jobId');
  window.history.replaceState(
    window.history.state,
    '',
    `${url.pathname}${url.search}${url.hash}`
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

class StatusLoadError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

function isTerminalStatusLoadError(error: unknown) {
  return (
    error instanceof StatusLoadError &&
    (error.status === 401 || error.status === 404)
  );
}

function failedStatusFromLoadError(
  currentStatus: JobStatusResponse | null,
  jobId: string,
  message: string
): JobStatusResponse {
  return {
    ...(currentStatus ?? {}),
    id: currentStatus?.id ?? jobId,
    status: 'failed',
    progressLabel: 'Failed',
    errorMessage: message,
    nextPollMs: null,
  };
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
  const body = new FormData();
  body.append('file', file);

  const uploadResponse = await fetch('/api/assets/upload', {
    method: 'POST',
    body,
  });

  if (!uploadResponse.ok) {
    throw new Error(
      await readResponseError(uploadResponse, labels.uploadFailed)
    );
  }

  return (await uploadResponse.json()) as CompleteAssetResponse;
}

async function fetchJobStatus(jobId: string, labels: typeof commonWorkbenchCopy.en) {
  const generationStatus = await fetch(`/api/generations/${jobId}/status`);

  if (generationStatus.ok) {
    return (await generationStatus.json()) as JobStatusResponse;
  }

  if (generationStatus.status !== 404) {
    throw new StatusLoadError(
      await readResponseError(generationStatus, labels.statusLoadError),
      generationStatus.status
    );
  }

  const legacyStatus = await fetch(`/api/jobs/${jobId}`);
  if (!legacyStatus.ok) {
    throw new StatusLoadError(
      await readResponseError(legacyStatus, labels.statusLoadError),
      legacyStatus.status
    );
  }

  return (await legacyStatus.json()) as JobStatusResponse;
}

export function ImageVideoWorkbench({
  initialJobId = '',
  initialTemplateId = '',
  initialPrompt = '',
}: {
  initialJobId?: string;
  initialTemplateId?: string;
  initialPrompt?: string;
}) {
  const locale = useDashboardLocale();
  const copy = imageVideoWorkbenchCopy[locale];
  const commonCopy = commonWorkbenchCopy[locale];
  const materialCopy = materialPickerCopy[locale];
  const taskCopy = taskFlowPanelCopy[locale];
  const starterPrompt = initialPrompt.trim();
  const [sourcePreviews, setSourcePreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(
    () => starterPrompt || copy.promptPresets[0]
  );
  const [durationSeconds, setDurationSeconds] = useState(
    IMAGE_TO_VIDEO_DURATION_SECONDS
  );
  const [selectedVideoModelMode, setSelectedVideoModelMode] =
    useState<ImageVideoModelMode>('wanxiang_2_6_first_frame');
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
  const [isModelLibraryOpen, setIsModelLibraryOpen] = useState(false);
  const [referenceImageFiles, setReferenceImageFiles] = useState<File[]>([]);
  const [modelAssets, setModelAssets] = useState<ModelTemplateItem[]>([]);
  const [selectedModelAsset, setSelectedModelAsset] =
    useState<ModelTemplateItem | null>(null);
  const [modelAgeFilter, setModelAgeFilter] = useState<ModelAgeFilter>('all');
  const [modelGenderFilter, setModelGenderFilter] =
    useState<ModelGenderFilter>('all');
  const [modelStyleFilter, setModelStyleFilter] =
    useState<ModelStyleFilter>('all');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [modelReloadKey, setModelReloadKey] = useState(0);
  const [selectedInputAssetId, setSelectedInputAssetId] = useState<string | null>(
    null
  );
  const [selectedInputImageUrl, setSelectedInputImageUrl] = useState<
    string | null
  >(null);
  const [isTaskFlowOpen, setIsTaskFlowOpen] = useState(false);
  const [templates, setTemplates] = useState<PublicTemplateItem[]>([]);
  const [templateCategory, setTemplateCategory] =
    useState<string>(defaultTemplateCategory);
  const [templateTotal, setTemplateTotal] = useState(0);
  const [templateReloadKey, setTemplateReloadKey] = useState(0);
  const [selectedTemplate, setSelectedTemplate] =
    useState<Partial<PublicTemplateItem> | null>(null);
  const [detailTemplate, setDetailTemplate] =
    useState<PublicTemplateItem | null>(null);
  const [templateDetail, setTemplateDetail] =
    useState<PublicTemplateDetailItem | null>(null);
  const [isLoadingTemplateDetail, setIsLoadingTemplateDetail] =
    useState(false);
  const [templateDetailError, setTemplateDetailError] = useState(false);
  const [templateDetailReloadKey, setTemplateDetailReloadKey] = useState(0);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateError, setTemplateError] = useState(false);
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(
    () => initialJobId.trim() || null
  );
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusPollRetryKey, setStatusPollRetryKey] = useState(0);
  const requestedTemplateId = initialTemplateId;

  const isSubmitting = Boolean(submitLabel);
  const trimmedPrompt = prompt.trim();
  const selectedResultUrl = resultUrl(jobStatus);
  const selectedTemplateId =
    selectedTemplate?.id == null ? '' : String(selectedTemplate.id);
  const selectedModelImage = getModelAssetImage(selectedModelAsset);
  const hasLocalReferenceImage = referenceImageFiles.length > 0;
  const primarySourcePreview =
    sourcePreviews[0] ??
    (!hasLocalReferenceImage ? selectedInputImageUrl : null);
  const referenceFileCount = referenceImageFiles.length;
  const hasGenerationData = Boolean(jobId || jobStatus || selectedResultUrl);
  const canSubmit = Boolean(
    (referenceImageFiles.length || selectedInputAssetId) &&
      trimmedPrompt &&
      !isSubmitting
  );
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

  useEffect(() => {
    if (!referenceImageFiles.length) {
      setSourcePreviews([]);
      return;
    }

    const objectUrls = referenceImageFiles.map((file) => URL.createObjectURL(file));
    setSourcePreviews(objectUrls);
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [referenceImageFiles]);

  useEffect(() => {
    const currentJobId = initialJobId.trim();

    if (!currentJobId) return;

    clearCurrentJobUrl();
    const task = readPersistedImageVideoTask();
    if (!task || task.jobId !== currentJobId) return;

    setJobId(task.jobId);
    setJobStatus(task.status ?? null);
    if (task.durationSeconds) setDurationSeconds(task.durationSeconds);
    if (task.videoModelMode) setSelectedVideoModelMode(task.videoModelMode);
    if (task.prompt) setPrompt(task.prompt);
    if (task.templateId) {
      setSelectedTemplate((current) => ({
        ...(current ?? {}),
        id: task.templateId,
      }));
    }
    if (task.inputAssetId) setSelectedInputAssetId(task.inputAssetId);
    if (task.inputImageUrl) setSelectedInputImageUrl(task.inputImageUrl);
  }, [initialJobId]);

  useEffect(() => {
    if (!jobId || (jobStatus && !shouldPollJobStatus(jobStatus))) return;

    let cancelled = false;
    const currentJobId = jobId;

    async function loadInitialStatus() {
      try {
        const nextStatus = await fetchJobStatus(currentJobId, commonCopy);
        if (cancelled) return;

        setJobStatus(nextStatus);
        if (nextStatus.durationSeconds) {
          setDurationSeconds(normalizeDurationSeconds(nextStatus.durationSeconds));
        }
        if (nextStatus.videoModelMode) {
          setSelectedVideoModelMode(
            normalizeImageVideoModelMode(nextStatus.videoModelMode)
          );
        }

        if (nextStatus.prompt) setPrompt(nextStatus.prompt);
        if (nextStatus.templateId) {
          setSelectedTemplate((current) => ({
            ...(current ?? {}),
            id: nextStatus.templateId ?? undefined,
          }));
        }
        if (!hasLocalReferenceImage && nextStatus.inputAssetId) {
          setSelectedInputAssetId(nextStatus.inputAssetId);
        }
        const restoredInputUrl = inputImageUrl(nextStatus);
        if (!hasLocalReferenceImage && restoredInputUrl) {
          setSelectedInputImageUrl(restoredInputUrl);
        }
      } catch (statusError) {
        if (!cancelled) {
          const message =
            statusError instanceof Error
              ? statusError.message
              : commonCopy.statusLoadError;
          setError(message);
          if (isTerminalStatusLoadError(statusError)) {
            setJobStatus((current) =>
              failedStatusFromLoadError(current, currentJobId, message)
            );
          }
        }
      }
    }

    void loadInitialStatus();
    return () => {
      cancelled = true;
    };
  }, [commonCopy, hasLocalReferenceImage, jobId, jobStatus]);

  useEffect(() => {
    if (!jobId) return;

    writePersistedImageVideoTask({
      jobId,
      durationSeconds: normalizeDurationSeconds(
        jobStatus?.durationSeconds ?? durationSeconds
      ),
      prompt: trimmedPrompt,
      templateId: selectedTemplateId || jobStatus?.templateId || undefined,
      videoModelMode: normalizeImageVideoModelMode(
        jobStatus?.videoModelMode ?? selectedVideoModelMode
      ),
      modelTemplateId:
        selectedModelAsset?.id ?? jobStatus?.modelTemplateId ?? undefined,
      inputAssetId: selectedInputAssetId ?? jobStatus?.inputAssetId ?? undefined,
      inputImageUrl: selectedInputImageUrl ?? inputImageUrl(jobStatus),
      status: jobStatus,
      updatedAt: Date.now(),
    });
  }, [
    durationSeconds,
    jobId,
    jobStatus,
    selectedInputAssetId,
    selectedInputImageUrl,
    selectedModelAsset,
    selectedTemplateId,
    selectedVideoModelMode,
    trimmedPrompt,
  ]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadTemplates() {
      setIsLoadingTemplates(true);
      setTemplateError(false);

      try {
        const params = new URLSearchParams({
          pageSize: templateCategory ? '48' : '12',
          type: 'image_to_video',
          locale,
        });
        if (templateCategory) params.set('category', templateCategory);

        const response = await fetch(`/api/templates?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('template-load-failed');
        }

        const templateBody = await response.json();

        if (!cancelled) {
          const nextTemplates = normalizePublicTemplateItems(templateBody);
          const requestedTemplate = nextTemplates.find(
            (template) => String(template.id) === requestedTemplateId
          );

          setTemplates(nextTemplates);
          setTemplateTotal(Number(templateBody.total ?? nextTemplates.length));
          setSelectedTemplate((current) => {
            if (requestedTemplate) {
              return requestedTemplate;
            }

            if (requestedTemplateId) {
              return String(current?.id ?? '') === requestedTemplateId
                ? current
                : { id: requestedTemplateId };
            }

            return current &&
              nextTemplates.some(
                (template) => String(template.id) === String(current.id)
              )
              ? current
              : null;
          });
        }
      } catch {
        if (!cancelled) {
          setTemplates([]);
          setTemplateTotal(0);
          setTemplateError(true);
        }
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }
    }

    void loadTemplates();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locale, requestedTemplateId, templateCategory, templateReloadKey]);

  useEffect(() => {
    if (!isModelLibraryOpen) return;

    let cancelled = false;
    const controller = new AbortController();

    async function loadModels() {
      setIsLoadingModels(true);
      setModelError(false);

      try {
        const params = new URLSearchParams({
          locale,
          limit: String(MODEL_ASSET_LIMIT),
        });
        const response = await fetch(`/api/model-assets?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('model-load-failed');
        }

        const nextModelAssets = normalizeModelItems(await response.json());
        if (!cancelled) {
          setModelAssets(nextModelAssets);
        }
      } catch {
        if (!cancelled) {
          setModelAssets([]);
          setModelError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingModels(false);
        }
      }
    }

    void loadModels();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isModelLibraryOpen, locale, modelReloadKey]);

  useEffect(() => {
    if (!requestedTemplateId || starterPrompt) return;

    let cancelled = false;

    async function loadTemplateDetail() {
      try {
        const response = await fetch(
          `/api/templates/${encodeURIComponent(requestedTemplateId)}?${new URLSearchParams({ locale })}`
        );

        if (!response.ok) return;

        const detail = normalizePublicTemplateDetail(await response.json());
        if (!detail || cancelled) return;

        setSelectedTemplate((current) => ({
          ...(current ?? {}),
          ...detail,
        }));
        setPrompt(detail.prompt);
      } catch {
        // The workbench remains usable with the default prompt if the template
        // detail fetch fails.
      }
    }

    void loadTemplateDetail();
    return () => {
      cancelled = true;
    };
  }, [locale, requestedTemplateId, starterPrompt]);

  useEffect(() => {
    if (!detailTemplate) return;

    const templateId = detailTemplate.id;
    let cancelled = false;
    const controller = new AbortController();

    async function loadTemplateDetail() {
      setIsLoadingTemplateDetail(true);
      setTemplateDetailError(false);
      setTemplateDetail(null);

      try {
        const response = await fetch(
          `/api/templates/${encodeURIComponent(templateId)}?${new URLSearchParams({ locale })}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('template-detail-load-failed');
        }

        const detail = normalizePublicTemplateDetail(await response.json());
        if (!detail) {
          throw new Error('template-detail-invalid');
        }

        if (!cancelled) {
          setTemplateDetail(detail);
        }
      } catch {
        if (!cancelled) {
          setTemplateDetailError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTemplateDetail(false);
        }
      }
    }

    void loadTemplateDetail();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [detailTemplate, locale, templateDetailReloadKey]);

  useEffect(() => {
    setPrompt((current) => current || copy.promptPresets[0]);
  }, [copy.promptPresets]);

  useEffect(() => {
    if (!jobId || !shouldPollJobStatus(jobStatus)) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const nextStatus = await fetchJobStatus(jobId, commonCopy);
        if (!cancelled) {
          setJobStatus(nextStatus);
          if (nextStatus.durationSeconds) {
            setDurationSeconds(
              normalizeDurationSeconds(nextStatus.durationSeconds)
            );
          }
          if (nextStatus.videoModelMode) {
            setSelectedVideoModelMode(
              normalizeImageVideoModelMode(nextStatus.videoModelMode)
            );
          }
          if (
            !hasLocalReferenceImage &&
            !selectedInputAssetId &&
            nextStatus.inputAssetId
          ) {
            setSelectedInputAssetId(nextStatus.inputAssetId);
          }
          if (!hasLocalReferenceImage && !selectedInputImageUrl) {
            const restoredInputUrl = inputImageUrl(nextStatus);
            if (restoredInputUrl) setSelectedInputImageUrl(restoredInputUrl);
          }
          if (terminalStatus(nextStatus.status)) {
            void refreshDashboardUser();
          }
          if (shouldPollJobStatus(nextStatus)) {
            setStatusPollRetryKey((value) => value + 1);
          }
        }
      } catch (statusError) {
        if (!cancelled) {
          const message =
            statusError instanceof Error ? statusError.message : commonCopy.statusLoadError;
          setError(message);
          if (isTerminalStatusLoadError(statusError)) {
            setJobStatus((current) =>
              failedStatusFromLoadError(current, jobId, message)
            );
          } else {
            setStatusPollRetryKey((value) => value + 1);
          }
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
  }, [
    commonCopy,
    jobId,
    jobStatus?.nextPollMs,
    jobStatus?.status,
    statusPollRetryKey,
    hasLocalReferenceImage,
    selectedInputAssetId,
    selectedInputImageUrl,
  ]);

  async function selectReferenceFiles(files: FileList | null) {
    setError(null);
    const nextFiles = Array.from(files ?? []);

    if (!nextFiles.length) {
      return;
    }

    if (nextFiles.length > MAX_REFERENCE_IMAGE_FILE_COUNT) {
      setError(copy.referenceImageLimit);
      return;
    }

    const validationErrors = await Promise.all(
      nextFiles.map((file) => validateReferenceFile(file, copy))
    );
    const validationError = validationErrors.find(Boolean);

    if (validationError) {
      setError(validationError);
      return;
    }

    setReferenceImageFiles(nextFiles);
    setJobId(null);
    setJobStatus(null);
    setSelectedInputAssetId(null);
    setSelectedInputImageUrl(null);
    clearCurrentJobUrl();
  }

  function openTemplateDetail(template: PublicTemplateItem) {
    setError(null);
    setDetailTemplate(template);
    setTemplateDetail(null);
    setTemplateDetailError(false);
  }

  function closeTemplateDetail() {
    setDetailTemplate(null);
    setTemplateDetail(null);
    setTemplateDetailError(false);
  }

  function applyTemplateDetail() {
    if (!templateDetail) return;

    setSelectedTemplate(templateDetail);
    setPrompt(templateDetail.prompt);
    closeTemplateDetail();
  }

  function selectAppearingModel(model: ModelTemplateItem) {
    setError(null);
    setSelectedModelAsset(model);
    setIsModelLibraryOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!referenceImageFiles.length && !selectedInputAssetId) {
      setError(copy.selectSourceImage);
      return;
    }

    if (!trimmedPrompt) {
      setError(copy.promptRequired);
      return;
    }

    setError(null);
    setJobId(null);
    setJobStatus(null);
    clearCurrentJobUrl();

    try {
      let uploadedAssets: CompleteAssetResponse[] = [];

      if (referenceImageFiles.length) {
        setSubmitLabel(copy.uploadingImage);
        uploadedAssets = await Promise.all(
          referenceImageFiles.map((file) => uploadAsset(file, commonCopy))
        );
      }

      const inputAssetIds = uploadedAssets.length
        ? uploadedAssets.map((asset) => asset.assetId)
        : selectedInputAssetId
          ? [selectedInputAssetId]
          : [];
      const inputAssetId = inputAssetIds[0];
      const nextInputImageUrl =
        uploadedAssets[0]?.publicUrl ??
        (!hasLocalReferenceImage ? selectedInputImageUrl : null);

      if (!inputAssetId) {
        throw new Error(commonCopy.imageSaveError);
      }

      const generationPrompt = buildPromptWithAppearingModel(
        trimmedPrompt,
        selectedModelAsset,
        copy
      );

      setSubmitLabel(copy.startingGeneration);
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'image_to_video',
          durationSeconds,
          videoModelMode: selectedVideoModelMode,
          inputAssetId,
          ...(inputAssetIds.length > 1 ? { inputAssetIds } : {}),
          ...(selectedModelAsset?.id
            ? { modelTemplateId: selectedModelAsset.id }
            : {}),
          ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
          prompt: generationPrompt,
        },
        commonCopy.generationStartError
      );
      const nextJobId = generation.jobId ?? generation.generationId ?? generation.id;

      if (!nextJobId) {
        throw new Error(commonCopy.missingJobError);
      }

      void refreshDashboardUser();
      setSelectedInputAssetId(inputAssetId);
      if (nextInputImageUrl) setSelectedInputImageUrl(nextInputImageUrl);
      setJobId(nextJobId);
      setJobStatus({
        id: nextJobId,
        generationType: 'image_to_video',
        durationSeconds,
        inputAssetId,
        inputAssetIds,
        inputImageUrl: nextInputImageUrl,
        inputImageUrls: nextInputImageUrl ? [nextInputImageUrl] : [],
        prompt: generationPrompt,
        status: generation.status ?? 'queued',
        progressLabel: commonCopy.queued,
        templateId: selectedTemplateId || null,
        modelTemplateId: selectedModelAsset?.id ?? null,
        videoModelMode: selectedVideoModelMode,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : commonCopy.generationStartError
      );
    } finally {
      setSubmitLabel(null);
    }
  }

  const statusLabel = jobStatus?.progressLabel ?? jobStatus?.status ?? (jobId ? commonCopy.generating : null);
  const durationCreditCost = getCreditCostForDuration(durationSeconds, {
    videoModelMode: selectedVideoModelMode,
  });
  const selectedReferenceImageDetail =
    referenceImageFiles[0]?.name ?? copy.selectedReferenceImageReady;
  const emptyMaterialLabels = [
    copy.emptyMaterialStyle,
    copy.emptyMaterialScene,
    copy.emptyMaterialTexture,
  ];
  const emptyMaterialCards = homepageWorkbenchMaterials.map((material, index) => ({
    ...material,
    label: emptyMaterialLabels[index] ?? copy.detailLabel,
    poster: emptyMaterialPosters[index] ?? '/resources/showcase.png',
  }));

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
              onClick={() => setIsTaskFlowOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-indigo-600"
            >
              <Layers3 className="size-4" />
              {commonCopy.taskFlow}
            </button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 flex-1 rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {submitLabel ?? commonCopy.generateNow}
            </Button>
          </div>
        }
      >
        <PanelSection
          title={copy.referenceVideo}
          required
          hint={copy.referenceHint}
        >
          <div className="mb-3 grid grid-cols-2 gap-2">
            {imageVideoModelModes.map((option) => {
              const modelCopy = copy.modelModes[option.value];
              const Icon = option.icon;
              const active = selectedVideoModelMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSubmitting}
                  aria-pressed={active}
                  onClick={() => setSelectedVideoModelMode(option.value)}
                  className={cn(
                    'min-h-20 rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                    active
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/40'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate text-[11px] font-black uppercase">
                      {modelCopy.eyebrow}
                    </span>
                  </span>
                  <span className="mt-2 block truncate text-sm font-black">
                    {modelCopy.title}
                  </span>
                  <span className="mt-1 block text-xs font-semibold leading-4 text-gray-500">
                    {modelCopy.description}
                  </span>
                </button>
              );
            })}
          </div>
          <textarea
            id="image-video-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={7}
            disabled={isSubmitting}
            placeholder={copy.promptPlaceholder}
            className="min-h-44 w-full resize-none rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="image-video-duration"
                className="text-xs font-black uppercase text-gray-500"
              >
                {copy.durationLabel}
              </label>
              <span className="shrink-0 text-xs font-bold text-gray-500">
                {copy.durationValue(durationSeconds)} ·{' '}
                {commonCopy.credits(durationCreditCost)}
              </span>
            </div>
            <input
              id="image-video-duration"
              type="range"
              min={IMAGE_TO_VIDEO_MIN_DURATION_SECONDS}
              max={IMAGE_TO_VIDEO_MAX_DURATION_SECONDS}
              step={1}
              value={durationSeconds}
              disabled={isSubmitting}
              onChange={(event) =>
                setDurationSeconds(normalizeDurationSeconds(event.target.value))
              }
              className="mt-3 w-full accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="mt-2 flex justify-between text-[11px] font-bold text-gray-400">
              <span>
                {copy.durationValue(IMAGE_TO_VIDEO_MIN_DURATION_SECONDS)}
              </span>
              <span>
                {copy.durationValue(IMAGE_TO_VIDEO_MAX_DURATION_SECONDS)}
              </span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsReferencePanelOpen(true)}
              className={cn(
                'inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold shadow-sm ring-1 transition sm:text-sm',
                isReferencePanelOpen
                  ? 'bg-indigo-50 text-indigo-700 ring-indigo-100'
                  : 'bg-white text-gray-800 ring-gray-100'
              )}
            >
              <FolderOpen className="size-4" />
              <span className="truncate">{copy.materialAction}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsModelLibraryOpen(true)}
              disabled={isSubmitting}
              className={cn(
                'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold shadow-sm ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm',
                selectedModelAsset
                  ? 'bg-indigo-50 text-indigo-700 ring-indigo-100'
                  : 'bg-white text-gray-800 ring-gray-100 hover:bg-indigo-50 hover:text-indigo-700'
              )}
            >
              {selectedModelImage ? (
                <img
                  src={selectedModelImage}
                  alt=""
                  className="size-7 shrink-0 rounded-md object-cover"
                />
              ) : (
                <UserRound className="size-4 shrink-0" />
              )}
              <span className="truncate">
                {selectedModelAsset?.title ?? copy.appearingModelAction}
              </span>
            </button>
          </div>
          {primarySourcePreview ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
              <img
                src={primarySourcePreview}
                alt=""
                className="size-14 shrink-0 rounded-md bg-gray-100 object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-gray-900">
                  {copy.selectedReferenceImage}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-gray-400">
                  {selectedReferenceImageDetail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReferenceImageFiles([]);
                  setJobId(null);
                  setJobStatus(null);
                  setSelectedInputAssetId(null);
                  setSelectedInputImageUrl(null);
                  clearCurrentJobUrl();
                }}
                disabled={isSubmitting}
                className="grid size-8 shrink-0 place-items-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={copy.removeReferenceImage}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}
          {selectedModelAsset ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-indigo-100 bg-indigo-50 p-2 shadow-sm">
              {selectedModelImage ? (
                <img
                  src={selectedModelImage}
                  alt=""
                  className="size-14 shrink-0 rounded-md bg-white object-cover"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-md bg-white text-indigo-300">
                  <UserRound className="size-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-black text-indigo-900">
                  {copy.selectedAppearingModel}
                </p>
                <p className="mt-1 truncate text-xs font-semibold text-indigo-500">
                  {selectedModelAsset.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModelAsset(null)}
                disabled={isSubmitting}
                className="grid size-8 shrink-0 place-items-center rounded-md text-indigo-400 transition hover:bg-white hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={copy.removeAppearingModel}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}
          {isReferencePanelOpen ? (
            <ReferenceMaterialPanel
              copy={copy}
              disabled={isSubmitting}
              referenceFileCount={referenceFileCount}
              referenceImageFiles={referenceImageFiles}
              onClose={() => setIsReferencePanelOpen(false)}
              onSelect={selectReferenceFiles}
            />
          ) : null}
        </PanelSection>

        <PanelSection
          title={copy.inspiration}
          hint={
            isLoadingTemplates
              ? materialCopy.loadingTemplates
              : commonCopy.templateCount(templateTotal)
          }
        >
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase text-gray-500">
                {materialCopy.templateLibrary}
              </span>
              {templateError ? (
                <button
                  type="button"
                  onClick={() => setTemplateReloadKey((value) => value + 1)}
                  className="text-xs font-bold text-red-600 underline underline-offset-2"
                >
                  {materialCopy.retry}
                </button>
              ) : null}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageToVideoTemplateCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setTemplateCategory(category)}
                  disabled={isSubmitting}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
                    templateCategory === category
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
                  )}
                >
                  {getTemplateCategoryLabel(category, locale)}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {isLoadingTemplates ? (
                <div className="col-span-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm font-semibold text-gray-400">
                  <Loader2 className="size-4 animate-spin" />
                  {materialCopy.loadingTemplates}
                </div>
              ) : templateError ? (
                <div className="col-span-3 rounded-lg border border-red-100 bg-red-50 px-3 py-4 text-sm text-red-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{materialCopy.templateError}</span>
                  </div>
                </div>
              ) : templates.length ? (
                templates.map((template) => {
                  const active = selectedTemplateId === template.id;

                  return (
                    <figure
                      key={template.id}
                      className="min-w-0"
                    >
                      <button
                        type="button"
                        onClick={() => openTemplateDetail(template)}
                        disabled={isSubmitting}
                        className="group block w-full min-w-0 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={`${copy.previewTemplate} ${template.title}`}
                      >
                        <span
                          className={cn(
                            'relative block aspect-[4/5] overflow-hidden rounded-lg border bg-gray-100 transition',
                            active
                              ? 'border-indigo-500 ring-2 ring-indigo-100'
                              : 'border-gray-200 group-hover:border-indigo-200'
                          )}
                        >
                          <img
                            src={template.thumbnailUrl}
                            alt=""
                            className="size-full object-cover transition duration-500 group-hover:scale-105"
                          />
                          <span className="pointer-events-none absolute left-1/2 top-1/2 inline-flex max-w-[calc(100%-16px)] -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-gray-800 opacity-0 shadow-sm ring-1 ring-gray-200 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                            <Eye className="size-3.5 shrink-0 text-indigo-600" />
                            <span className="truncate">
                              {copy.previewTemplate}
                            </span>
                          </span>
                          {active ? (
                            <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-300 text-gray-950">
                              <CheckCircle2 className="size-4" />
                            </span>
                          ) : null}
                        </span>
                      </button>
                      <figcaption className="mt-2 min-h-9 text-center">
                        <button
                          type="button"
                          onClick={() => openTemplateDetail(template)}
                          disabled={isSubmitting}
                          className="w-full truncate text-xs font-black text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                          title={template.title}
                        >
                          {template.title}
                        </button>
                      </figcaption>
                    </figure>
                  );
                })
              ) : (
                <div className="col-span-3 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                  {materialCopy.emptyTemplates}
                </div>
              )}
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
        title={hasGenerationData ? copy.canvasTitle : ''}
        subtitle={hasGenerationData ? copy.canvasSubtitle : undefined}
      >
        <div className="mx-auto w-full max-w-4xl">
          {hasGenerationData ? (
            <>
              {jobId &&
              !terminalStatus(jobStatus?.status) &&
              !selectedResultUrl ? (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-indigo-100 bg-white/90 px-4 py-3 shadow-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-gray-700">
                    <Loader2 className="size-4 shrink-0 animate-spin text-indigo-500" />
                    <span className="truncate">{taskCopy.progressHint}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsTaskFlowOpen(true)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-4 text-xs font-black text-white transition hover:bg-indigo-700"
                  >
                    <Layers3 className="size-4" />
                    {taskCopy.viewTaskFlow}
                  </button>
                </div>
              ) : null}
              <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr]">
                <figure className="text-center">
                  <div className="mx-auto flex aspect-[4/5] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
                    {primarySourcePreview ? (
                      <img
                        src={primarySourcePreview}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="size-10 text-gray-300" />
                    )}
                  </div>
                  <figcaption className="mt-4 text-sm font-bold text-gray-500">
                    {copy.detailLabel}
                  </figcaption>
                  {sourcePreviews.length > 1 ? (
                    <div className="mx-auto mt-4 grid max-w-[280px] grid-cols-4 gap-2">
                      {sourcePreviews.slice(0, 8).map((preview, index) => (
                        <img
                          key={`${preview}-canvas-${index}`}
                          src={preview}
                          alt=""
                          className="aspect-square rounded-md border border-white bg-white object-cover shadow-sm"
                        />
                      ))}
                    </div>
                  ) : null}
                </figure>

                <ResultCard
                  resultUrl={selectedResultUrl}
                  status={statusLabel}
                  title={copy.previewTitle}
                  description={copy.previewDescription}
                  mediaKind="video"
                  minHeight="min-h-[380px]"
                  waitingLabel={commonCopy.waitingUpload}
                />
              </div>

              {jobStatus?.errorMessage ? (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {jobStatus.errorMessage}
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-[calc(100dvh-210px)] flex-col items-center justify-center py-8">
              <h1 className="text-center text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
                {copy.canvasTitle}
              </h1>
              <div className="mt-8 grid w-full max-w-[880px] gap-8 md:grid-cols-3">
                {emptyMaterialCards.map((card) => (
                  <EmptyMaterialVideoCard
                    key={card.asset}
                    src={card.asset}
                    poster={card.poster}
                    label={card.label}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CanvasStage>

      <TaskFlowDrawer
        copy={taskCopy}
        inputPreview={primarySourcePreview}
        isOpen={isTaskFlowOpen}
        jobId={jobId}
        jobStatus={jobStatus}
        onClose={() => setIsTaskFlowOpen(false)}
        prompt={trimmedPrompt}
        resultPreview={selectedResultUrl}
        statusLabel={statusLabel}
      />

      {detailTemplate ? (
        <TemplateDetailModal
          copy={copy}
          detail={templateDetail}
          error={templateDetailError}
          isLoading={isLoadingTemplateDetail}
          locale={locale}
          materialCopy={materialCopy}
          onApply={applyTemplateDetail}
          onClose={closeTemplateDetail}
          onRetry={() => setTemplateDetailReloadKey((value) => value + 1)}
          template={detailTemplate}
        />
      ) : null}

      {isModelLibraryOpen ? (
        <ImageVideoModelLibraryDrawer
          copy={copy}
          disabled={isSubmitting}
          filteredModels={filteredModelAssets}
          isLoading={isLoadingModels}
          modelAgeFilter={modelAgeFilter}
          modelAgeOptions={modelAgeOptions}
          modelError={modelError}
          modelGenderFilter={modelGenderFilter}
          modelGenderOptions={modelGenderOptions}
          modelStyleFilter={modelStyleFilter}
          modelStyleOptions={modelStyleOptions}
          onAgeChange={setModelAgeFilter}
          onClose={() => setIsModelLibraryOpen(false)}
          onGenderChange={setModelGenderFilter}
          onRetry={() => setModelReloadKey((value) => value + 1)}
          onSelect={selectAppearingModel}
          onStyleChange={setModelStyleFilter}
          selectedModelAsset={selectedModelAsset}
        />
      ) : null}
    </form>
  );
}
