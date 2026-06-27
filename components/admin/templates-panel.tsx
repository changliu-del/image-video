'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  GripVertical,
  ImagePlus,
  ListOrdered,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AdminManagementTable,
  AdminModal,
  AdminRecordDetails,
  formatAdminDate,
  type AdminTableAction,
  type AdminTableColumn,
} from '@/components/admin/admin-management-table';
import type { AdminContent, AdminLocale } from '@/lib/admin/content';
import { getAdminTemplateTypeLabel } from '@/lib/admin/template-types';
import {
  getTemplateCategoryLabel,
  type TemplateCatalogDetailItem,
  type TemplateType,
} from '@/lib/templates/catalog';
import { getTemplateCategoriesForType } from '@/lib/templates/category-config';
import { buildTemplateMediaUrl } from '@/lib/templates/media-url';
import {
  buildModelCategoryFromParts,
  localizeModelCategoryTag,
  modelAgeTagOptions,
  modelGenderTagOptions,
  parseModelCategoryParts,
} from '@/lib/model-assets/localization';

type AdminTemplate = TemplateCatalogDetailItem & {
  titleTranslations: Record<string, string>;
  promptTranslations: Record<string, string>;
  thumbnailAssetId: string;
  previewAssetId: string;
  thumbnailMimeType: string;
  previewMimeType: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type TemplateMediaTarget = 'thumbnail' | 'preview';

type TemplateFormState = {
  id?: string;
  title: string;
  titleTranslations: string;
  type: TemplateType;
  category: string;
  thumbnailAssetId: string;
  previewAssetId: string;
  prompt: string;
  promptTranslations: string;
};

type ModalMode = 'create' | 'view' | 'edit';

type PaginatedTemplates = {
  categories: string[];
  list: AdminTemplate[];
  total: number;
  page: number;
  pageSize: number;
};

type TemplateFilterState = {
  age: string;
  id: string;
  title: string;
  category: string;
  gender: string;
  style: string;
};

type TemplateOrderResponse = {
  type: TemplateType;
  category: string;
  list: AdminTemplate[];
  total: number;
};

type ModelTemplateCategoriesResponse = {
  categories?: string[];
};

type TemplateOrderFormState = {
  type: TemplateType;
  category: string;
};

const emptyForm: TemplateFormState = {
  title: '',
  titleTranslations: '{}',
  type: 'image_to_video',
  category: 'common',
  thumbnailAssetId: '',
  previewAssetId: '',
  prompt: '',
  promptTranslations: '{}',
};

const defaultTemplateType: TemplateType = 'image_to_video';
const emptyUploadFiles: Record<TemplateMediaTarget, File | null> = {
  thumbnail: null,
  preview: null,
};
const emptyTemplateFilters: TemplateFilterState = {
  age: '',
  id: '',
  title: '',
  category: '',
  gender: '',
  style: '',
};

const modelCategoryFieldLabels: Record<
  AdminLocale,
  Record<'age' | 'gender' | 'style', string>
> = {
  pt: { age: 'Idade', gender: 'Genero', style: 'Estilo' },
  en: { age: 'Age', gender: 'Gender', style: 'Style' },
  zh: { age: '年龄', gender: '性别', style: '风格' },
};

function defaultCategoryForType(type: TemplateType) {
  return (
    getTemplateCategoriesForType(type)[0] ??
    (type === 'model' ? '' : 'common')
  );
}

function normalizeFormCategoryForSubmit(type: TemplateType, category: string) {
  const trimmed = category.trim();
  return type === 'model' ? trimmed : trimmed.toLowerCase();
}

function modelCategoryPartOptions(
  categories: string[],
  key: 'age' | 'gender' | 'style',
  extras: string[] = []
) {
  return Array.from(
    new Set(
      [
        ...categories.map((category) => parseModelCategoryParts(category)[key]),
        ...extras,
      ]
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function updateModelCategoryPart(
  category: string,
  key: 'age' | 'gender' | 'style',
  value: string
) {
  const parts = parseModelCategoryParts(category);
  return buildModelCategoryFromParts({
    age: key === 'age' ? value : parts.age,
    gender: key === 'gender' ? value : parts.gender,
    style: key === 'style' ? value : parts.style,
  });
}

function freshEmptyForm(
  type: TemplateType = defaultTemplateType
): TemplateFormState {
  return {
    ...emptyForm,
    type,
    category: defaultCategoryForType(type),
  };
}

function templateToForm(template: AdminTemplate): TemplateFormState {
  return {
    id: template.id,
    title: template.title,
    titleTranslations: formatTranslations(template.titleTranslations),
    type: template.type,
    category: template.category,
    thumbnailAssetId: template.thumbnailAssetId,
    previewAssetId: template.previewAssetId,
    prompt: template.prompt,
    promptTranslations: formatTranslations(template.promptTranslations),
  };
}

function formatTranslations(value: Record<string, string> | null | undefined) {
  return JSON.stringify(value ?? {}, null, 2);
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

function parseTranslationsJson(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  const normalized: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(parsed)) {
    if (key !== 'pt') {
      throw new Error(`${label} only supports the pt key.`);
    }

    if (typeof rawValue !== 'string' || !rawValue.trim()) {
      throw new Error(`${label}.${key} must be a non-empty string.`);
    }

    normalized[key] = rawValue.trim();
  }

  return normalized;
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  fallbackError: string
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response, fallbackError));
  }

  return (await response.json()) as T;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function isVideoMimeType(mimeType: string) {
  return mimeType.startsWith('video/');
}

function TemplateMediaPreview({
  mimeType,
  url,
}: {
  mimeType: string;
  url: string;
}) {
  if (!url) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center bg-gray-100 text-gray-400">
        <ImagePlus className="size-6" aria-hidden="true" />
      </div>
    );
  }

  return isVideoMimeType(mimeType) ? (
    <video
      src={url}
      className="aspect-[4/3] w-full object-cover"
      controls
      muted
      playsInline
    />
  ) : (
    <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
  );
}

function TemplatePreview({ template }: { template: AdminTemplate }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <TemplateMediaPreview
          mimeType={template.thumbnailMimeType}
          url={template.thumbnailUrl}
        />
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <TemplateMediaPreview
          mimeType={template.previewMimeType}
          url={template.previewUrl}
        />
      </div>
    </div>
  );
}

function SortableTemplateOrderRow({
  disabled,
  dragLabel,
  index,
  moveDownLabel,
  moveUpLabel,
  onMove,
  template,
  total,
}: {
  disabled: boolean;
  dragLabel: string;
  index: number;
  moveDownLabel: string;
  moveUpLabel: string;
  onMove: (index: number, direction: -1 | 1) => void;
  template: AdminTemplate;
  total: number;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: template.id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 border-b border-gray-100 bg-white px-3 py-3 last:border-b-0 ${
        isDragging ? 'relative shadow-sm' : ''
      }`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 touch-none cursor-grab text-gray-400 active:cursor-grabbing"
        disabled={disabled}
        aria-label={dragLabel}
        title={dragLabel}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </Button>
      <div className="w-8 text-center text-xs font-semibold tabular-nums text-gray-400">
        {index + 1}
      </div>
      <div className="size-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
        <img
          src={template.thumbnailUrl}
          alt=""
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-gray-950">
          {template.title}
        </div>
        <div className="mt-1 truncate text-xs text-gray-500">
          {template.id}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, -1)}
          aria-label={moveUpLabel}
          title={moveUpLabel}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8"
          disabled={disabled || index === total - 1}
          onClick={() => onMove(index, 1)}
          aria-label={moveDownLabel}
          title={moveDownLabel}
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function TemplateMediaField({
  accept,
  assetId,
  currentAssetLabel,
  disabled,
  file,
  label,
  mediaUrl,
  mimeType,
  onAssetIdChange,
  onFileChange,
  onUpload,
  uploadLabel,
  uploading,
}: {
  accept: string;
  assetId: string;
  currentAssetLabel: string;
  disabled: boolean;
  file: File | null;
  label: string;
  mediaUrl: string;
  mimeType: string;
  onAssetIdChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  uploadLabel: string;
  uploading: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase text-gray-500">
          {label}
        </div>
        {mediaUrl ? (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-orange-700"
          >
            {currentAssetLabel}
          </a>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-md border border-gray-200 bg-gray-100">
        <TemplateMediaPreview mimeType={mimeType} url={mediaUrl} />
      </div>
      <Input
        value={assetId}
        onChange={(event) => onAssetIdChange(event.target.value)}
      />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          type="file"
          accept={accept}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          disabled={disabled}
        />
        <Button
          type="button"
          onClick={onUpload}
          disabled={disabled || !file}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {uploadLabel}
        </Button>
      </div>
    </div>
  );
}

export function TemplatesPanel({
  activeType,
  canPublish,
  content,
  locale,
}: {
  activeType: TemplateType;
  canPublish: boolean;
  content: AdminContent;
  locale: AdminLocale;
}) {
  const copy = content.templates;
  const common = content.common;
  const [data, setData] = useState<PaginatedTemplates>({
    categories: [],
    list: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [filters, setFilters] =
    useState<TemplateFilterState>(emptyTemplateFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<TemplateFilterState>(emptyTemplateFilters);
  const { handleSubmit, register, reset, setValue, watch } =
    useForm<TemplateFormState>({
      defaultValues: freshEmptyForm(activeType),
      mode: 'onSubmit',
    });
  const form = watch();
  const [selectedTemplate, setSelectedTemplate] =
    useState<AdminTemplate | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [uploadFiles, setUploadFiles] =
    useState<Record<TemplateMediaTarget, File | null>>(emptyUploadFiles);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] =
    useState<TemplateMediaTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<TemplateOrderFormState>({
    type: activeType,
    category: defaultCategoryForType(activeType),
  });
  const [orderedTemplates, setOrderedTemplates] = useState<AdminTemplate[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [modelOrderCategories, setModelOrderCategories] = useState<string[]>([]);
  const [loadingModelOrderCategories, setLoadingModelOrderCategories] =
    useState(false);

  const orderSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeTypeLabel = getAdminTemplateTypeLabel(activeType, locale);

  const orderCategoryOptions =
    activeType === 'model'
      ? modelOrderCategories
      : getTemplateCategoriesForType(activeType);
  const canSelectOrderCategory = orderCategoryOptions.length > 0;
  const formCategoryOptions = getTemplateCategoriesForType(activeType);
  const canSelectFormCategory = formCategoryOptions.length > 0;
  const categoryFilterOptions = useMemo(() => {
    const options = data.categories.length
      ? data.categories
      : getTemplateCategoriesForType(activeType);

    return Array.from(
      new Set(
        [...options, filters.category, appliedFilters.category].filter(Boolean)
      )
    );
  }, [activeType, appliedFilters.category, data.categories, filters.category]);
  const modelFieldLabels = modelCategoryFieldLabels[locale];
  const modelFormParts = parseModelCategoryParts(form.category);
  const modelCategoryFilterOptions = useMemo(
    () => ({
      age: modelCategoryPartOptions(data.categories, 'age', [
        ...modelAgeTagOptions,
        filters.age,
        appliedFilters.age,
      ]),
      gender: modelCategoryPartOptions(data.categories, 'gender', [
        ...modelGenderTagOptions,
        filters.gender,
        appliedFilters.gender,
      ]),
      style: modelCategoryPartOptions(data.categories, 'style', [
        filters.style,
        appliedFilters.style,
        modelFormParts.style,
      ]),
    }),
    [
      appliedFilters.age,
      appliedFilters.gender,
      appliedFilters.style,
      data.categories,
      filters.age,
      filters.gender,
      filters.style,
      modelFormParts.style,
    ]
  );
  const modelFormStyleOptions = useMemo(
    () =>
      Array.from(
        new Set([...modelCategoryFilterOptions.style, modelFormParts.style])
      ).filter(Boolean),
    [modelCategoryFilterOptions.style, modelFormParts.style]
  );

  const columns = useMemo<AdminTableColumn<AdminTemplate>[]>(
    () => [
      {
        key: 'id',
        label: copy.columns.id ?? 'ID',
        kind: 'primary',
        width: 260,
        render: (template) => (
          <div className="break-words font-mono text-xs text-gray-900">
            {template.id}
          </div>
        ),
      },
      {
        key: 'title',
        label: copy.fields.title ?? 'Title',
        width: 220,
        render: (template) => (
          <div className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900">
            {template.title}
          </div>
        ),
      },
      {
        key: 'category',
        label: copy.columns.category,
        width: activeType === 'model' ? 220 : 140,
        render: (template) => {
          if (template.type === 'model') {
            const parts = parseModelCategoryParts(template.category);
            const tags = [parts.gender, parts.age, parts.style].filter(Boolean);

            return (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex min-h-6 items-center rounded-md bg-gray-100 px-2 text-xs font-semibold text-gray-600"
                  >
                    {localizeModelCategoryTag(tag, locale) || tag}
                  </span>
                ))}
              </div>
            );
          }

          return (
            <span className="inline-flex min-h-6 items-center rounded-md bg-gray-100 px-2 text-xs font-semibold text-gray-600">
              {getTemplateCategoryLabel(template.category, locale)}
            </span>
          );
        },
      },
      {
        key: 'sortOrder',
        label: copy.columns.sortOrder ?? 'Order',
        width: 96,
        render: (template) => (
          <span className="text-sm tabular-nums text-gray-700">
            {template.sortOrder}
          </span>
        ),
      },
      {
        key: 'prompt',
        label: copy.fields.prompt,
        width: 420,
        render: (template) => (
          <p className="line-clamp-2 text-sm leading-5 text-gray-700">
            {template.prompt}
          </p>
        ),
      },
      {
        key: 'updatedAt',
        label: copy.columns.updatedAt,
        width: 178,
        render: (template) => (
          <span className="text-xs tabular-nums text-gray-500">
            {formatAdminDate(template.updatedAt)}
          </span>
        ),
      },
    ],
    [activeType, copy, locale]
  );

  async function loadTemplates(page = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(data.pageSize),
        type: activeType,
      });
      if (appliedFilters.id) params.set('id', appliedFilters.id);
      if (appliedFilters.title) params.set('title', appliedFilters.title);
      if (activeType === 'model') {
        if (appliedFilters.gender) params.set('gender', appliedFilters.gender);
        if (appliedFilters.age) params.set('age', appliedFilters.age);
        if (appliedFilters.style) params.set('style', appliedFilters.style);
      } else if (appliedFilters.category) {
        params.set('category', appliedFilters.category);
      }
      const result = await requestJson<PaginatedTemplates>(
        `/api/admin/templates?${params}`,
        { method: 'GET' },
        copy.errors.load
      );

      setData(result);
      if (selectedTemplate?.id) {
        const refreshed = result.list.find(
          (item) => item.id === selectedTemplate.id
        );
        if (refreshed) {
          setSelectedTemplate(refreshed);
          reset(templateToForm(refreshed));
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : copy.errors.load
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, appliedFilters]);

  useEffect(() => {
    setSelectedTemplate(null);
    setModalMode(null);
    reset(freshEmptyForm(activeType));
    setOrderForm({
      type: activeType,
      category: defaultCategoryForType(activeType),
    });
    setOrderedTemplates([]);
    setOrderError(null);
    setFilters(emptyTemplateFilters);
    setAppliedFilters(emptyTemplateFilters);
  }, [activeType, reset]);

  function openCreate() {
    setSelectedTemplate(null);
    reset(freshEmptyForm(activeType));
    setUploadFiles(emptyUploadFiles);
    setModalMode('create');
    setError(null);
  }

  function openView(template: AdminTemplate) {
    setSelectedTemplate(template);
    reset(templateToForm(template));
    setUploadFiles(emptyUploadFiles);
    setModalMode('view');
    setError(null);
  }

  function openEdit(template: AdminTemplate) {
    setSelectedTemplate(template);
    reset(templateToForm(template));
    setUploadFiles(emptyUploadFiles);
    setModalMode('edit');
    setError(null);
  }

  function updateUploadFile(target: TemplateMediaTarget, file: File | null) {
    setUploadFiles((current) => ({ ...current, [target]: file }));
  }

  async function saveTemplate(values: TemplateFormState) {
    setSaving(true);
    setError(null);
    try {
      const submittedForm = { ...form, ...values, type: activeType };
      const payload = {
        ...submittedForm,
        type: activeType,
        title: submittedForm.title.trim(),
        titleTranslations: parseTranslationsJson(
          submittedForm.titleTranslations,
          copy.fields.titleTranslations ?? 'Title translations'
        ),
        category: normalizeFormCategoryForSubmit(
          activeType,
          submittedForm.category
        ),
        promptTranslations: parseTranslationsJson(
          submittedForm.promptTranslations,
          copy.fields.promptTranslations ?? 'Prompt translations'
        ),
      };
      const url = submittedForm.id
        ? `/api/admin/templates/${submittedForm.id}`
        : '/api/admin/templates';
      const method = submittedForm.id ? 'PUT' : 'POST';
      await requestJson(
        url,
        {
          method,
          body: JSON.stringify(payload),
        },
        copy.errors.save
      );
      await loadTemplates(submittedForm.id ? data.page : 1);
      if (!submittedForm.id) {
        setModalMode(null);
        reset(freshEmptyForm(activeType));
      } else {
        setModalMode('view');
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : copy.errors.save
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(template = selectedTemplate) {
    if (!template?.id) return;
    if (!window.confirm(copy.confirmDelete(template.id))) return;

    setSaving(true);
    setError(null);
    try {
      await requestJson(
        `/api/admin/templates/${template.id}`,
        {
          method: 'DELETE',
        },
        copy.errors.delete
      );
      setSelectedTemplate(null);
      setModalMode(null);
      reset(freshEmptyForm(activeType));
      await loadTemplates(data.page);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : copy.errors.delete
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadTemplateMedia(target: TemplateMediaTarget) {
    const uploadFile = uploadFiles[target];
    const templateId = form.id;
    if (!templateId || !uploadFile) {
      setError(copy.selectSavedTemplate);
      return;
    }

    setUploadingTarget(target);
    setError(null);
    try {
      const presign = await requestJson<{
        assetId: string;
        uploadUrl: string;
        storageKey: string;
      }>(
        '/api/admin/template-preview/presign',
        {
          method: 'POST',
          body: JSON.stringify({
            templateId,
            target,
            fileName: uploadFile.name,
            mimeType: uploadFile.type,
            sizeBytes: uploadFile.size,
          }),
        },
        copy.errors.prepareUpload
      );

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadFile.type },
        body: uploadFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(copy.errors.upload);
      }

      const completed = await requestJson<{
        assetId: string;
        publicUrl: string;
        target: TemplateMediaTarget;
        status: string;
      }>(
        '/api/admin/template-preview/complete',
        {
          method: 'POST',
          body: JSON.stringify({
            templateId,
            target,
            assetId: presign.assetId,
            storageKey: presign.storageKey,
          }),
        },
        copy.errors.completeUpload
      );

      setValue(
        completed.target === 'thumbnail' ? 'thumbnailAssetId' : 'previewAssetId',
        completed.assetId,
        { shouldDirty: true }
      );
      setUploadFiles((current) => ({ ...current, [target]: null }));
      await loadTemplates(data.page);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : copy.errors.upload
      );
    } finally {
      setUploadingTarget(null);
    }
  }

  async function loadTemplateOrder(nextForm = orderForm) {
    if (!nextForm.category.trim()) {
      setOrderedTemplates([]);
      setOrderError(null);
      return;
    }

    setLoadingOrder(true);
    setOrderError(null);
    try {
      const params = new URLSearchParams({
        type: nextForm.type,
        category: nextForm.category,
      });
      const result = await requestJson<TemplateOrderResponse>(
        `/api/admin/templates/order?${params}`,
        { method: 'GET' },
        copy.errors.loadOrder ?? copy.errors.load
      );

      setOrderForm({
        type: result.type,
        category: result.category,
      });
      setOrderedTemplates(result.list);
    } catch (loadError) {
      setOrderedTemplates([]);
      setOrderError(
        loadError instanceof Error
          ? loadError.message
          : copy.errors.loadOrder ?? copy.errors.load
      );
    } finally {
      setLoadingOrder(false);
    }
  }

  function openOrderManager() {
    setOrderModalOpen(true);
    setOrderError(null);
    if (activeType !== 'model') {
      const nextForm = {
        type: activeType,
        category: orderForm.category || defaultCategoryForType(activeType),
      };
      setOrderForm(nextForm);
      void loadTemplateOrder(nextForm);
      return;
    }

    void loadModelOrderCategories()
      .then((categories) => {
        const nextForm = {
          type: activeType,
          category: orderForm.category || categories[0] || '',
        };
        setOrderForm(nextForm);
        void loadTemplateOrder(nextForm);
      })
      .catch((loadError) => {
        setOrderedTemplates([]);
        setOrderError(
          loadError instanceof Error
            ? loadError.message
            : copy.errors.loadOrder ?? copy.errors.load
        );
      });
  }

  async function loadModelOrderCategories() {
    if (modelOrderCategories.length > 0) return modelOrderCategories;

    setLoadingModelOrderCategories(true);
    try {
      const result = await requestJson<ModelTemplateCategoriesResponse>(
        `/api/templates?${new URLSearchParams({
          type: 'model',
          pageSize: '1',
          locale,
        })}`,
        { method: 'GET' },
        copy.errors.loadOrder ?? copy.errors.load
      );
      const categories = Array.from(
        new Set(
          (result.categories ?? [])
            .map((category) => category.trim())
            .filter(Boolean)
        )
      );
      setModelOrderCategories(categories);
      return categories;
    } finally {
      setLoadingModelOrderCategories(false);
    }
  }

  function updateOrderCategory(category: string) {
    const nextForm = {
      ...orderForm,
      category,
    };
    setOrderForm(nextForm);
    void loadTemplateOrder(nextForm);
  }

  function moveOrderedTemplate(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= orderedTemplates.length) return;

    setOrderedTemplates((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function handleOrderDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedTemplates((current) => {
      const oldIndex = current.findIndex(
        (template) => template.id === active.id
      );
      const newIndex = current.findIndex((template) => template.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return current;

      return arrayMove(current, oldIndex, newIndex);
    });
  }

  async function saveTemplateOrder() {
    setSavingOrder(true);
    setOrderError(null);
    try {
      const result = await requestJson<TemplateOrderResponse>(
        '/api/admin/templates/order',
        {
          method: 'PATCH',
          body: JSON.stringify({
            type: orderForm.type,
            category: orderForm.category,
            templateIds: orderedTemplates.map((template) => template.id),
          }),
        },
        copy.errors.saveOrder ?? copy.errors.save
      );
      setOrderedTemplates(result.list);
      await loadTemplates(data.page);
    } catch (saveError) {
      setOrderError(
        saveError instanceof Error
          ? saveError.message
          : copy.errors.saveOrder ?? copy.errors.save
      );
    } finally {
      setSavingOrder(false);
    }
  }

  function resetSearch() {
    setFilters(emptyTemplateFilters);
    setAppliedFilters(emptyTemplateFilters);
  }

  function applyFilters() {
    setAppliedFilters({
      age: activeType === 'model' ? filters.age.trim() : '',
      id: filters.id.trim(),
      title: filters.title.trim(),
      category: activeType === 'model' ? '' : filters.category.trim(),
      gender: activeType === 'model' ? filters.gender.trim() : '',
      style: activeType === 'model' ? filters.style.trim() : '',
    });
  }

  function updateFilter<K extends keyof TemplateFilterState>(
    key: K,
    value: TemplateFilterState[K]
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function tableActions(
    template: AdminTemplate
  ): AdminTableAction<AdminTemplate>[] {
    const actions: AdminTableAction<AdminTemplate>[] = [
      {
        key: 'view',
        label: common.viewDetails,
        icon: Eye,
        onClick: openView,
      },
      {
        key: 'edit',
        label: common.edit,
        icon: Edit3,
        onClick: openEdit,
      },
      {
        key: 'upload',
        label: common.upload,
        icon: Upload,
        variant: 'outline',
        onClick: openEdit,
      },
    ];

    if (canPublish) {
      actions.push({
        key: 'delete',
        label: common.delete,
        icon: Trash2,
        variant: 'destructive',
        onClick: deleteTemplate,
      });
    }

    return actions;
  }

  const selectedKey = selectedTemplate ? String(selectedTemplate.id) : null;

  const modalTitle =
    modalMode === 'create'
      ? copy.modalCreate
      : modalMode === 'edit'
        ? copy.modalEdit
        : copy.modalDetails;
  const thumbnailMediaUrl = form.thumbnailAssetId
    ? buildTemplateMediaUrl(form.thumbnailAssetId)
    : (selectedTemplate?.thumbnailUrl ?? '');
  const previewMediaUrl = form.previewAssetId
    ? buildTemplateMediaUrl(form.previewAssetId)
    : (selectedTemplate?.previewUrl ?? '');
  const thumbnailMimeType =
    selectedTemplate?.thumbnailAssetId === form.thumbnailAssetId
      ? selectedTemplate.thumbnailMimeType
      : 'image/png';
  const previewMimeType =
    selectedTemplate?.previewAssetId === form.previewAssetId
      ? selectedTemplate.previewMimeType
      : activeType === 'image_to_video'
        ? 'video/mp4'
        : 'image/png';
  const uploadDisabled = !form.id || Boolean(uploadingTarget);
  const orderInteractionDisabled = savingOrder || loadingOrder;

  return (
    <>
      <AdminManagementTable
        actions={tableActions}
        columns={columns}
        description={copy.description}
        emptyText={copy.emptyText}
        error={error}
        icon={ImagePlus}
        labels={common}
        loading={loading}
        onRefresh={() => loadTemplates(data.page)}
        onReset={resetSearch}
        onRowClick={openView}
        onSearch={applyFilters}
        pagination={{
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          onPageChange: loadTemplates,
        }}
        primaryAction={
          <>
            <Button type="button" variant="outline" onClick={openOrderManager}>
              <ListOrdered className="size-4" />
              {copy.reorder ?? 'Reorder'}
            </Button>
            <Button
              type="button"
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={openCreate}
            >
              <Plus className="size-4" />
              {copy.create}
            </Button>
          </>
        }
        rowKey={(template, index) => String(template.id ?? index)}
        rows={data.list}
        selectedRowKey={selectedKey}
        statusLabels={content.statusLabels}
        tableMinWidth={1000}
        title={`${copy.title}: ${activeTypeLabel}`}
        toolbarFilters={
          <>
            <label className="grid min-w-0 gap-1 sm:w-48">
              <span className="text-xs font-semibold uppercase text-gray-500">
                {copy.fields.id}
              </span>
              <Input
                value={filters.id}
                onChange={(event) => updateFilter('id', event.target.value)}
                placeholder={copy.fields.id}
                className="h-9"
              />
            </label>
            <label className="grid min-w-0 gap-1 sm:w-56">
              <span className="text-xs font-semibold uppercase text-gray-500">
                {copy.fields.title}
              </span>
              <Input
                value={filters.title}
                onChange={(event) => updateFilter('title', event.target.value)}
                placeholder={copy.fields.title}
                className="h-9"
              />
            </label>
            {activeType === 'model' ? (
              <>
                <label className="grid min-w-0 gap-1 sm:w-36">
                  <span className="text-xs font-semibold uppercase text-gray-500">
                    {modelFieldLabels.gender}
                  </span>
                  <select
                    value={filters.gender}
                    onChange={(event) =>
                      updateFilter('gender', event.target.value)
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    aria-label={modelFieldLabels.gender}
                  >
                    <option value="">{copy.allCategories}</option>
                    {modelCategoryFilterOptions.gender.map((gender) => (
                      <option key={gender} value={gender}>
                        {localizeModelCategoryTag(gender, locale) || gender}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid min-w-0 gap-1 sm:w-36">
                  <span className="text-xs font-semibold uppercase text-gray-500">
                    {modelFieldLabels.age}
                  </span>
                  <select
                    value={filters.age}
                    onChange={(event) =>
                      updateFilter('age', event.target.value)
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    aria-label={modelFieldLabels.age}
                  >
                    <option value="">{copy.allCategories}</option>
                    {modelCategoryFilterOptions.age.map((age) => (
                      <option key={age} value={age}>
                        {localizeModelCategoryTag(age, locale) || age}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid min-w-0 gap-1 sm:w-40">
                  <span className="text-xs font-semibold uppercase text-gray-500">
                    {modelFieldLabels.style}
                  </span>
                  <select
                    value={filters.style}
                    onChange={(event) =>
                      updateFilter('style', event.target.value)
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    aria-label={modelFieldLabels.style}
                  >
                    <option value="">{copy.allCategories}</option>
                    {modelCategoryFilterOptions.style.map((style) => (
                      <option key={style} value={style}>
                        {localizeModelCategoryTag(style, locale) || style}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <label className="grid min-w-0 gap-1 sm:w-56">
                <span className="text-xs font-semibold uppercase text-gray-500">
                  {copy.fields.category}
                </span>
                <select
                  value={filters.category}
                  onChange={(event) =>
                    updateFilter('category', event.target.value)
                  }
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  aria-label={copy.fields.category}
                >
                  <option value="">{copy.allCategories}</option>
                  {categoryFilterOptions.map((category) => (
                    <option key={category} value={category}>
                      {getTemplateCategoryLabel(category, locale)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Button
              type="submit"
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              <Search className="size-4" />
              {common.search}
            </Button>
          </>
        }
      />

      <AdminModal
        open={orderModalOpen}
        title={copy.orderModalTitle ?? 'Template order'}
        closeLabel={common.close}
        maxWidth="max-w-3xl"
        onClose={() => setOrderModalOpen(false)}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOrderModalOpen(false)}
            >
              {common.close}
            </Button>
            <Button
              type="button"
              onClick={saveTemplateOrder}
              disabled={savingOrder || loadingOrder}
            >
              {savingOrder ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {copy.saveOrder ?? common.save}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {copy.orderDescription ? (
            <p className="text-sm leading-6 text-gray-500">
              {copy.orderDescription}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={copy.fields.category}>
              {canSelectOrderCategory ? (
                <select
                  value={orderForm.category}
                  onChange={(event) => updateOrderCategory(event.target.value)}
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  {orderCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {getTemplateCategoryLabel(category, locale)}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={orderForm.category}
                  placeholder={
                    loadingModelOrderCategories ? common.loading : '男/青年/冷酷'
                  }
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  onBlur={() => loadTemplateOrder()}
                />
              )}
            </Field>
          </div>

          {orderError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {orderError}
            </div>
          ) : null}

          {loadingOrder ? (
            <div className="flex min-h-40 items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 text-sm font-semibold text-gray-400">
              <Loader2 className="size-4 animate-spin" />
              {common.loading}
            </div>
          ) : orderedTemplates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 px-3 py-8 text-center text-sm text-gray-400">
              {copy.orderEmpty ?? copy.emptyText}
            </div>
          ) : (
            <div className="max-h-[52vh] overflow-y-auto rounded-lg border border-gray-200">
              <DndContext
                sensors={orderSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleOrderDragEnd}
              >
                <SortableContext
                  items={orderedTemplates.map((template) => template.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {orderedTemplates.map((template, index) => (
                    <SortableTemplateOrderRow
                      key={template.id}
                      disabled={orderInteractionDisabled}
                      dragLabel={copy.reorder ?? 'Reorder'}
                      index={index}
                      moveDownLabel={copy.moveDown ?? 'Move down'}
                      moveUpLabel={copy.moveUp ?? 'Move up'}
                      onMove={moveOrderedTemplate}
                      template={template}
                      total={orderedTemplates.length}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(modalMode)}
        title={modalTitle}
        closeLabel={common.close}
        maxWidth="max-w-4xl"
        onClose={() => setModalMode(null)}
        footer={
          modalMode === 'view' ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalMode(null)}
              >
                {common.close}
              </Button>
              {selectedTemplate ? (
                <Button type="button" onClick={() => setModalMode('edit')}>
                  <Edit3 className="size-4" />
                  {common.edit}
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalMode(null)}
              >
                {common.cancel}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit(saveTemplate)}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {common.save}
              </Button>
            </>
          )
        }
      >
        {modalMode === 'view' && selectedTemplate ? (
          <div className="grid gap-5">
            <TemplatePreview template={selectedTemplate} />
            <AdminRecordDetails
              record={selectedTemplate as unknown as Record<string, unknown>}
              fieldLabels={{ ...copy.fields, ...copy.columns }}
              statusLabels={content.statusLabels}
              columns={[
                'id',
                'title',
                'titleTranslations',
                'type',
                'category',
                'sortOrder',
                'thumbnailAssetId',
                'previewAssetId',
                'thumbnailUrl',
                'previewUrl',
                'thumbnailMimeType',
                'previewMimeType',
                'prompt',
                'promptTranslations',
                'createdAt',
                'updatedAt',
              ]}
            />
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={copy.fields.title ?? 'Title'}>
                <Input {...register('title')} placeholder="Product launch" />
              </Field>
              {activeType !== 'model' ? (
                <Field label={copy.fields.category}>
                  {canSelectFormCategory ? (
                    <select
                      {...register('category')}
                      className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                    >
                      {!formCategoryOptions.includes(form.category) &&
                      form.category ? (
                        <option value={form.category}>
                          {getTemplateCategoryLabel(form.category, locale)}
                        </option>
                      ) : null}
                      {formCategoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {getTemplateCategoryLabel(category, locale)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      {...register('category')}
                      placeholder="product"
                    />
                  )}
                </Field>
              ) : null}
            </div>

            {activeType === 'model' ? (
              <div className="grid gap-4 md:grid-cols-3">
                <Field label={modelFieldLabels.gender}>
                  <select
                    value={modelFormParts.gender}
                    onChange={(event) =>
                      setValue(
                        'category',
                        updateModelCategoryPart(
                          form.category,
                          'gender',
                          event.target.value
                        ),
                        { shouldDirty: true }
                      )
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option value="">{modelFieldLabels.gender}</option>
                    {modelCategoryFilterOptions.gender.map((gender) => (
                      <option key={gender} value={gender}>
                        {localizeModelCategoryTag(gender, locale) || gender}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={modelFieldLabels.age}>
                  <select
                    value={modelFormParts.age}
                    onChange={(event) =>
                      setValue(
                        'category',
                        updateModelCategoryPart(
                          form.category,
                          'age',
                          event.target.value
                        ),
                        { shouldDirty: true }
                      )
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option value="">{modelFieldLabels.age}</option>
                    {modelCategoryFilterOptions.age.map((age) => (
                      <option key={age} value={age}>
                        {localizeModelCategoryTag(age, locale) || age}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={modelFieldLabels.style}>
                  <Input
                    list="admin-model-style-options"
                    value={modelFormParts.style}
                    placeholder={modelFieldLabels.style}
                    onChange={(event) =>
                      setValue(
                        'category',
                        updateModelCategoryPart(
                          form.category,
                          'style',
                          event.target.value
                        ),
                        { shouldDirty: true }
                      )
                    }
                  />
                  <datalist id="admin-model-style-options">
                    {modelFormStyleOptions.map((style) => (
                      <option
                        key={style}
                        value={style}
                        label={localizeModelCategoryTag(style, locale) || style}
                      />
                    ))}
                  </datalist>
                </Field>
              </div>
            ) : null}

            <Field label={copy.fields.titleTranslations ?? 'Title translations'}>
              <textarea
                {...register('titleTranslations')}
                rows={4}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-gray-400"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <TemplateMediaField
                accept="image/png,image/jpeg,image/webp"
                assetId={form.thumbnailAssetId}
                currentAssetLabel={copy.currentAsset}
                disabled={uploadDisabled}
                file={uploadFiles.thumbnail}
                label={copy.fields.thumbnailAssetId ?? 'Thumbnail asset ID'}
                mediaUrl={thumbnailMediaUrl}
                mimeType={thumbnailMimeType}
                onAssetIdChange={(value) =>
                  setValue('thumbnailAssetId', value, { shouldDirty: true })
                }
                onFileChange={(file) => updateUploadFile('thumbnail', file)}
                onUpload={() => uploadTemplateMedia('thumbnail')}
                uploadLabel={common.upload}
                uploading={uploadingTarget === 'thumbnail'}
              />
              <TemplateMediaField
                accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                assetId={form.previewAssetId}
                currentAssetLabel={copy.currentAsset}
                disabled={uploadDisabled}
                file={uploadFiles.preview}
                label={copy.fields.previewAssetId ?? 'Preview asset ID'}
                mediaUrl={previewMediaUrl}
                mimeType={previewMimeType}
                onAssetIdChange={(value) =>
                  setValue('previewAssetId', value, { shouldDirty: true })
                }
                onFileChange={(file) => updateUploadFile('preview', file)}
                onUpload={() => uploadTemplateMedia('preview')}
                uploadLabel={common.upload}
                uploading={uploadingTarget === 'preview'}
              />
            </div>

            <Field label={copy.fields.prompt}>
              <textarea
                {...register('prompt')}
                rows={8}
                className="min-h-48 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-gray-400"
              />
            </Field>

            <Field label={copy.fields.promptTranslations ?? 'Prompt translations'}>
              <textarea
                {...register('promptTranslations')}
                rows={6}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-gray-400"
              />
            </Field>

          </div>
        )}
      </AdminModal>
    </>
  );
}
