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
import type { AdminContent } from '@/lib/admin/content';
import { cn } from '@/lib/utils';

type LibraryAssetKind =
  | 'product_image'
  | 'model_image'
  | 'garment_image'
  | 'scene_image'
  | 'example_image'
  | 'example_video';
type LibraryAssetStatus = 'draft' | 'published' | 'archived';
type LibraryAssetUseCase = 'image_to_video' | 'apparel_image' | 'try_on';
type ModalMode = 'create' | 'view' | 'edit';

type AdminLibraryAsset = {
  id: string;
  assetId: string;
  locale: 'pt' | 'en' | 'zh';
  title: string;
  description: string | null;
  kind: LibraryAssetKind;
  status: LibraryAssetStatus;
  source: string | null;
  licenseNote: string | null;
  tags: string[];
  useCases: LibraryAssetUseCase[];
  qualityScore: number;
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
  publishedAt: string | null;
};

type LibraryAssetFormState = {
  id?: string;
  locale: 'pt' | 'en' | 'zh';
  title: string;
  description: string;
  kind: LibraryAssetKind;
  status: LibraryAssetStatus;
  source: string;
  licenseNote: string;
  tagsText: string;
  useCases: LibraryAssetUseCase[];
  qualityScore: number;
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

const kindOptions: LibraryAssetKind[] = [
  'product_image',
  'model_image',
  'garment_image',
  'scene_image',
  'example_image',
  'example_video',
];

const useCaseOptions: LibraryAssetUseCase[] = [
  'image_to_video',
  'apparel_image',
  'try_on',
];

const emptyForm: LibraryAssetFormState = {
  locale: 'pt',
  title: '',
  description: '',
  kind: 'product_image',
  status: 'draft',
  source: 'manual',
  licenseNote: '',
  tagsText: 'product-image,image-to-video',
  useCases: ['image_to_video', 'apparel_image'],
  qualityScore: 70,
  sortWeight: 0,
};

function freshEmptyForm(): LibraryAssetFormState {
  return {
    ...emptyForm,
    useCases: [...emptyForm.useCases],
  };
}

function defaultUseCases(kind: LibraryAssetKind): LibraryAssetUseCase[] {
  if (kind === 'model_image' || kind === 'garment_image') {
    return ['try_on'];
  }
  if (kind === 'example_video') {
    return ['image_to_video'];
  }
  if (kind === 'scene_image') {
    return ['image_to_video', 'apparel_image', 'try_on'];
  }
  return ['image_to_video', 'apparel_image'];
}

function defaultTags(kind: LibraryAssetKind) {
  return kind.replace(/_/g, '-');
}

function inferKindFromFile(file: File): LibraryAssetKind {
  const name = file.name.toLowerCase();

  if (file.type.startsWith('video/')) {
    return 'example_video';
  }

  if (/(model|modelo|mannequin|person|模特)/.test(name)) {
    return 'model_image';
  }

  if (/(garment|cloth|dress|shirt|pants|服装|衣服)/.test(name)) {
    return 'garment_image';
  }

  if (/(scene|background|bg|场景|背景)/.test(name)) {
    return 'scene_image';
  }

  if (/(example|demo|sample|示例)/.test(name)) {
    return 'example_image';
  }

  return 'product_image';
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
    locale: asset.locale,
    title: asset.title,
    description: asset.description ?? '',
    kind: asset.kind,
    status: asset.status,
    source: asset.source ?? '',
    licenseNote: asset.licenseNote ?? '',
    tagsText: asset.tags.join(','),
    useCases: asset.useCases,
    qualityScore: asset.qualityScore,
    sortWeight: asset.sortWeight,
  };
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function buildPayload(form: LibraryAssetFormState, canPublish: boolean) {
  return {
    locale: form.locale,
    title: form.title.trim(),
    description: form.description.trim() || null,
    kind: form.kind,
    status: canPublish ? form.status : 'draft',
    source: form.source.trim() || null,
    licenseNote: form.licenseNote.trim() || null,
    tags: parseTags(form.tagsText),
    useCases: form.useCases,
    qualityScore: form.qualityScore,
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
  canPublish,
  content,
}: {
  canPublish: boolean;
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
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<AdminTableColumn<AdminLibraryAsset>[]>(
    () => [
      {
        key: 'assetUrl',
        label: copy.columns.assetUrl,
        width: 96,
        render: (asset) => (
          <MediaPreview
            url={asset.assetUrl}
            mimeType={asset.mimeType}
            className="size-14"
          />
        ),
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
              {asset.locale} / {copy.kindOptions[asset.kind] ?? asset.kind}
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: copy.columns.status,
        width: 120,
        render: (asset) => (
          <AdminStatusBadge
            labels={content.statusLabels}
            value={asset.status}
          />
        ),
      },
      {
        key: 'useCases',
        label: copy.columns.useCases,
        width: 260,
        render: (asset) => (
          <div className="flex flex-wrap gap-1">
            {asset.useCases.map((useCase) => (
              <span
                key={useCase}
                className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-600"
              >
                {copy.useCaseOptions[useCase] ?? useCase}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'qualityScore',
        label: copy.columns.qualityScore,
        kind: 'number',
        width: 96,
      },
      {
        key: 'tags',
        label: copy.columns.tags,
        width: 260,
        render: (asset) => (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 4 ? (
              <span className="text-xs text-gray-400">
                +{asset.tags.length - 4}
              </span>
            ) : null}
          </div>
        ),
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
    [content.statusLabels, copy]
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
    setModalMode('create');
    setError(null);
  }

  function openView(asset: AdminLibraryAsset) {
    setSelectedAsset(asset);
    setForm(assetToForm(asset));
    setUploadFile(null);
    setModalMode('view');
    setError(null);
  }

  function openEdit(asset: AdminLibraryAsset) {
    setSelectedAsset(asset);
    setForm(assetToForm(asset));
    setUploadFile(null);
    setModalMode('edit');
    setError(null);
  }

  function updateForm<K extends keyof LibraryAssetFormState>(
    key: K,
    value: LibraryAssetFormState[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateKind(kind: LibraryAssetKind) {
    setForm((current) => ({
      ...current,
      kind,
      tagsText:
        !current.tagsText.trim() ||
        current.tagsText === defaultTags(current.kind) ||
        current.tagsText === emptyForm.tagsText
          ? defaultTags(kind)
          : current.tagsText,
      useCases: defaultUseCases(kind),
    }));
  }

  function handleUploadFileChange(file: File | null) {
    setUploadFile(file);

    if (!file) return;

    const inferredKind = inferKindFromFile(file);
    setForm((current) => ({
      ...current,
      title: current.title.trim() ? current.title : titleFromFileName(file.name),
      kind: inferredKind,
      tagsText:
        current.tagsText === emptyForm.tagsText || !current.tagsText.trim()
          ? defaultTags(inferredKind)
          : current.tagsText,
      useCases:
        current.useCases.length === 0 ||
        current.useCases.join(',') === emptyForm.useCases.join(',')
          ? defaultUseCases(inferredKind)
          : current.useCases,
    }));
  }

  function toggleUseCase(useCase: LibraryAssetUseCase) {
    setForm((current) => {
      const next = new Set(current.useCases);
      if (next.has(useCase) && next.size > 1) {
        next.delete(useCase);
      } else {
        next.add(useCase);
      }

      return { ...current, useCases: Array.from(next) };
    });
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
          ...buildPayload(form, canPublish),
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
            body: JSON.stringify(buildPayload(form, canPublish)),
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

  async function runStatusAction(action: 'publish' | 'archive') {
    if (!selectedAsset?.id) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await requestJson<AdminLibraryAsset>(
        `/api/admin/library-assets/${selectedAsset.id}`,
        {
          method: 'POST',
          body: JSON.stringify({ action }),
        },
        copy.errors[action]
      );
      setSelectedAsset(updated);
      setForm(assetToForm(updated));
      setModalMode('view');
      await loadAssets(data.page);
    } catch (statusError) {
      setError(
        statusError instanceof Error ? statusError.message : copy.errors[action]
      );
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

    if (canPublish) {
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
                'title',
                'locale',
                'kind',
                'status',
                'description',
                'tags',
                'useCases',
                'qualityScore',
                'usageCount',
                'source',
                'licenseNote',
                'mimeType',
                'sizeBytes',
                'createdAt',
                'updatedAt',
                'publishedAt',
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
                <Field label={copy.fields.locale}>
                  <select
                    value={form.locale}
                    onChange={(event) =>
                      updateForm(
                        'locale',
                        event.target.value as LibraryAssetFormState['locale']
                      )
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  >
                    <option value="pt">pt</option>
                    <option value="en">en</option>
                    <option value="zh">zh</option>
                  </select>
                </Field>
                <Field label={copy.fields.kind}>
                  <select
                    value={form.kind}
                    onChange={(event) =>
                      updateKind(event.target.value as LibraryAssetKind)
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  >
                    {kindOptions.map((option) => (
                      <option key={option} value={option}>
                        {copy.kindOptions[option] ?? option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={copy.fields.status}>
                  <select
                    value={canPublish ? form.status : 'draft'}
                    disabled={!canPublish}
                    onChange={(event) =>
                      updateForm(
                        'status',
                        event.target.value as LibraryAssetStatus
                      )
                    }
                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="draft">{content.statusLabels.draft}</option>
                    <option value="published">
                      {content.statusLabels.published}
                    </option>
                    <option value="archived">
                      {content.statusLabels.archived}
                    </option>
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

              <div>
                <Label className="mb-2 block text-xs font-semibold uppercase text-gray-500">
                  {copy.useCases}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {useCaseOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleUseCase(option)}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm font-medium transition',
                        form.useCases.includes(option)
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                      )}
                    >
                      {copy.useCaseOptions[option] ?? option}
                    </button>
                  ))}
                </div>
              </div>

              <Field label={copy.fields.tags}>
                <Input
                  value={form.tagsText}
                  onChange={(event) =>
                    updateForm('tagsText', event.target.value)
                  }
                  placeholder={copy.placeholders.tags}
                />
              </Field>

              <details className="group">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 marker:text-gray-400">
                  {copy.advancedFields}
                </summary>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <Field label={copy.fields.qualityScore}>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.qualityScore}
                      onChange={(event) =>
                        updateForm('qualityScore', Number(event.target.value))
                      }
                    />
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
                  <Field label={copy.fields.source}>
                    <Input
                      value={form.source}
                      onChange={(event) =>
                        updateForm('source', event.target.value)
                      }
                      placeholder={copy.placeholders.source}
                    />
                  </Field>
                  <Field label={copy.fields.licenseNote}>
                    <Input
                      value={form.licenseNote}
                      onChange={(event) =>
                        updateForm('licenseNote', event.target.value)
                      }
                      placeholder={copy.placeholders.licenseNote}
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
