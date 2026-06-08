'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FolderOpen,
  HelpCircle,
  ImagePlus,
  Layers3,
  Loader2,
  Music,
  Play,
  RectangleHorizontal,
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
import {
  commonWorkbenchCopy,
  imageVideoWorkbenchCopy,
} from '@/components/create/workbench-copy';
import { refreshDashboardUser } from '@/lib/dashboard/user-cache';
import type { DashboardLocale } from '@/lib/dashboard/content';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { getCreditCostForDuration } from '@/lib/generations/credit-costs';
import { homepageWorkbenchMaterials } from '@/lib/marketing/homepage-materials';
import { imageToVideoTemplateCategories } from '@/lib/templates/category-config';
import { getTemplateCategoryLabel } from '@/lib/templates/catalog';
import {
  normalizePublicTemplateDetail,
  normalizePublicTemplateItems,
  type PublicTemplateDetailItem,
  type PublicTemplateItem,
} from '@/lib/templates/public-client';
import { cn } from '@/lib/utils';

type AspectRatio = '9:16' | '3:4' | '1:1';
type DurationSeconds = number;
type QualityMode = 'standard' | 'high';
type ReferenceKind = 'image' | 'video' | 'audio';
type SpecsSection = 'aspect' | 'duration' | 'quality';

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
const MAX_REFERENCE_IMAGE_FILE_COUNT = 1;
const MAX_REFERENCE_FILE_COUNT = 8;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ACCEPTED_REFERENCE_IMAGE_TYPES = ACCEPTED_IMAGE_TYPES;
const ACCEPTED_REFERENCE_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
const ACCEPTED_REFERENCE_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/ogg',
  'audio/webm',
];
const ACCEPTED_REFERENCE_TYPES = [
  ...ACCEPTED_REFERENCE_IMAGE_TYPES,
  ...ACCEPTED_REFERENCE_VIDEO_TYPES,
  ...ACCEPTED_REFERENCE_AUDIO_TYPES,
];
const aspectRatios: AspectRatio[] = ['9:16', '3:4', '1:1'];
const MIN_DURATION_SECONDS = 4;
const MAX_DURATION_SECONDS = 15;
const defaultTemplateCategory: string = imageToVideoTemplateCategories[0] ?? '';
const materialPickerCopy = {
  pt: {
    templateLibrary: 'Templates',
    loadingTemplates: 'Carregando templates',
    templateError: 'Nao foi possivel carregar o template.',
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

function formatFileSize(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateReferenceFile(
  file: File,
  labels: { invalidReference: string; referenceTooLarge: string }
) {
  if (!ACCEPTED_REFERENCE_TYPES.includes(file.type)) {
    return labels.invalidReference;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return labels.referenceTooLarge;
  }

  return null;
}

function acceptedReferenceTypesForKind(kind: ReferenceKind) {
  switch (kind) {
    case 'image':
      return ACCEPTED_REFERENCE_IMAGE_TYPES.join(',');
    case 'video':
      return ACCEPTED_REFERENCE_VIDEO_TYPES.join(',');
    case 'audio':
      return ACCEPTED_REFERENCE_AUDIO_TYPES.join(',');
  }
}

type ReferenceMaterialCopy = {
  referencePanelTitle: string;
  close: string;
  uploadReferenceImage: string;
  uploadReferenceVideo: string;
  uploadReferenceMusic: string;
  referenceMaterialCount: (count: number) => string;
};

function ReferenceMaterialPanel({
  copy,
  disabled,
  referenceFileCount,
  referenceImageFiles,
  referenceVideoFiles,
  referenceAudioFiles,
  onClose,
  onSelect,
}: {
  copy: ReferenceMaterialCopy;
  disabled?: boolean;
  referenceFileCount: number;
  referenceImageFiles: File[];
  referenceVideoFiles: File[];
  referenceAudioFiles: File[];
  onClose: () => void;
  onSelect: (kind: ReferenceKind, files: FileList | null) => void;
}) {
  const uploadActions = [
    {
      kind: 'image' as const,
      label: copy.uploadReferenceImage,
      icon: ImagePlus,
      files: referenceImageFiles,
    },
    {
      kind: 'video' as const,
      label: copy.uploadReferenceVideo,
      icon: Video,
      files: referenceVideoFiles,
    },
    {
      kind: 'audio' as const,
      label: copy.uploadReferenceMusic,
      icon: Music,
      files: referenceAudioFiles,
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

      <div className="grid grid-cols-3 overflow-hidden rounded-2xl bg-indigo-50">
        {uploadActions.map((action, index) => {
          const Icon = action.icon;
          const inputId = `reference-${action.kind}-file`;

          return (
            <label
              key={action.kind}
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
                multiple={action.kind !== 'image'}
                accept={acceptedReferenceTypesForKind(action.kind)}
                disabled={disabled}
                className="sr-only"
                onChange={(event) => onSelect(action.kind, event.target.files)}
              />
            </label>
          );
        })}
      </div>

      {referenceFileCount ? (
        <div className="mt-5 space-y-2">
          <p className="text-xs font-bold text-gray-500">
            {copy.referenceMaterialCount(referenceFileCount)}
          </p>
          <div className="grid gap-2">
            {uploadActions.flatMap((action) =>
              action.files.map((file) => (
                <div
                  key={`${action.kind}-${file.name}-${file.size}`}
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

export function ImageVideoWorkbench({
  initialTemplateId = '',
  initialPrompt = '',
}: {
  initialTemplateId?: string;
  initialPrompt?: string;
}) {
  const locale = useDashboardLocale();
  const copy = imageVideoWorkbenchCopy[locale];
  const commonCopy = commonWorkbenchCopy[locale];
  const materialCopy = materialPickerCopy[locale];
  const starterPrompt = initialPrompt.trim();
  const [sourcePreviews, setSourcePreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(
    () => starterPrompt || copy.promptPresets[0]
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] = useState<DurationSeconds>(10);
  const [qualityMode, setQualityMode] = useState<QualityMode>('standard');
  const [audioSync, setAudioSync] = useState(true);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [activeSpecsSection, setActiveSpecsSection] =
    useState<SpecsSection>('aspect');
  const aspectSpecsRef = useRef<HTMLDivElement | null>(null);
  const durationSpecsRef = useRef<HTMLDivElement | null>(null);
  const qualitySpecsRef = useRef<HTMLDivElement | null>(null);
  const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
  const [referenceImageFiles, setReferenceImageFiles] = useState<File[]>([]);
  const [referenceVideoFiles, setReferenceVideoFiles] = useState<File[]>([]);
  const [referenceAudioFiles, setReferenceAudioFiles] = useState<File[]>([]);
  const [modelNotice, setModelNotice] = useState<string | null>(null);
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
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestedTemplateId = initialTemplateId;

  const isSubmitting = Boolean(submitLabel);
  const trimmedPrompt = prompt.trim();
  const selectedResultUrl = resultUrl(jobStatus);
  const selectedTemplateId =
    selectedTemplate?.id == null ? '' : String(selectedTemplate.id);
  const primarySourcePreview = sourcePreviews[0] ?? null;
  const referenceFileCount =
    referenceImageFiles.length +
    referenceVideoFiles.length +
    referenceAudioFiles.length;
  const qualitySummary =
    qualityMode === 'standard' ? copy.standardQuality : copy.qualityHigh;
  const hasGenerationData = Boolean(jobId || jobStatus || selectedResultUrl);
  const canSubmit = Boolean(
    referenceImageFiles.length && trimmedPrompt && !isSubmitting
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
    if (!isSpecsOpen) return;

    const sectionRef = {
      aspect: aspectSpecsRef,
      duration: durationSpecsRef,
      quality: qualitySpecsRef,
    }[activeSpecsSection];

    window.requestAnimationFrame(() => {
      sectionRef.current?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    });
  }, [activeSpecsSection, isSpecsOpen]);

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
            statusError instanceof Error ? statusError.message : commonCopy.statusLoadError
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

  function selectReferenceFiles(kind: ReferenceKind, files: FileList | null) {
    setError(null);
    setModelNotice(null);
    const nextFiles = Array.from(files ?? []);

    if (!nextFiles.length) {
      return;
    }

    if (
      kind === 'image' &&
      nextFiles.length > MAX_REFERENCE_IMAGE_FILE_COUNT
    ) {
      setError(copy.referenceImageLimit);
      return;
    }

    if (nextFiles.length > MAX_REFERENCE_FILE_COUNT) {
      setError(copy.referenceMaterialLimit(MAX_REFERENCE_FILE_COUNT));
      return;
    }

    const validationError = nextFiles
      .map((file) => validateReferenceFile(file, copy))
      .find(Boolean);

    if (validationError) {
      setError(validationError);
      return;
    }

    switch (kind) {
      case 'image':
        setReferenceImageFiles(nextFiles);
        return;
      case 'video':
        setReferenceVideoFiles(nextFiles);
        return;
      case 'audio':
        setReferenceAudioFiles(nextFiles);
        return;
    }
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

  function openSpecsSection(section: SpecsSection) {
    setActiveSpecsSection(section);
    setIsSpecsOpen(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!referenceImageFiles.length) {
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

    try {
      setSubmitLabel(copy.uploadingImage);
      const inputAssetIds = await Promise.all(
        referenceImageFiles.map((file) => uploadAsset(file, commonCopy))
      );
      const inputAssetId = inputAssetIds[0];

      if (!inputAssetId) {
        throw new Error(commonCopy.imageSaveError);
      }

      const [referenceVideoAssetIds, referenceAudioAssetIds] = await Promise.all([
        Promise.all(referenceVideoFiles.map((file) => uploadAsset(file, commonCopy))),
        Promise.all(referenceAudioFiles.map((file) => uploadAsset(file, commonCopy))),
      ]);
      const referenceAssetIds = [
        ...referenceVideoAssetIds,
        ...referenceAudioAssetIds,
      ];

      setSubmitLabel(copy.startingGeneration);
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'image_to_video',
          inputAssetId,
          ...(inputAssetIds.length > 1 ? { inputAssetIds } : {}),
          ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
          prompt: trimmedPrompt,
          aspectRatio,
          durationSeconds,
          qualityMode,
          audioSync,
          ...(referenceAssetIds.length ? { referenceAssetIds } : {}),
          ...(referenceVideoAssetIds.length ? { referenceVideoAssetIds } : {}),
          ...(referenceAudioAssetIds.length ? { referenceAudioAssetIds } : {}),
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
      setError(
        submitError instanceof Error ? submitError.message : commonCopy.generationStartError
      );
    } finally {
      setSubmitLabel(null);
    }
  }

  const statusLabel = jobStatus?.progressLabel ?? jobStatus?.status ?? (jobId ? commonCopy.generating : null);
  const emptyMaterialLabels = [
    copy.emptyMaterialStyle,
    copy.emptyMaterialModel,
    copy.emptyMaterialTexture,
  ];
  const emptyMaterialCards = homepageWorkbenchMaterials.map((material, index) => ({
    ...material,
    label: emptyMaterialLabels[index] ?? copy.detailLabel,
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
              className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-bold text-indigo-600"
            >
              <Layers3 className="size-4" />
              {commonCopy.taskFlow}
            </button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 flex-1 rounded-full bg-[#b8b8f6] text-sm font-bold text-white shadow-none hover:bg-[#a8a8ef] disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
              {submitLabel ?? commonCopy.generateNow}
              <span className="font-semibold opacity-90">
                {commonCopy.credits(getCreditCostForDuration(durationSeconds))}
              </span>
            </Button>
          </div>
        }
      >
        <PanelSection
          title={copy.referenceVideo}
          required
          hint={copy.referenceHint}
        >
          <textarea
            id="image-video-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={7}
            disabled={isSubmitting}
            placeholder={copy.promptPlaceholder}
            className="min-h-44 w-full resize-none rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-indigo-300 focus:bg-white focus:ring-3 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModelNotice(copy.modelComingSoon)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white px-1.5 text-xs font-bold text-gray-800 shadow-sm ring-1 ring-gray-100 sm:text-sm"
            >
              <UserRound className="size-4" />
              <span className="truncate">{copy.modelAction}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsReferencePanelOpen(true)}
              className={cn(
                'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-1.5 text-xs font-bold shadow-sm ring-1 transition sm:text-sm',
                isReferencePanelOpen
                  ? 'bg-indigo-50 text-indigo-700 ring-indigo-100'
                  : 'bg-white text-gray-800 ring-gray-100'
              )}
            >
              <FolderOpen className="size-4" />
              <span className="truncate">{copy.materialAction}</span>
            </button>
          </div>
          {modelNotice ? (
            <p className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
              {modelNotice}
            </p>
          ) : null}
          {isReferencePanelOpen ? (
            <ReferenceMaterialPanel
              copy={copy}
              disabled={isSubmitting}
              referenceFileCount={referenceFileCount}
              referenceImageFiles={referenceImageFiles}
              referenceVideoFiles={referenceVideoFiles}
              referenceAudioFiles={referenceAudioFiles}
              onClose={() => setIsReferencePanelOpen(false)}
              onSelect={selectReferenceFiles}
            />
          ) : null}
        </PanelSection>

        <div className="relative mb-6">
          <div className="flex min-h-14 items-center overflow-x-auto whitespace-nowrap rounded-2xl border border-gray-200 bg-[#f4f6fb] px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => openSpecsSection('aspect')}
              disabled={isSubmitting}
              aria-label={`${copy.aspectRatio} ${aspectRatio}`}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-md text-left transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60',
                isSpecsOpen && activeSpecsSection === 'aspect'
                  ? 'text-indigo-600'
                  : 'text-gray-800'
              )}
            >
              <RectangleHorizontal className="size-5 shrink-0 text-gray-700" />
              <span>{copy.specsLabel}</span>
              <span className="font-medium">{aspectRatio}</span>
            </button>
            <span className="mx-3 h-5 w-px shrink-0 bg-gray-300" />
            <button
              type="button"
              onClick={() => openSpecsSection('duration')}
              disabled={isSubmitting}
              aria-label={`${copy.videoDuration} ${durationSeconds}${copy.seconds}`}
              className={cn(
                'inline-flex shrink-0 items-center rounded-md font-medium transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60',
                isSpecsOpen && activeSpecsSection === 'duration'
                  ? 'text-indigo-600'
                  : 'text-gray-800'
              )}
            >
              <span>
                {durationSeconds}{copy.seconds}
              </span>
            </button>
            <span className="mx-3 h-5 w-px shrink-0 bg-gray-300" />
            <button
              type="button"
              onClick={() => openSpecsSection('quality')}
              disabled={isSubmitting}
              aria-label={`${copy.quality} ${qualitySummary}`}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-md font-medium transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60',
                isSpecsOpen && activeSpecsSection === 'quality'
                  ? 'text-indigo-600'
                  : 'text-gray-800'
              )}
            >
              <span className="font-medium">{qualitySummary}</span>
              {isSpecsOpen && activeSpecsSection === 'quality' ? (
                <ChevronUp className="ml-1 size-4 shrink-0 text-gray-500" />
              ) : (
                <ChevronDown className="ml-1 size-4 shrink-0 text-gray-500" />
              )}
            </button>
            <label className="ml-4 inline-flex shrink-0 items-center gap-2 text-gray-800">
              <input
                type="checkbox"
                checked={audioSync}
                onChange={(event) => setAudioSync(event.target.checked)}
                disabled={isSubmitting}
                className="size-5 rounded-md accent-indigo-600"
              />
              <span>{copy.audioSync}</span>
            </label>
            <HelpCircle className="ml-2 size-4 shrink-0 text-gray-400" />
            <button
              type="button"
              className="ml-4 shrink-0 font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              {copy.beginnerGuide}
            </button>
          </div>

          {isSpecsOpen ? (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.14)]">
              <h3 className="mb-5 text-lg font-black text-gray-900">
                {copy.videoSpecs}
              </h3>
              <div className="space-y-5">
                <div
                  ref={aspectSpecsRef}
                  className={cn(
                    'grid grid-cols-[86px_1fr] items-center gap-3 rounded-xl p-3 transition',
                    activeSpecsSection === 'aspect' && 'bg-indigo-50 ring-1 ring-indigo-100'
                  )}
                >
                  <span className="text-sm font-black text-gray-500">
                    {copy.aspectRatio}
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        disabled={isSubmitting}
                        className={cn(
                          'flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60',
                          aspectRatio === ratio
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-200'
                        )}
                      >
                        <span
                          className={cn(
                            'rounded bg-gray-200',
                            ratio === '9:16' && 'h-7 w-4',
                            ratio === '3:4' && 'h-7 w-5',
                            ratio === '1:1' && 'size-6'
                          )}
                        />
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  ref={durationSpecsRef}
                  className={cn(
                    'grid grid-cols-[86px_1fr_auto] items-center gap-3 rounded-xl p-3 transition',
                    activeSpecsSection === 'duration' && 'bg-indigo-50 ring-1 ring-indigo-100'
                  )}
                >
                  <span className="text-sm font-black text-gray-500">
                    {copy.videoDuration}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">
                      {copy.durationMin}
                    </span>
                    <input
                      type="range"
                      min={MIN_DURATION_SECONDS}
                      max={MAX_DURATION_SECONDS}
                      step={1}
                      value={durationSeconds}
                      onChange={(event) => setDurationSeconds(Number(event.target.value))}
                      disabled={isSubmitting}
                      className="h-2 flex-1 accent-indigo-500"
                    />
                    <span className="text-sm font-bold text-gray-400">
                      {copy.durationMax}
                    </span>
                  </div>
                  <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-700">
                    {durationSeconds} {copy.seconds}
                  </span>
                </div>

                <div
                  ref={qualitySpecsRef}
                  className={cn(
                    'grid grid-cols-[86px_1fr] items-center gap-3 rounded-xl p-3 transition',
                    activeSpecsSection === 'quality' && 'bg-indigo-50 ring-1 ring-indigo-100'
                  )}
                >
                  <span className="text-sm font-black text-gray-500">
                    {copy.quality}
                  </span>
                  <div className="flex flex-wrap gap-5">
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-900">
                      <input
                        type="radio"
                        name="qualityMode"
                        value="standard"
                        checked={qualityMode === 'standard'}
                        onChange={() => setQualityMode('standard')}
                        disabled={isSubmitting}
                        className="size-5 accent-indigo-500"
                      />
                      {copy.qualityStandard}
                      <span className="font-semibold text-gray-500">
                        ({copy.qualityStandardHint})
                      </span>
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-gray-900">
                      <input
                        type="radio"
                        name="qualityMode"
                        value="high"
                        checked={qualityMode === 'high'}
                        onChange={() => setQualityMode('high')}
                        disabled={isSubmitting}
                        className="size-5 accent-indigo-500"
                      />
                      {copy.qualityHigh}
                      <span className="font-semibold text-gray-500">
                        ({copy.qualityHighHint})
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

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
                  <figure key={card.asset} className="text-center">
                    <div className="aspect-[3/4] overflow-hidden rounded-lg bg-white shadow-sm">
                      <video
                        src={card.asset}
                        className="size-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                      />
                    </div>
                    <figcaption className="mt-4 text-sm font-bold text-gray-500">
                      {card.label}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>
      </CanvasStage>

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
    </form>
  );
}
