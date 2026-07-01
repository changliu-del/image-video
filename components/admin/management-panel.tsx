'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { Edit3, Eye, Loader2, RotateCcw, Search, Trash2 } from 'lucide-react';
import { AdminDateInput } from '@/components/admin/admin-date-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AdminMediaPreview,
  AdminManagementTable,
  AdminModal,
  AdminRecordDetails,
  formatAdminLabel,
  formatAdminValue,
  type AdminTableAction,
  type AdminTableColumn,
} from '@/components/admin/admin-management-table';
import type { AdminCommonCopy } from '@/lib/admin/content';

export type AdminTableKey =
  | 'users'
  | 'user-media'
  | 'generation-jobs'
  | 'credit-ledger';

type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'json';
type SelectOption = string | { value: string; label: string };
type AdminMediaColumnKey = 'preview' | 'inputPreview' | 'finalPreview';

export type AdminField = {
  key: string;
  label: string;
  type?: FieldType;
  options?: SelectOption[];
  readOnly?: boolean;
};

export type AdminFilterField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'date';
};

export type AdminTableConfig = {
  key: AdminTableKey;
  title: string;
  description: string;
  searchPlaceholder?: string;
  idField: string;
  columns: string[];
  detailColumns?: string[];
  optionalColumns?: string[];
  columnLabels?: Record<string, string>;
  columnWidths?: Record<string, number>;
  editableFields: AdminField[];
  deleteEnabled?: boolean;
  editEnabled?: boolean;
  filterFields?: AdminFilterField[];
  icon?: ComponentType<{ className?: string }>;
  modalLayout?: 'grid' | 'stacked';
  tableMinWidth?: number;
};

type PaginatedResp = {
  list: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
};

type ModalMode = 'view' | 'edit';

function normalizeInitialValue(value: unknown, field: AdminField) {
  if (field.type === 'json') {
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value == null ? '{}' : JSON.stringify(value, null, 2);
  }
  return value == null ? '' : String(value);
}

function denormalizeValue(value: string, field: AdminField) {
  if (field.type === 'number') {
    return value.trim() ? Number(value) : null;
  }
  if (field.type === 'json') {
    return value.trim() ? JSON.parse(value) : {};
  }
  return value.trim();
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

function DetailField({
  field,
  labels,
  value,
  onChange,
}: {
  field: AdminField;
  labels: AdminCommonCopy;
  value: string;
  onChange: (value: string) => void;
}) {
  const disabled = field.readOnly;
  const baseClass =
    'w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500';

  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase text-gray-500">
        {field.label}
      </span>
      {field.type === 'textarea' || field.type === 'json' ? (
        <textarea
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          rows={field.type === 'json' ? 8 : 4}
          className={baseClass}
        />
      ) : field.type === 'select' ? (
        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="">{labels.select}</option>
          {(field.options ?? []).map((option) => (
            <option
              key={typeof option === 'string' ? option : option.value}
              value={typeof option === 'string' ? option : option.value}
            >
              {typeof option === 'string' ? option : option.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          value={value}
          type={field.type === 'number' ? 'number' : 'text'}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function initialFilters(config: AdminTableConfig) {
  return Object.fromEntries(
    (config.filterFields ?? []).map((field) => [field.key, ''])
  ) as Record<string, string>;
}

function isMediaColumnKey(key: string): key is AdminMediaColumnKey {
  return key === 'preview' || key === 'inputPreview' || key === 'finalPreview';
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function mediaSourceForColumn(
  row: Record<string, unknown>,
  key: AdminMediaColumnKey
) {
  if (key === 'inputPreview') {
    const url = firstString(
      row.inputPreviewUrl,
      row.inputImageUrl,
      row.inputVideoUrl
    );
    return {
      url,
      mimeType: firstString(row.inputPreviewMimeType, row.inputMimeType),
      mediaKind:
        row.inputMediaKind ??
        (firstString(row.inputVideoUrl) ? 'video' : undefined) ??
        (firstString(row.inputImageUrl) ? 'image' : undefined),
    };
  }

  if (key === 'finalPreview') {
    const url = firstString(
      row.finalPreviewUrl,
      row.finalVideoUrl,
      row.finalImageUrl,
      row.outputPreviewUrl,
      row.outputVideoUrl,
      row.outputImageUrl
    );
    return {
      url,
      mimeType: firstString(
        row.finalPreviewMimeType,
        row.finalMimeType,
        row.outputMimeType
      ),
      mediaKind:
        row.finalMediaKind ??
        row.outputMediaKind ??
        (firstString(row.finalVideoUrl, row.outputVideoUrl)
          ? 'video'
          : undefined) ??
        (firstString(row.finalImageUrl, row.outputImageUrl)
          ? 'image'
          : undefined),
    };
  }

  return {
    url: row.previewUrl,
    mimeType: row.previewMimeType,
    mediaKind: row.mediaKind,
  };
}

function hasColumnValue(row: Record<string, unknown>, key: string) {
  if (isMediaColumnKey(key)) {
    return Boolean(mediaSourceForColumn(row, key).url);
  }

  return key in row;
}

export function ManagementPanel({
  canDelete,
  canEdit,
  config,
  labels,
  statusLabels,
}: {
  canDelete: boolean;
  canEdit: boolean;
  config: AdminTableConfig;
  labels: AdminCommonCopy;
  statusLabels: Record<string, string>;
}) {
  const [data, setData] = useState<PaginatedResp>({
    list: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    initialFilters(config)
  );
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>(
    () => initialFilters(config)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(
    null
  );
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  const endpoint = `/api/admin/${config.key}`;

  const fetcher = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(data.pageSize),
        });
        if (appliedSearch) params.set('search', appliedSearch);
        for (const [key, value] of Object.entries(appliedFilters)) {
          if (value.trim()) params.set(key, value.trim());
        }
        const response = await fetch(`${endpoint}?${params}`);
        if (!response.ok) {
          throw new Error(await readError(response, labels.loadFailed));
        }
        const json = (await response.json()) as PaginatedResp;
        setData(json);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : labels.loadFailed);
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters, appliedSearch, data.pageSize, endpoint, labels.loadFailed]
  );

  useEffect(() => {
    fetcher(1);
  }, [fetcher]);

  const columns = useMemo(() => {
    const sourceColumns = config.columns.length
      ? config.columns.filter(
          (key) =>
            !config.optionalColumns?.includes(key) ||
            data.list.some((row) => hasColumnValue(row, key))
        )
      : data.list[0]
        ? Object.keys(data.list[0]).filter(
            (key) =>
              key !== 'passwordHash' &&
              key !== 'metadataJson' &&
              key !== 'requestJson' &&
              key !== 'responseJson'
          )
        : [];

    return sourceColumns.map((key): AdminTableColumn => {
      if (isMediaColumnKey(key)) {
        return {
          key,
          label: config.columnLabels?.[key] ?? formatAdminLabel(key),
          width: config.columnWidths?.[key] ?? 88,
          render: (row) => {
            const media = mediaSourceForColumn(row, key);
            return (
              <AdminMediaPreview
                url={media.url}
                mimeType={media.mimeType}
                mediaKind={media.mediaKind}
                label={config.columnLabels?.[key] ?? formatAdminLabel(key)}
                className="size-16"
              />
            );
          },
        };
      }

      const isPrimary = ['email', 'title', 'inputSummary', 'storageKey'].includes(
        key
      );
      const isStatus = [
        'status',
        'role',
        'subscriptionStatus',
        'accountStatus',
        'generationType',
        'type',
        'reason',
        'source',
        'visibility',
        'isFavorite',
      ].includes(key);
      const isTime = key.endsWith('At') || key.endsWith('_at');
      const isNumber = [
        'creditBalance',
        'creditReserved',
        'delta',
        'balanceAfter',
        'sizeBytes',
        'durationSeconds',
        'usedCount',
      ].includes(key);

      return {
        key,
        label: config.columnLabels?.[key] ?? formatAdminLabel(key),
        kind:
          key === config.idField
            ? 'id'
            : isPrimary
              ? 'primary'
              : isStatus
                ? 'status'
                : isTime
                  ? 'time'
                  : isNumber
                    ? 'number'
                    : undefined,
        width:
          config.columnWidths?.[key] ??
          (key === config.idField
            ? 190
            : ['storageKey', 'publicUrl'].includes(key)
              ? 280
              : isTime
                ? 178
                : undefined),
      };
    });
  }, [config, data.list]);

  function prepareDraft(row: Record<string, unknown>) {
    const nextDraft: Record<string, string> = {};
    for (const field of config.editableFields) {
      nextDraft[field.key] = normalizeInitialValue(row[field.key], field);
    }
    setDraft(nextDraft);
  }

  function openView(row: Record<string, unknown>) {
    setSelectedRow(row);
    prepareDraft(row);
    setModalMode('view');
    setError(null);
  }

  function openEdit(row: Record<string, unknown>) {
    setSelectedRow(row);
    prepareDraft(row);
    setModalMode('edit');
    setError(null);
  }

  async function saveRow() {
    if (!selectedRow) return;
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        id: selectedRow[config.idField],
      };
      for (const field of config.editableFields) {
        if (field.readOnly) continue;
        body[field.key] = denormalizeValue(draft[field.key] ?? '', field);
      }
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(await readError(response, labels.saveFailed));
      }
      const updated = (await response.json()) as Record<string, unknown>;
      setSelectedRow(updated);
      prepareDraft(updated);
      setModalMode('view');
      await fetcher(data.page);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : labels.saveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(row: Record<string, unknown>) {
    if (
      !window.confirm(
        labels.confirmDelete(
          formatAdminValue(row[config.idField], 80),
          config.title
        )
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row[config.idField] }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, labels.deleteFailed));
      }
      if (selectedRow?.[config.idField] === row[config.idField]) {
        setSelectedRow(null);
        setModalMode(null);
      }
      await fetcher(data.page);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : labels.deleteFailed);
    } finally {
      setSaving(false);
    }
  }

  async function restoreUser(row: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', id: row[config.idField] }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, labels.restoreFailed));
      }
      await fetcher(data.page);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : labels.restoreFailed);
    } finally {
      setSaving(false);
    }
  }

  function applySearch() {
    setAppliedSearch(search.trim());
    setAppliedFilters(filters);
  }

  function resetSearch() {
    const emptyFilters = initialFilters(config);
    setSearch('');
    setAppliedSearch('');
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  }

  function tableActions(row: Record<string, unknown>): AdminTableAction[] {
    const canEditRow = canEdit && config.editEnabled !== false;
    const actions: AdminTableAction[] = [
      {
        key: 'view',
        label: labels.viewDetails,
        icon: Eye,
        onClick: openView,
      },
    ];

    if (canEditRow) {
      actions.push({
        key: 'edit',
        label: labels.edit,
        icon: Edit3,
        onClick: openEdit,
      });
    }

    const isDeletedUser = config.key === 'users' && row.deletedAt;

    if (canEditRow && isDeletedUser) {
      actions.push({
        key: 'restore',
        label: labels.restore,
        icon: RotateCcw,
        variant: 'outline',
        onClick: restoreUser,
      });
    }

    if (canDelete && config.deleteEnabled && !isDeletedUser) {
      actions.push({
        key: 'delete',
        label: labels.delete,
        icon: Trash2,
        variant: 'destructive',
        onClick: deleteRow,
      });
    }

    return actions;
  }

  const toolbarFilters = config.filterFields?.length ? (
    <>
      {config.filterFields.map((field) => (
        <label key={field.key} className="grid min-w-0 gap-1 sm:w-52">
          <span className="text-xs font-semibold uppercase text-gray-500">
            {field.label}
          </span>
          {field.type === 'date' ? (
            <AdminDateInput
              value={filters[field.key] ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              aria-label={field.label}
              className="h-9"
            />
          ) : (
            <Input
              value={filters[field.key] ?? ''}
              type={field.type ?? 'text'}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              placeholder={field.placeholder}
              className="h-9"
            />
          )}
        </label>
      ))}
      <Button
        type="submit"
        className="self-end bg-orange-600 text-white hover:bg-orange-700"
      >
        <Search className="size-4" />
        {labels.search}
      </Button>
    </>
  ) : null;

  const selectedKey =
    selectedRow && selectedRow[config.idField] != null
      ? String(selectedRow[config.idField])
      : null;
  const detailColumns =
    config.detailColumns ??
    [
      ...config.columns,
      ...config.editableFields
        .map((field) => field.key)
        .filter((key) => !config.columns.includes(key)),
    ];

  return (
    <>
      <AdminManagementTable
        actions={tableActions}
        columns={columns}
        description={config.description}
        emptyText={labels.noRecords}
        error={error}
        icon={config.icon}
        labels={labels}
        loading={loading}
        onRefresh={() => fetcher(data.page)}
        onReset={resetSearch}
        onRowClick={openView}
        onSearch={applySearch}
        onSearchValueChange={
          config.searchPlaceholder ? setSearch : undefined
        }
        pagination={{
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          onPageChange: fetcher,
        }}
        rowKey={(row, index) => String(row[config.idField] ?? index)}
        rows={data.list}
        searchPlaceholder={config.searchPlaceholder}
        searchValue={search}
        selectedRowKey={selectedKey}
        statusLabels={statusLabels}
        tableMinWidth={config.tableMinWidth ?? 1160}
        title={config.title}
        toolbarFilters={toolbarFilters}
      />

      <AdminModal
        open={Boolean(modalMode && selectedRow)}
        title={
          modalMode === 'edit'
            ? `${labels.edit} ${config.title}`
            : `${config.title} ${labels.viewDetails}`
        }
        closeLabel={labels.close}
        maxWidth="max-w-4xl"
        onClose={() => setModalMode(null)}
        footer={
          modalMode === 'edit' ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalMode('view')}
              >
                {labels.cancel}
              </Button>
              <Button type="button" onClick={saveRow} disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Edit3 className="size-4" />
                )}
                {labels.saveChanges}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalMode(null)}
              >
                {labels.close}
              </Button>
              {canEdit && config.editEnabled !== false ? (
                <Button type="button" onClick={() => setModalMode('edit')}>
                  <Edit3 className="size-4" />
                  {labels.edit}
                </Button>
              ) : null}
            </>
          )
        }
      >
        {selectedRow && modalMode === 'edit' ? (
          <div className="grid gap-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-500">
              <div className="font-mono">
                {formatAdminValue(selectedRow[config.idField], 100)}
              </div>
            </div>
            <div
              className={
                config.modalLayout === 'stacked'
                  ? 'grid gap-4'
                  : 'grid gap-4 sm:grid-cols-2'
              }
            >
              {config.editableFields.map((field) => (
                <DetailField
                  key={field.key}
                  field={field}
                  labels={labels}
                  value={draft[field.key] ?? ''}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, [field.key]: value }))
                  }
                />
              ))}
            </div>
          </div>
        ) : selectedRow ? (
          <AdminRecordDetails
            record={selectedRow}
            layout={config.modalLayout ?? 'grid'}
            fieldLabels={{
              ...config.columnLabels,
              ...Object.fromEntries(
                config.editableFields.map((field) => [field.key, field.label])
              ),
            }}
            statusLabels={statusLabels}
            columns={detailColumns}
          />
        ) : null}
      </AdminModal>
    </>
  );
}
