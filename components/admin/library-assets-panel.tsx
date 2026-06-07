'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Edit3,
  Eye,
  ImagePlus,
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
import type { AdminContent } from '@/lib/admin/content';
import { inferLibraryAssetCategoryFromFile } from '@/lib/library-assets/category-inference';
import { cn } from '@/lib/utils';

export type LibraryAssetCategory = 'image_to_video' | 'apparel_image' | 'try_on';
type ModalMode = 'create' | 'view' | 'edit';

type AdminLibraryAsset = {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  category: LibraryAssetCategory;
  sortWeight: number;
  usageCount: number;
  assetUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  storageKey: string | null;
  createdAt: string;
  updatedAt: string;
};

type LibraryAssetFormState = {
  id?: string;
  title: string;
  description: string;
  category: LibraryAssetCategory;
  sortWeight: number;
};

type PaginatedLibraryAssets = {
  list: AdminLibraryAsset[];
  total: number;
  page: number;
  pageSize: number;
};

type PresignResponse = {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
  publicUrl: string;
};

const categoryOptions: LibraryAssetCategory[] = [
  'image_to_video',
  'apparel_image',
  'try_on',
];

const emptyForm: LibraryAssetFormState = {
  title: '',
  description: '',
  category: 'apparel_image',
  sortWeight: 0,
};

function freshEmptyForm(): LibraryAssetFormState {
  return { ...emptyForm };
}

function inferCategoryFromFile(file: File): LibraryAssetCategory {
  return inferLibraryAssetCategoryFromFile(file);
}

function titleFromFileName(fileName: string) {
  const withoutExt = fileName.replace(/\.[^.]+$/, '');
  return withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function assetToForm(asset: AdminLibraryAsset): LibraryAssetFormState {
  return {
    id: asset.id,
    title: asset.title,
    description: asset.description ?? '',
    category: asset.category,
    sortWeight: asset.sortWeight,
  };
}

function buildPayload(form: LibraryAssetFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    category: form.category,
    sortWeight: form.sortWeight,
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

function isVideoAsset(input: { mimeType?: string | null; url?: string | null }) {
  return (
    input.mimeType?.startsWith('video/') ||
    input.url?.endsWith('.mp4') ||
    input.url?.endsWith('.webm')
  );
}

function MediaPreview({
  className,
  mimeType,
  url,
}: {
  className?: string;
  mimeType?: string | null;
  url?: string | null;
}) {
  if (!url) {
    return (
      <span
        className={cn(
          'flex items-center justify-center rounded-md bg-gray-100 text-gray-300',
          className
        )}
      >
        <ImagePlus className="size-5" />
      </span>
    );
  }

  if (isVideoAsset({ mimeType, url })) {
    return (
      <video
        src={url}
        muted
        playsInline
        className={cn('rounded-md bg-gray-100 object-cover', className)}
      />
    );
  }

  return (
    <img
      src={url}
      alt=""
      className={cn('rounded-md bg-gray-100 object-cover', className)}
    />
  );
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

export function LibraryAssetsPanel({
  canDelete,
  content,
}: {
  canDelete: boolean;
  content: AdminContent;
}) {
  const copy = content.libraryAssets;
  const common = content.common;
  const [data, setData] = useState<PaginatedLibraryAssets>({
    list: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [form, setForm] = useState<LibraryAssetFormState>(freshEmptyForm);
  const [selectedAsset, setSelectedAsset] =
    useState<AdminLibraryAsset | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [categoryManuallyChanged, setCategoryManuallyChanged] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<AdminTableColumn<AdminLibraryAsset>[]>(
    () => [
      {
        key: 'assetId',
        label: copy.columns.assetId,
        kind: 'id',
        width: 220,
      },
      {
        key: 'title',
        label: copy.columns.title,
        kind: 'primary',
        width: 270,
        render: (asset) => (
          <div>
            <div className="break-words text-sm font-medium text-gray-950">
              {asset.title}
            </div>
            <div className="mt-1 break-words font-mono text-xs text-gray-500">
              {copy.categoryOptions[asset.category] ?? asset.category}
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        label: copy.columns.category,
        width: 170,
        render: (asset) => (
          <span className="rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600">
            {copy.categoryOptions[asset.category] ?? asset.category}
          </span>
        ),
      },
      {
        key: 'sortWeight',
        label: copy.columns.sortWeight,
        kind: 'number',
        width: 110,
      },
      {
        key: 'usageCount',
        label: copy.columns.usageCount,
        kind: 'number',
        width: 110,
      },
      {
        key: 'updatedAt',
        label: copy.columns.updatedAt,
        width: 178,
        render: (asset) => (
          <span className="text-xs tabular-nums text-gray-500">
            {formatAdminDate(asset.updatedAt)}
          </span>
        ),
      },
    ],
    [copy]
  );

  useEffect(() => {
    if (!uploadFile) {
      setFilePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(uploadFile);
    setFilePreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [uploadFile]);

  async function loadAssets(page = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(data.pageSize),
      });
      if (appliedSearch) params.set('search', appliedSearch);
      const result = await requestJson<PaginatedLibraryAssets>(
        `/api/admin/library-assets?${params}`,
        { method: 'GET' },
        copy.errors.load
      );

      setData(result);
      if (selectedAsset?.id) {
        const refreshed = result.list.find(
          (item) => item.id === selectedAsset.id
        );
        if (refreshed) {
          setSelectedAsset(refreshed);
          setForm(assetToForm(refreshed));
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : copy.errors.load);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedSearch]);

  function openCreate() {
    setSelectedAsset(null);
    setForm(freshEmptyForm());
    setUploadFile(null);
    setCategoryManuallyChanged(false);
    setModalMode('create');
    setError(null);
  }

  function openView(asset: AdminLibraryAsset) {
    setSelectedAsset(asset);
    setForm(assetToForm(asset));
    setUploadFile(null);
    setCategoryManuallyChanged(false);
    setModalMode('view');
    setError(null);
  }

  function openEdit(asset: AdminLibraryAsset) {
    setSelectedAsset(asset);
    setForm(assetToForm(asset));
    setUploadFile(null);
    setCategoryManuallyChanged(true);
    setModalMode('edit');
    setError(null);
  }

  function updateForm<K extends keyof LibraryAssetFormState>(
    key: K,
    value: LibraryAssetFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleUploadFileChange(file: File | null) {
    setUploadFile(file);

    if (!file) return;

    const inferredCategory = inferCategoryFromFile(file);
    setForm((current) => ({
      ...current,
      title: current.title.trim() ? current.title : titleFromFileName(file.name),
      category: categoryManuallyChanged ? current.category : inferredCategory,
    }));
  }

  function handleCategoryChange(value: LibraryAssetCategory) {
    setCategoryManuallyChanged(true);
    updateForm('category', value);
  }

  async function uploadAndCreateAsset() {
    if (!uploadFile) {
      throw new Error(copy.errors.selectFile);
    }

    const presign = await requestJson<PresignResponse>(
      '/api/admin/library-assets/presign',
      {
        method: 'POST',
        body: JSON.stringify({
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

    return requestJson<AdminLibraryAsset>(
      '/api/admin/library-assets/complete',
      {
        method: 'POST',
        body: JSON.stringify({
          ...buildPayload(form),
          assetId: presign.assetId,
          storageKey: presign.storageKey,
        }),
      },
      copy.errors.completeUpload
    );
  }

  async function saveLibraryAsset() {
    setSaving(true);
    setError(null);
    try {
      if (modalMode === 'create') {
        const created = await uploadAndCreateAsset();
        setSelectedAsset(created);
        setForm(assetToForm(created));
        setUploadFile(null);
        setModalMode('view');
        await loadAssets(1);
      } else if (form.id) {
        const updated = await requestJson<AdminLibraryAsset>(
          `/api/admin/library-assets/${form.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(buildPayload(form)),
          },
          copy.errors.save
        );
        setSelectedAsset(updated);
        setForm(assetToForm(updated));
        setModalMode('view');
        await loadAssets(data.page);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : copy.errors.save);
    } finally {
      setSaving(false);
    }
  }

  async function deleteLibraryAsset(asset = selectedAsset) {
    if (!asset?.id) return;
    if (!window.confirm(copy.confirmRemove(asset.title))) return;

    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/admin/library-assets/${asset.id}`, {
        method: 'DELETE',
      }, copy.errors.delete);
      setSelectedAsset(null);
      setModalMode(null);
      setForm(freshEmptyForm());
      setCategoryManuallyChanged(false);
      await loadAssets(data.page);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : copy.errors.delete
      );
    } finally {
      setSaving(false);
    }
  }

  function resetSearch() {
    setSearch('');
    setAppliedSearch('');
  }

  function tableActions(
    asset: AdminLibraryAsset
  ): AdminTableAction<AdminLibraryAsset>[] {
    const actions: AdminTableAction<AdminLibraryAsset>[] = [
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
    ];

    if (canDelete) {
      actions.push({
        key: 'delete',
        label: common.delete,
        icon: Trash2,
        variant: 'destructive',
        onClick: deleteLibraryAsset,
      });
    }

    return actions;
  }

  const selectedKey = selectedAsset ? selectedAsset.id : null;
  const modalTitle =
    modalMode === 'create'
      ? copy.modalCreate
      : modalMode === 'edit'
        ? copy.modalEdit
        : copy.modalDetails;
  const previewUrl =
    modalMode === 'create' ? filePreview : selectedAsset?.assetUrl;
  const previewMime =
    modalMode === 'create' ? uploadFile?.type : selectedAsset?.mimeType;

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
        onRefresh={() => loadAssets(data.page)}
        onReset={resetSearch}
        onRowClick={openView}
        onSearch={() => setAppliedSearch(search.trim())}
        onSearchValueChange={setSearch}
        pagination={{
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          onPageChange: loadAssets,
        }}
        primaryAction={
          <Button
            type="button"
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            {copy.addAsset}
          </Button>
        }
        rowKey="id"
        rows={data.list}
        searchPlaceholder={copy.searchPlaceholder}
        searchValue={search}
        selectedRowKey={selectedKey}
        statusLabels={content.statusLabels}
        tableMinWidth={1360}
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
              {selectedAsset ? (
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
              <Button type="button" onClick={saveLibraryAsset} disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : modalMode === 'create' ? (
                  <Upload className="size-4" />
                ) : (
                  <Save className="size-4" />
                )}
                {modalMode === 'create' ? copy.createAction : common.save}
              </Button>
            </>
          )
        }
      >
        {modalMode === 'view' && selectedAsset ? (
          <div className="grid gap-4 md:grid-cols-[240px_1fr]">
            <MediaPreview
              url={selectedAsset.assetUrl}
              mimeType={selectedAsset.mimeType}
              className="aspect-square w-full"
            />
            <AdminRecordDetails
              record={selectedAsset as unknown as Record<string, unknown>}
              fieldLabels={{ ...copy.fields, ...copy.columns }}
              statusLabels={content.statusLabels}
              columns={[
                'assetId',
                'title',
                'category',
                'description',
                'sortWeight',
                'usageCount',
                'mimeType',
                'sizeBytes',
                'createdAt',
                'updatedAt',
              ]}
            />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
            <div className="grid gap-3 content-start">
              <MediaPreview
                url={previewUrl}
                mimeType={previewMime}
                className="aspect-square w-full"
              />
              {modalMode === 'create' ? (
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase text-gray-500">
                    {copy.uploadFile}
                  </span>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
                    onChange={(event) =>
                      handleUploadFileChange(event.target.files?.[0] ?? null)
                    }
                  />
                  <span className="text-xs text-gray-500">
                    {uploadFile
                      ? `${copy.selectedFile}: ${uploadFile.name} · ${formatFileSize(uploadFile.size)} · ${uploadFile.type || '-'}`
                      : copy.noFileSelected}
                  </span>
                </label>
              ) : selectedAsset?.assetUrl ? (
                <a
                  href={selectedAsset.assetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {copy.openAssetUrl}
                </a>
              ) : null}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={copy.fields.title}>
                  <Input
                    value={form.title}
                    onChange={(event) => updateForm('title', event.target.value)}
                  />
                </Field>
                <Field label={copy.fields.category}>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      handleCategoryChange(
                        event.target.value as LibraryAssetCategory
                      )
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {copy.categoryOptions[option] ?? option}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label={copy.fields.description}>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm('description', event.target.value)
                  }
                  rows={3}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400"
                />
              </Field>

              <details className="group">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 marker:text-gray-400">
                  {copy.advancedFields}
                </summary>
                <div className="mt-3 max-w-sm">
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
              </details>
            </div>
          </div>
        )}
      </AdminModal>
    </>
  );
}
