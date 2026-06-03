'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Archive,
  Edit3,
  Eye,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AdminManagementTable,
  AdminModal,
  AdminRecordDetails,
  AdminStatusBadge,
  formatAdminDate,
  type AdminTableAction,
  type AdminTableColumn,
} from '@/components/admin/admin-management-table';
import type { AdminContent, AdminLocale } from '@/lib/admin/content';
import {
  templateTagGroups,
  templateTagOptions,
  type TemplateCatalogItem,
  type TemplateType,
} from '@/lib/templates/catalog';
import { cn } from '@/lib/utils';

type AdminTemplate = TemplateCatalogItem & {
  status: 'draft' | 'published' | 'archived';
  negativePrompt: string | null;
  promptJson: Record<string, unknown>;
  defaultInputsJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  sortWeight: number;
  usageCount: number;
};

type TemplateFormState = {
  id?: string;
  slug: string;
  locale: 'pt' | 'en' | 'zh';
  title: string;
  description: string;
  type: TemplateType;
  hook: string;
  cta: string;
  prompt: string;
  negativePrompt: string;
  promptJson: string;
  defaultInputsJson: string;
  costCredits: number;
  aspectRatios: Array<'9:16' | '1:1' | '16:9'>;
  durationSeconds: 5 | 8 | 10;
  sortWeight: number;
  tagSlugs: string[];
};

type UploadRole = 'thumbnail' | 'preview' | 'source' | 'example';
type ModalMode = 'create' | 'view' | 'edit';

type PaginatedTemplates = {
  list: AdminTemplate[];
  total: number;
  page: number;
  pageSize: number;
};

const emptyForm: TemplateFormState = {
  slug: '',
  locale: 'pt',
  title: '',
  description: '',
  type: 'image',
  hook: '',
  cta: '',
  prompt: '',
  negativePrompt: '',
  promptJson: '{}',
  defaultInputsJson: '{}',
  costCredits: 1,
  aspectRatios: ['9:16'],
  durationSeconds: 5,
  sortWeight: 0,
  tagSlugs: ['image', 'low-cost', 'ratio-9-16'],
};

function freshEmptyForm(): TemplateFormState {
  return {
    ...emptyForm,
    aspectRatios: [...emptyForm.aspectRatios],
    tagSlugs: [...emptyForm.tagSlugs],
  };
}

function templateToForm(template: AdminTemplate): TemplateFormState {
  return {
    id: template.id,
    slug: template.slug,
    locale: template.locale,
    title: template.title,
    description: template.description,
    type: template.type,
    hook: template.hook,
    cta: template.cta ?? '',
    prompt: template.prompt,
    negativePrompt: template.negativePrompt ?? '',
    promptJson: JSON.stringify(template.promptJson ?? {}, null, 2),
    defaultInputsJson: JSON.stringify(template.defaultInputsJson ?? {}, null, 2),
    costCredits: template.costCredits,
    aspectRatios: template.aspectRatios as Array<'9:16' | '1:1' | '16:9'>,
    durationSeconds: (template.durationSeconds ?? 5) as 5 | 8 | 10,
    sortWeight: template.sortWeight,
    tagSlugs: template.tags,
  };
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
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

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase text-gray-500">
        {label}
      </span>
      {children}
    </label>
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
  const [uploadRole, setUploadRole] = useState<UploadRole>('preview');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<AdminTableColumn<AdminTemplate>[]>(
    () => [
      {
        key: 'title',
        label: copy.columns.title,
        kind: 'primary',
        width: 280,
        render: (template) => (
          <div>
            <div className="break-words text-sm font-medium text-gray-950">
              {template.title}
            </div>
            <div className="mt-1 break-words font-mono text-xs text-gray-500">
              {template.locale} / {template.slug}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: copy.columns.status,
        width: 120,
        render: (template) => (
          <AdminStatusBadge
            labels={content.statusLabels}
            value={template.status}
          />
        ),
      },
      {
        key: 'type',
        label: copy.columns.type,
        kind: 'status',
        width: 150,
        render: (template) => copy.typeOptions[template.type] ?? template.type,
      },
      {
        key: 'costCredits',
        label: copy.columns.costCredits,
        kind: 'number',
        width: 96,
      },
      {
        key: 'durationSeconds',
        label: copy.columns.durationSeconds,
        width: 104,
        render: (template) =>
          template.durationSeconds ? `${template.durationSeconds}s` : '-',
      },
      {
        key: 'tags',
        label: copy.columns.tags,
        width: 280,
        render: (template) => (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 4 ? (
              <span className="text-xs text-gray-400">
                +{template.tags.length - 4}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: 'usageCount',
        label: copy.columns.usageCount,
        kind: 'number',
        width: 90,
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
    [content.statusLabels, copy]
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
      setError(loadError instanceof Error ? loadError.message : copy.errors.load);
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

  function toggleTag(slug: string) {
    setForm((current) => {
      const next = new Set(current.tagSlugs);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }

      return { ...current, tagSlugs: Array.from(next) };
    });
  }

  function toggleRatio(ratio: '9:16' | '1:1' | '16:9') {
    setForm((current) => {
      const next = new Set(current.aspectRatios);
      if (next.has(ratio) && next.size > 1) {
        next.delete(ratio);
      } else {
        next.add(ratio);
      }

      return {
        ...current,
        aspectRatios: Array.from(next) as Array<'9:16' | '1:1' | '16:9'>,
      };
    });
  }

  async function saveTemplate() {
    setSaving(true);
    setError(null);
    try {
      let promptJson: Record<string, unknown>;
      let defaultInputsJson: Record<string, unknown>;

      try {
        promptJson = JSON.parse(form.promptJson || '{}') as Record<
          string,
          unknown
        >;
        defaultInputsJson = JSON.parse(
          form.defaultInputsJson || '{}'
        ) as Record<string, unknown>;
      } catch {
        throw new Error(copy.invalidJson);
      }

      const payload = {
        ...form,
        promptJson,
        defaultInputsJson,
        durationSeconds: form.type === 'image' ? null : form.durationSeconds,
      };
      const url = form.id
        ? `/api/admin/templates/${form.id}`
        : '/api/admin/templates';
      const method = form.id ? 'PUT' : 'POST';
      await requestJson(url, {
        method,
        body: JSON.stringify(payload),
      }, copy.errors.save);
      await loadTemplates(form.id ? data.page : 1);
      if (!form.id) {
        setModalMode(null);
        setForm(freshEmptyForm());
      } else {
        setModalMode('view');
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.errors.save);
    } finally {
      setSaving(false);
    }
  }

  async function runStatusAction(action: 'publish' | 'archive') {
    if (!selectedTemplate?.id) return;
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/admin/templates/${selectedTemplate.id}`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }, copy.errors[action]);
      await loadTemplates(data.page);
      setModalMode('view');
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : copy.errors[action]
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(template = selectedTemplate) {
    if (!template?.id) return;
    if (!window.confirm(copy.confirmDelete(template.slug))) return;

    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/admin/templates/${template.id}`, {
        method: 'DELETE',
      }, copy.errors.delete);
      setSelectedTemplate(null);
      setModalMode(null);
      setForm(freshEmptyForm());
      await loadTemplates(data.page);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : copy.errors.delete);
    } finally {
      setSaving(false);
    }
  }

  async function uploadTemplateAsset() {
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
      }>('/api/admin/template-assets/presign', {
        method: 'POST',
        body: JSON.stringify({
          templateId: form.id,
          fileName: uploadFile.name,
          mimeType: uploadFile.type,
          sizeBytes: uploadFile.size,
        }),
      }, copy.errors.prepareUpload);

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': uploadFile.type },
        body: uploadFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(copy.errors.upload);
      }

      await requestJson('/api/admin/template-assets/complete', {
        method: 'POST',
        body: JSON.stringify({
          templateId: form.id,
          assetId: presign.assetId,
          storageKey: presign.storageKey,
          role: uploadRole,
        }),
      }, copy.errors.completeUpload);

      setUploadFile(null);
      await loadTemplates(data.page);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : copy.errors.upload);
    } finally {
      setUploading(false);
    }
  }

  function resetSearch() {
    setSearch('');
    setAppliedSearch('');
  }

  function tableActions(template: AdminTemplate): AdminTableAction<AdminTemplate>[] {
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

  const selectedKey = selectedTemplate
    ? String(selectedTemplate.id ?? selectedTemplate.slug)
    : null;

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
          <Button
            type="button"
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            {copy.create}
          </Button>
        }
        rowKey={(template, index) =>
          String(template.id ?? template.slug ?? index)
        }
        rows={data.list}
        searchPlaceholder={copy.searchPlaceholder}
        searchValue={search}
        selectedRowKey={selectedKey}
        statusLabels={content.statusLabels}
        tableMinWidth={1320}
        title={copy.title}
      />

      <AdminModal
        open={Boolean(modalMode)}
        title={modalTitle}
        closeLabel={common.close}
        maxWidth="max-w-5xl"
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
              {canPublish && form.id ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => runStatusAction('publish')}
                    disabled={saving}
                    title={common.publish}
                  >
                    <Send className="size-4" />
                    {common.publish}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => runStatusAction('archive')}
                    disabled={saving}
                    title={common.archive}
                  >
                    <Archive className="size-4" />
                    {common.archive}
                  </Button>
                </>
              ) : null}
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
          <AdminRecordDetails
            record={selectedTemplate as unknown as Record<string, unknown>}
            fieldLabels={{ ...copy.fields, ...copy.columns }}
            statusLabels={content.statusLabels}
            columns={[
              'title',
              'slug',
              'locale',
              'status',
              'type',
              'hook',
              'cta',
              'description',
              'prompt',
              'negativePrompt',
              'promptJson',
              'defaultInputsJson',
              'tags',
              'costCredits',
              'aspectRatios',
              'durationSeconds',
              'usageCount',
              'createdAt',
              'updatedAt',
              'publishedAt',
            ]}
          />
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={copy.fields.title}>
                <Input
                  value={form.title}
                  onChange={(event) => updateForm('title', event.target.value)}
                />
              </Field>
              <Field label={copy.fields.slug}>
                <Input
                  value={form.slug}
                  onChange={(event) => updateForm('slug', event.target.value)}
                  placeholder={copy.placeholders.slug}
                />
              </Field>
              <Field label={copy.fields.locale}>
                <select
                  value={form.locale}
                  onChange={(event) =>
                    updateForm(
                      'locale',
                      event.target.value as TemplateFormState['locale']
                    )
                  }
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="pt">pt</option>
                  <option value="en">en</option>
                  <option value="zh">zh</option>
                </select>
              </Field>
              <Field label={copy.fields.type}>
                <select
                  value={form.type}
                  onChange={(event) =>
                    updateForm('type', event.target.value as TemplateType)
                  }
                  className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="image">{copy.typeOptions.image}</option>
                  <option value="image_to_video">
                    {copy.typeOptions.image_to_video}
                  </option>
                  <option value="video">{copy.typeOptions.video}</option>
                </select>
              </Field>
              <Field label={copy.fields.hook}>
                <Input
                  value={form.hook}
                  onChange={(event) => updateForm('hook', event.target.value)}
                />
              </Field>
              <Field label={copy.fields.cta}>
                <Input
                  value={form.cta}
                  onChange={(event) => updateForm('cta', event.target.value)}
                />
              </Field>
            </div>

            <Field label={copy.fields.description}>
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                rows={3}
                className="min-h-24 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </Field>
            <Field label={copy.fields.prompt}>
              <textarea
                value={form.prompt}
                onChange={(event) => updateForm('prompt', event.target.value)}
                rows={5}
                className="min-h-36 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={copy.fields.negativePrompt}>
                <textarea
                  value={form.negativePrompt}
                  onChange={(event) =>
                    updateForm('negativePrompt', event.target.value)
                  }
                  rows={4}
                  className="min-h-28 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
                />
              </Field>
              <Field label={copy.fields.promptJson}>
                <textarea
                  value={form.promptJson}
                  onChange={(event) =>
                    updateForm('promptJson', event.target.value)
                  }
                  rows={4}
                  className="min-h-28 rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-gray-400"
                />
              </Field>
              <Field label={copy.fields.defaultInputsJson}>
                <textarea
                  value={form.defaultInputsJson}
                  onChange={(event) =>
                    updateForm('defaultInputsJson', event.target.value)
                  }
                  rows={4}
                  className="min-h-28 rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-gray-400"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label={copy.fields.costCredits}>
                  <Input
                    type="number"
                    min={0}
                    value={form.costCredits}
                    onChange={(event) =>
                      updateForm('costCredits', Number(event.target.value))
                    }
                  />
                </Field>
                <Field label={copy.fields.durationSeconds}>
                  <select
                    value={form.durationSeconds}
                    disabled={form.type === 'image'}
                    onChange={(event) =>
                      updateForm(
                        'durationSeconds',
                        Number(event.target.value) as 5 | 8 | 10
                      )
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm disabled:opacity-50"
                  >
                    <option value={5}>5s</option>
                    <option value={8}>8s</option>
                    <option value={10}>10s</option>
                  </select>
                </Field>
                <Field label={copy.fields.sortWeight}>
                  <Input
                    type="number"
                    value={form.sortWeight}
                    onChange={(event) =>
                      updateForm('sortWeight', Number(event.target.value))
                    }
                  />
                </Field>
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                {copy.fields.aspectRatios}
              </Label>
              <div className="flex flex-wrap gap-2">
                {(['9:16', '1:1', '16:9'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => toggleRatio(ratio)}
                    className={cn(
                      'h-9 rounded-md border px-3 text-sm font-medium',
                      form.aspectRatios.includes(ratio)
                        ? 'border-gray-950 bg-gray-950 text-white'
                        : 'border-gray-200 bg-white text-gray-700'
                    )}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4 text-sm font-semibold text-gray-950">
                {copy.tags}
              </div>
              <div className="grid gap-4">
                {templateTagGroups.map(({ group, labels }) => (
                  <div key={group}>
                    <div className="mb-2 text-xs font-semibold uppercase text-gray-500">
                      {labels[locale] ?? labels.en}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {templateTagOptions
                        .filter((tag) => tag.group === group)
                        .map((tag) => (
                          <button
                            key={tag.slug}
                            type="button"
                            onClick={() => toggleTag(tag.slug)}
                            className={cn(
                              'h-8 rounded-md border px-2.5 text-xs font-medium',
                              form.tagSlugs.includes(tag.slug)
                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                : 'border-gray-200 bg-white text-gray-700'
                            )}
                          >
                            {tag.labels[locale] ?? tag.labels.pt}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-950">
                  {copy.uploadAsset}
                </div>
                {selectedTemplate?.asset ? (
                  <a
                    href={selectedTemplate.asset}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-orange-700"
                  >
                    {copy.currentAsset}
                  </a>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
                <select
                  value={uploadRole}
                  onChange={(event) =>
                    setUploadRole(event.target.value as UploadRole)
                  }
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                >
                  <option value="preview">
                    {copy.uploadRoleOptions.preview}
                  </option>
                  <option value="thumbnail">
                    {copy.uploadRoleOptions.thumbnail}
                  </option>
                  <option value="source">{copy.uploadRoleOptions.source}</option>
                  <option value="example">
                    {copy.uploadRoleOptions.example}
                  </option>
                </select>
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
                  onClick={uploadTemplateAsset}
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
