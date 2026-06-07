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
import {
  BlueBanner,
  CanvasStage,
  ChoiceGrid,
  ExampleProducts,
  PanelSection,
  ResultCard,
  SegmentedOptions,
  StudioPanel,
  UploadDropzone,
} from '@/components/create/workbench-ui';
import {
  commonWorkbenchCopy,
  imageVideoWorkbenchCopy,
} from '@/components/create/workbench-copy';
import {
  getLibraryItemAssetId as getItemAssetId,
  getLibraryItemImage as getItemImage,
  getLibraryItemLabel as getItemLabel,
  libraryItemKey as itemKey,
  normalizeLibraryItems as normalizeItems,
  type WorkbenchLibraryItem as LibraryItem,
} from '@/components/create/library-item-utils';
import { refreshDashboardUser } from '@/lib/dashboard/user-cache';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { getCreditCostForDuration } from '@/lib/generations/credit-costs';
import { imageToVideoTemplateCategories } from '@/lib/templates/category-config';
import { getTemplateCategoryLabel } from '@/lib/templates/catalog';
import {
  normalizePublicTemplateDetail,
  normalizePublicTemplateItems,
  type PublicTemplateItem,
} from '@/lib/templates/public-client';
import { cn } from '@/lib/utils';

type AspectRatio = '9:16' | '1:1' | '16:9';
type DurationSeconds = 5 | 8 | 10;
type MaterialPickerSource = 'official' | 'history';

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
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const IMAGE_TO_VIDEO_LIBRARY_CATEGORY = 'image_to_video';
const aspectRatios: AspectRatio[] = ['9:16', '1:1', '16:9'];
const durations: DurationSeconds[] = [5, 8, 10];
const materialPickerCopy = {
  pt: {
    official: 'Materiais oficiais',
    history: 'Meu historico',
    loadingHistory: 'Carregando historico',
    historyError: 'Nao foi possivel carregar seu historico.',
    emptyHistory: 'Seu historico ainda nao tem imagens para este fluxo.',
    allTemplates: 'Todos',
    templateLibrary: 'Templates',
    loadingTemplates: 'Carregando templates',
    templateError: 'Nao foi possivel carregar o template.',
    emptyTemplates: 'Nenhum template nesta categoria.',
    retry: 'Tentar novamente',
  },
  en: {
    official: 'Official materials',
    history: 'My history',
    loadingHistory: 'Loading history',
    historyError: 'History could not be loaded.',
    emptyHistory: 'Your history does not have images for this flow yet.',
    allTemplates: 'All',
    templateLibrary: 'Templates',
    loadingTemplates: 'Loading templates',
    templateError: 'Template could not be loaded.',
    emptyTemplates: 'No templates in this category.',
    retry: 'Retry',
  },
  zh: {
    official: '官方素材',
    history: '我的历史',
    loadingHistory: '加载历史素材中',
    historyError: '历史素材加载失败。',
    emptyHistory: '当前流程还没有可用的历史图片。',
    allTemplates: '全部',
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
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-indigo-100 bg-indigo-50 text-indigo-500">
          <Icon className="size-4" />
        </span>
        <h2 className="truncate text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      {meta ? <p className="shrink-0 text-xs font-medium text-gray-400">{meta}</p> : null}
    </div>
  );
}

function EmptyMedia({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-sm text-gray-400">
      <Film className="mb-3 size-9 text-gray-300" />
      <span>{label}</span>
    </div>
  );
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
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    () => starterPrompt || copy.promptPresets[0]
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [durationSeconds, setDurationSeconds] = useState<DurationSeconds>(5);
  const [exampleOffset, setExampleOffset] = useState(0);
  const [templates, setTemplates] = useState<PublicTemplateItem[]>([]);
  const [templateCategory, setTemplateCategory] = useState('');
  const [templateTotal, setTemplateTotal] = useState(0);
  const [templateReloadKey, setTemplateReloadKey] = useState(0);
  const [assets, setAssets] = useState<LibraryItem[]>([]);
  const [materialSource, setMaterialSource] =
    useState<MaterialPickerSource>('official');
  const [historyItems, setHistoryItems] = useState<LibraryItem[]>([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<LibraryItem | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<LibraryItem | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [templateError, setTemplateError] = useState(false);
  const [loadingTemplateId, setLoadingTemplateId] = useState('');
  const [submitLabel, setSubmitLabel] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestedTemplateId = initialTemplateId;

  const isSubmitting = Boolean(submitLabel);
  const trimmedPrompt = prompt.trim();
  const selectedResultUrl = resultUrl(jobStatus);
  const selectedAssetImage = selectedAsset ? getItemImage(selectedAsset) : '';
  const selectedAssetId = selectedAsset ? getItemAssetId(selectedAsset) : '';
  const selectedTemplateId =
    selectedTemplate?.id == null ? '' : String(selectedTemplate.id);
  const libraryItems = useMemo(
    () => [...assets, ...templates].filter((item) => getItemImage(item)),
    [assets, templates]
  );
  const selectableAssets = useMemo(
    () => assets.filter((item) => getItemAssetId(item) && getItemImage(item)),
    [assets]
  );
  const selectableHistoryItems = useMemo(
    () =>
      historyItems.filter((item) => getItemAssetId(item) && getItemImage(item)),
    [historyItems]
  );
  const canSubmit = Boolean(
    (sourceFile || selectedAssetId) && trimmedPrompt && !isSubmitting
  );

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
    let cancelled = false;
    const controller = new AbortController();

    async function loadLibraryAssets() {
      setIsLoadingLibrary(true);

      try {
        const assetParams = new URLSearchParams({
          pageSize: '12',
          category: IMAGE_TO_VIDEO_LIBRARY_CATEGORY,
        });
        const response = await fetch(
          `/api/library-assets?${assetParams.toString()}`,
          { signal: controller.signal }
        );
        const assetBody = response.ok ? await response.json() : { items: [] };

        if (!cancelled) {
          const nextAssets = normalizeItems(assetBody);
          const defaultAsset = nextAssets.find(
            (asset) => getItemAssetId(asset) && getItemImage(asset)
          );
          setAssets(nextAssets);
          setSelectedAsset((current) =>
            current && getItemAssetId(current) ? current : defaultAsset ?? null
          );
        }
      } catch {
        if (!cancelled) {
          setAssets([]);
        }
      } finally {
        if (!cancelled) setIsLoadingLibrary(false);
      }
    }

    void loadLibraryAssets();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

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
    if (materialSource !== 'history' || hasLoadedHistory) return;

    let cancelled = false;

    async function loadHistory() {
      setIsLoadingHistory(true);
      setHistoryError(false);

      try {
        const params = new URLSearchParams({
          generationType: 'image_to_video',
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
          setHistoryError(true);
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
  }, [hasLoadedHistory, materialSource]);

  useEffect(() => {
    setPrompt((current) => current || copy.promptPresets[0]);
  }, [copy.promptPresets]);

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

  function selectSourceFile(file: File | null) {
    setError(null);
    if (!file) {
      setSourceFile(null);
      return;
    }

    const validationError = validateImage(file, commonCopy);
    if (validationError) {
      setSourceFile(null);
      setError(validationError);
      return;
    }

    setSourceFile(file);
    setSelectedAsset(null);
  }

  function selectLibraryAsset(asset: LibraryItem | null | undefined) {
    if (!asset || !getItemAssetId(asset)) return;

    setError(null);
    setSourceFile(null);
    setSelectedAsset(asset);
  }

  async function selectTemplate(template: PublicTemplateItem) {
    setError(null);
    setSelectedTemplate(template);
    setLoadingTemplateId(template.id);

    try {
      const response = await fetch(
        `/api/templates/${encodeURIComponent(template.id)}?${new URLSearchParams({ locale })}`
      );

      if (!response.ok) {
        throw new Error('template-detail-load-failed');
      }

      const detail = normalizePublicTemplateDetail(await response.json());
      if (!detail) {
        throw new Error('template-detail-invalid');
      }

      setSelectedTemplate(detail);
      setPrompt(detail.prompt);
    } catch {
      setError(materialCopy.templateError);
    } finally {
      setLoadingTemplateId('');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sourceFile && !selectedAssetId) {
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
      let inputAssetId = selectedAssetId;
      if (sourceFile) {
        setSubmitLabel(copy.uploadingImage);
        inputAssetId = await uploadAsset(sourceFile, commonCopy);
      }

      setSubmitLabel(copy.startingGeneration);
      const generation = await postJson<GenerationResponse>(
        '/api/generations',
        {
          generationType: 'image_to_video',
          inputAssetId,
          ...(selectedTemplateId ? { templateId: selectedTemplateId } : {}),
          prompt: trimmedPrompt,
          aspectRatio,
          durationSeconds,
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

  function applyPromptSnippet(snippet: string) {
    setPrompt((current) => {
      const trimmed = current.trim();
      return trimmed ? `${trimmed} ${snippet}` : snippet;
    });
  }

  const baseExampleImages = libraryItems.map(getItemImage).filter(Boolean);
  const exampleStart = baseExampleImages.length ? exampleOffset % baseExampleImages.length : 0;
  const exampleImages = [
    ...baseExampleImages.slice(exampleStart),
    ...baseExampleImages.slice(0, exampleStart),
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
        <div className="mb-5 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            className="relative h-11 rounded-md bg-white text-sm font-bold text-gray-700 shadow-sm"
          >
            {copy.quickEdit}
            <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
              NEW
            </span>
          </button>
          <button
            type="button"
            className="h-11 rounded-md border border-indigo-200 bg-white text-sm font-bold text-indigo-600"
          >
            {copy.videoTab}
          </button>
        </div>

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
          <div className="mt-3 grid grid-cols-4 gap-2">
            {copy.promptActions.map((item, index) => (
              <button
                key={item}
                type="button"
                onClick={() => applyPromptSnippet(copy.promptActionSnippets[index] ?? item)}
                disabled={isSubmitting}
                className="h-10 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:border-indigo-200 hover:text-indigo-600"
              >
                {item}
                {index === 0 ? (
                  <span className="ml-1 rounded bg-indigo-50 px-1 py-0.5 text-[10px] text-indigo-600">
                    {copy.recommended}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </PanelSection>

        <PanelSection title={copy.uploadTitle} required hint={copy.uploadHint}>
          <UploadDropzone
            id="source-file"
            preview={sourcePreview ?? selectedAssetImage}
            fileName={
              sourceFile
                ? `${sourceFile.name} · ${formatFileSize(sourceFile.size)}`
                : selectedAsset
                  ? getItemLabel(selectedAsset)
                  : null
            }
            emptyText={commonCopy.uploadClick}
            hint={copy.uploadDropHint}
            disabled={isSubmitting}
            onChange={(files) => selectSourceFile(files?.[0] ?? null)}
          />
        </PanelSection>

        <PanelSection title={copy.specs}>
          <div className="rounded-lg bg-gray-100 p-3">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-600">
              <span>{copy.specsLabel}</span>
              <span className="rounded bg-white px-2 py-1">{aspectRatio}</span>
              <span className="rounded bg-white px-2 py-1">{durationSeconds}{copy.seconds}</span>
              <span className="rounded bg-white px-2 py-1">{copy.standardQuality}</span>
              <label className="ml-auto inline-flex items-center gap-1">
                <input type="checkbox" checked readOnly className="size-4 accent-indigo-500" />
                {copy.audioSync}
              </label>
            </div>
            <SegmentedOptions
              options={aspectRatios}
              value={aspectRatio}
              onChange={setAspectRatio}
              disabled={isSubmitting}
            />
            <div className="mt-3">
              <SegmentedOptions
                options={durations}
                value={durationSeconds}
                onChange={setDurationSeconds}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </PanelSection>

        <PanelSection
          title={copy.inspiration}
          hint={
            isLoadingTemplates
              ? materialCopy.loadingTemplates
              : commonCopy.templateCount(templateTotal)
          }
        >
          <ChoiceGrid
            options={copy.promptPresets}
            value={prompt}
            onChange={setPrompt}
            disabled={isSubmitting}
          />
          <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
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
              <button
                type="button"
                onClick={() => setTemplateCategory('')}
                disabled={isSubmitting}
                className={cn(
                  'inline-flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
                  !templateCategory
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600'
                )}
              >
                {materialCopy.allTemplates}
              </button>
              {imageToVideoTemplateCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    setTemplateCategory((current) =>
                      current === category ? '' : category
                    )
                  }
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
                  const loading = loadingTemplateId === template.id;

                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => void selectTemplate(template)}
                      disabled={isSubmitting || loading}
                      className={cn(
                        'relative aspect-[4/5] overflow-hidden rounded-lg border bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-60',
                        active
                          ? 'border-indigo-500 ring-2 ring-indigo-100'
                          : 'border-gray-200 hover:border-indigo-200'
                      )}
                      title={template.title}
                    >
                      <img
                        src={template.thumbnailUrl}
                        alt=""
                        className="size-full object-cover"
                      />
                      <span className="absolute inset-x-1 bottom-1 truncate rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-gray-700">
                        {template.title}
                      </span>
                      {loading ? (
                        <span className="absolute inset-0 grid place-items-center bg-white/60">
                          <Loader2 className="size-4 animate-spin text-indigo-600" />
                        </span>
                      ) : active ? (
                        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-300 text-gray-950">
                          <CheckCircle2 className="size-4" />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-3 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                  {materialCopy.emptyTemplates}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            {(['official', 'history'] as const).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => setMaterialSource(source)}
                disabled={isSubmitting}
                className={cn(
                  'h-9 rounded-md text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
                  materialSource === source
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 hover:bg-white hover:text-indigo-600'
                )}
              >
                {source === 'official' ? materialCopy.official : materialCopy.history}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {materialSource === 'history' ? (
              isLoadingHistory ? (
                <div className="col-span-3 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm font-semibold text-gray-400">
                  <Loader2 className="size-4 animate-spin" />
                  {materialCopy.loadingHistory}
                </div>
              ) : historyError ? (
                <div className="col-span-3 rounded-lg border border-red-100 bg-red-50 px-3 py-4 text-sm text-red-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{materialCopy.historyError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setHistoryError(false);
                      setHasLoadedHistory(false);
                    }}
                    className="mt-2 text-xs font-bold text-red-700 underline underline-offset-2"
                  >
                    {materialCopy.retry}
                  </button>
                </div>
              ) : selectableHistoryItems.length ? (
                selectableHistoryItems.slice(0, 12).map((asset) => {
                  const image = getItemImage(asset);
                  const active = selectedAssetId === getItemAssetId(asset);

                  return (
                    <button
                      key={itemKey(asset)}
                      type="button"
                      onClick={() => selectLibraryAsset(asset)}
                      disabled={isSubmitting}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-lg border bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-60',
                        active
                          ? 'border-indigo-500 ring-2 ring-indigo-100'
                          : 'border-gray-200 hover:border-indigo-200'
                      )}
                      title={getItemLabel(asset)}
                    >
                      <img src={image} alt="" className="size-full object-cover" />
                      {active ? (
                        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-300 text-gray-950">
                          <CheckCircle2 className="size-4" />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-3 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400">
                  {materialCopy.emptyHistory}
                </div>
              )
            ) : selectableAssets.length
              ? selectableAssets.slice(0, 6).map((asset) => {
                  const image = getItemImage(asset);
                  const active = selectedAssetId === getItemAssetId(asset);

                  return (
                    <button
                      key={itemKey(asset)}
                      type="button"
                      onClick={() => selectLibraryAsset(asset)}
                      disabled={isSubmitting}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-lg border bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-60',
                        active
                          ? 'border-indigo-500 ring-2 ring-indigo-100'
                          : 'border-gray-200 hover:border-indigo-200'
                      )}
                      title={getItemLabel(asset)}
                    >
                      <img src={image} alt="" className="size-full object-cover" />
                      {active ? (
                        <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-emerald-300 text-gray-950">
                          <CheckCircle2 className="size-4" />
                        </span>
                      ) : null}
                    </button>
                  );
                })
              : (exampleImages.length
                  ? exampleImages
                  : ['/resources/example1.png', '/resources/example2.png', '/resources/example3.png']
                ).map((image) => (
                  <img
                    key={image}
                    src={image}
                    alt=""
                    className="aspect-square rounded-lg bg-gray-100 object-cover"
                  />
                ))}
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
        subtitle={copy.canvasSubtitle}
        banner={
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
            {copy.canvasNotice}
          </div>
        }
      >
        <div className="mx-auto w-full max-w-4xl">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr]">
            <figure className="text-center">
              <div className="mx-auto flex aspect-[4/5] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm">
                {sourcePreview || selectedAssetImage ? (
                  <img
                    src={sourcePreview ?? selectedAssetImage}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-10 text-gray-300" />
                )}
              </div>
              <figcaption className="mt-4 text-sm font-bold text-gray-500">
                {copy.detailLabel}
              </figcaption>
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

          <ExampleProducts
            images={exampleImages.length ? exampleImages : undefined}
            title={commonCopy.examples}
            refreshLabel={commonCopy.refresh}
            onRefresh={() => setExampleOffset((offset) => offset + 1)}
          />
        </div>
      </CanvasStage>
    </form>
  );
}
