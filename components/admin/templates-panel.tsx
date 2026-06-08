'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Eye,
  ImagePlus,
  ListOrdered,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
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
import {
  getTemplateCategoryLabel,
  templateTypeLabels,
  type TemplateCatalogDetailItem,
  type TemplateType,
} from '@/lib/templates/catalog';
import { getTemplateCategoriesForType } from '@/lib/templates/category-config';

type AdminTemplate = TemplateCatalogDetailItem & {
  titleTranslations: Record<string, string>;
  promptTranslations: Record<string, string>;
  thumbnailAssetId: string;
  previewAssetId: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

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
  list: AdminTemplate[];
  total: number;
  page: number;
  pageSize: number;
};

type TemplateOrderResponse = {
  type: TemplateType;
  category: string;
  list: AdminTemplate[];
  total: number;
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

const defaultOrderType: TemplateType = 'image_to_video';

function defaultCategoryForType(type: TemplateType) {
  return getTemplateCategoriesForType(type)[0] ?? 'common';
}

function freshEmptyForm(): TemplateFormState {
  return { ...emptyForm };
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
    if (!['pt', 'en', 'zh'].includes(key)) {
      throw new Error(`${label} only supports pt, en, and zh keys.`);
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

function isLikelyVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
}

function TemplatePreview({ template }: { template: AdminTemplate }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        <img
          src={template.thumbnailUrl}
          alt=""
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {isLikelyVideoUrl(template.previewUrl) ? (
          <video
            src={template.previewUrl}
            className="aspect-[4/3] w-full object-cover"
            controls
            muted
            playsInline
          />
        ) : (
          <img
            src={template.previewUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}

export function TemplatesPanel({
  canPublish,
  content,
  locale,
}: {
  canPublish: boolean;
  content: AdminContent;
  locale: AdminLocale;
}) {
  const copy = content.templates;
  const common = content.common;
  const [data, setData] = useState<PaginatedTemplates>({
    list: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [form, setForm] = useState<TemplateFormState>(freshEmptyForm);
  const [selectedTemplate, setSelectedTemplate] =
    useState<AdminTemplate | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<TemplateOrderFormState>({
    type: defaultOrderType,
    category: defaultCategoryForType(defaultOrderType),
  });
  const [orderedTemplates, setOrderedTemplates] = useState<AdminTemplate[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const typeLabel = (type: TemplateType) =>
    templateTypeLabels[type]?.[locale] ?? type;

  const orderCategoryOptions = getTemplateCategoriesForType(orderForm.type);

  const columns = useMemo<AdminTableColumn<AdminTemplate>[]>(
    () => [
      {
        key: 'id',
        label: copy.columns.id ?? 'ID',
        kind: 'primary',
        width: 260,
        render: (template) => (
          <div>
            <div className="break-words font-mono text-xs text-gray-900">
              {template.id}
            </div>
            <div className="mt-1 text-xs font-medium text-gray-500">
              {typeLabel(template.type)}
            </div>
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
        kind: 'status',
        width: 140,
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
    [copy, locale]
  );

  async function loadTemplates(page = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(data.pageSize),
      });
      if (appliedSearch) params.set('search', appliedSearch);
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
          setForm(templateToForm(refreshed));
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
  }, [appliedSearch]);

  function openCreate() {
    setSelectedTemplate(null);
    setForm(freshEmptyForm());
    setUploadFile(null);
    setModalMode('create');
    setError(null);
  }

  function openView(template: AdminTemplate) {
    setSelectedTemplate(template);
    setForm(templateToForm(template));
    setUploadFile(null);
    setModalMode('view');
    setError(null);
  }

  function openEdit(template: AdminTemplate) {
    setSelectedTemplate(template);
    setForm(templateToForm(template));
    setUploadFile(null);
    setModalMode('edit');
    setError(null);
  }

  function updateForm<K extends keyof TemplateFormState>(
    key: K,
    value: TemplateFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveTemplate() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        titleTranslations: parseTranslationsJson(
          form.titleTranslations,
          copy.fields.titleTranslations ?? 'Title translations'
        ),
        category: form.category.trim().toLowerCase(),
        promptTranslations: parseTranslationsJson(
          form.promptTranslations,
          copy.fields.promptTranslations ?? 'Prompt translations'
        ),
      };
      const url = form.id
        ? `/api/admin/templates/${form.id}`
        : '/api/admin/templates';
      const method = form.id ? 'PUT' : 'POST';
      await requestJson(
        url,
        {
          method,
          body: JSON.stringify(payload),
        },
        copy.errors.save
      );
      await loadTemplates(form.id ? data.page : 1);
      if (!form.id) {
        setModalMode(null);
        setForm(freshEmptyForm());
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
      setForm(freshEmptyForm());
      await loadTemplates(data.page);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : copy.errors.delete
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadTemplatePreview() {
    if (!form.id || !uploadFile) {
      setError(copy.selectSavedTemplate);
      return;
    }

    setUploading(true);
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
            templateId: form.id,
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

      await requestJson(
        '/api/admin/template-preview/complete',
        {
          method: 'POST',
          body: JSON.stringify({
            templateId: form.id,
            assetId: presign.assetId,
            storageKey: presign.storageKey,
          }),
        },
        copy.errors.completeUpload
      );

      setUploadFile(null);
      await loadTemplates(data.page);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : copy.errors.upload
      );
    } finally {
      setUploading(false);
    }
  }

  async function loadTemplateOrder(nextForm = orderForm) {
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
    void loadTemplateOrder();
  }

  function updateOrderType(type: TemplateType) {
    const nextForm = {
      type,
      category: defaultCategoryForType(type),
    };
    setOrderForm(nextForm);
    void loadTemplateOrder(nextForm);
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
    setSearch('');
    setAppliedSearch('');
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
        onSearch={() => setAppliedSearch(search.trim())}
        onSearchValueChange={setSearch}
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
        searchPlaceholder={copy.searchPlaceholder}
        searchValue={search}
        selectedRowKey={selectedKey}
        statusLabels={content.statusLabels}
        tableMinWidth={1000}
        title={copy.title}
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
            <Field label={copy.fields.type ?? 'Type'}>
              <select
                value={orderForm.type}
                onChange={(event) =>
                  updateOrderType(event.target.value as TemplateType)
                }
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="image_to_video">
                  {templateTypeLabels.image_to_video[locale]}
                </option>
                <option value="image_to_image">
                  {templateTypeLabels.image_to_image[locale]}
                </option>
                <option value="try_on">
                  {templateTypeLabels.try_on[locale]}
                </option>
              </select>
            </Field>
            <Field label={copy.fields.category}>
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
              {orderedTemplates.map((template, index) => (
                <div
                  key={template.id}
                  className="flex items-center gap-3 border-b border-gray-100 px-3 py-3 last:border-b-0"
                >
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
                      disabled={index === 0}
                      onClick={() => moveOrderedTemplate(index, -1)}
                      aria-label={copy.moveUp ?? 'Move up'}
                      title={copy.moveUp ?? 'Move up'}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled={index === orderedTemplates.length - 1}
                      onClick={() => moveOrderedTemplate(index, 1)}
                      aria-label={copy.moveDown ?? 'Move down'}
                      title={copy.moveDown ?? 'Move down'}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
              <Button type="button" onClick={saveTemplate} disabled={saving}>
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
                <Input
                  value={form.title}
                  placeholder="Product launch"
                  onChange={(event) =>
                    updateForm('title', event.target.value)
                  }
                />
              </Field>
              <Field label={copy.fields.type ?? 'Type'}>
                <select
                  value={form.type}
                  onChange={(event) =>
                    updateForm('type', event.target.value as TemplateType)
                  }
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="image_to_video">
                    {templateTypeLabels.image_to_video[locale]}
                  </option>
                  <option value="image_to_image">
                    {templateTypeLabels.image_to_image[locale]}
                  </option>
                  <option value="try_on">
                    {templateTypeLabels.try_on[locale]}
                  </option>
                </select>
              </Field>
              <Field label={copy.fields.category}>
                <Input
                  value={form.category}
                  placeholder="product"
                  onChange={(event) =>
                    updateForm('category', event.target.value)
                  }
                />
              </Field>
            </div>

            <Field label={copy.fields.titleTranslations ?? 'Title translations'}>
              <textarea
                value={form.titleTranslations}
                onChange={(event) =>
                  updateForm('titleTranslations', event.target.value)
                }
                rows={4}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-gray-400"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label={copy.fields.thumbnailAssetId ?? 'Thumbnail asset ID'}>
                <Input
                  value={form.thumbnailAssetId}
                  onChange={(event) =>
                    updateForm('thumbnailAssetId', event.target.value)
                  }
                />
              </Field>
              <Field label={copy.fields.previewAssetId ?? 'Preview asset ID'}>
                <Input
                  value={form.previewAssetId}
                  onChange={(event) =>
                    updateForm('previewAssetId', event.target.value)
                  }
                />
              </Field>
            </div>

            <Field label={copy.fields.prompt}>
              <textarea
                value={form.prompt}
                onChange={(event) => updateForm('prompt', event.target.value)}
                rows={8}
                className="min-h-48 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-gray-400"
              />
            </Field>

            <Field label={copy.fields.promptTranslations ?? 'Prompt translations'}>
              <textarea
                value={form.promptTranslations}
                onChange={(event) =>
                  updateForm('promptTranslations', event.target.value)
                }
                rows={6}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus:border-gray-400"
              />
            </Field>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-950">
                  {copy.uploadAsset}
                </div>
                {selectedTemplate?.previewUrl ? (
                  <a
                    href={selectedTemplate.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-orange-700"
                  >
                    {copy.currentAsset}
                  </a>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                  onChange={(event) =>
                    setUploadFile(event.target.files?.[0] ?? null)
                  }
                  disabled={!form.id || uploading}
                />
                <Button
                  type="button"
                  onClick={uploadTemplatePreview}
                  disabled={!form.id || !uploadFile || uploading}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  {common.upload}
                </Button>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </>
  );
}
