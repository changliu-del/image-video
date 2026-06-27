'use client';

import { createElement } from 'react';
import type { ComponentType, FormEvent, ReactNode } from 'react';
import {
  FileText,
  ImageIcon,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  Video,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { AdminCommonCopy } from '@/lib/admin/content';
import { cn } from '@/lib/utils';

export type AdminTableRow = Record<string, unknown>;

type CellKind =
  | 'id'
  | 'primary'
  | 'time'
  | 'mono'
  | 'status'
  | 'number'
  | 'media';

export type AdminTableHeaderContext<T extends AdminTableRow = AdminTableRow> = {
  column: AdminTableColumn<T>;
  columnIndex: number;
  columns: AdminTableColumn<T>[];
};

export type AdminTableCellContext<T extends AdminTableRow = AdminTableRow> = {
  row: T;
  rowIndex: number;
  column: AdminTableColumn<T>;
  value: unknown;
  getValue: () => unknown;
  renderValue: () => ReactNode;
};

export type AdminRenderable<TContext extends object> =
  | ReactNode
  | ComponentType<TContext>;

export type AdminTableColumn<T extends AdminTableRow = AdminTableRow> = {
  key: string;
  label?: string;
  kind?: CellKind;
  width?: number;
  className?: string;
  header?: AdminRenderable<AdminTableHeaderContext<T>>;
  cell?: AdminRenderable<AdminTableCellContext<T>>;
  render?: (row: T) => ReactNode;
};

export type AdminTableAction<T extends AdminTableRow = AdminTableRow> = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
  onClick: (row: T) => void;
};

type PaginationConfig = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

type AdminTableLabels = Pick<
  AdminCommonCopy,
  | 'actions'
  | 'close'
  | 'loading'
  | 'next'
  | 'page'
  | 'previous'
  | 'refresh'
  | 'reset'
  | 'search'
  | 'total'
>;

const defaultTableLabels: AdminTableLabels = {
  actions: 'Actions',
  close: 'Close',
  loading: 'Loading...',
  next: 'Next',
  page: 'Page',
  previous: 'Previous',
  refresh: 'Refresh',
  reset: 'Reset',
  search: 'Search',
  total: 'Total',
};

export function formatAdminLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\bid\b/gi, 'ID')
    .replace(/\bjson\b/gi, 'JSON')
    .replace(/\burl\b/gi, 'URL')
    .replace(/\bpdp\b/gi, 'PDP')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderAdminSlot<TContext extends object>(
  slot: AdminRenderable<TContext> | undefined,
  context: TContext
) {
  if (typeof slot === 'function') {
    return createElement(slot, context);
  }

  return slot ?? null;
}

export function formatAdminDate(value: unknown) {
  if (!value) return '-';
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return formatAdminValue(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return [
    `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  ].join(' ');
}

export function formatAdminValue(value: unknown, max = 42) {
  if (value == null || value === '') return '-';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function isVideoPreview(input: {
  mediaKind?: unknown;
  mimeType?: unknown;
  url?: unknown;
}) {
  const mediaKind = String(input.mediaKind ?? '').toLowerCase();
  const mimeType = String(input.mimeType ?? '').toLowerCase();
  const url = String(input.url ?? '').toLowerCase();

  return (
    mediaKind.includes('video') ||
    mimeType.startsWith('video/') ||
    /\.(mp4|webm|mov|m4v)(\?|#|$)/.test(url)
  );
}

function isImagePreview(input: {
  mediaKind?: unknown;
  mimeType?: unknown;
  url?: unknown;
}) {
  const mediaKind = String(input.mediaKind ?? '').toLowerCase();
  const mimeType = String(input.mimeType ?? '').toLowerCase();
  const url = String(input.url ?? '').toLowerCase();

  return (
    mediaKind.includes('image') ||
    mimeType.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/.test(url)
  );
}

export function AdminMediaPreview({
  className,
  label,
  mediaKind,
  mimeType,
  url,
  videoControls = false,
}: {
  className?: string;
  label?: string;
  mediaKind?: unknown;
  mimeType?: unknown;
  url?: unknown;
  videoControls?: boolean;
}) {
  const mediaUrl = typeof url === 'string' && url.trim() ? url.trim() : null;
  const isVideo = isVideoPreview({ mediaKind, mimeType, url: mediaUrl });
  const isImage = isImagePreview({ mediaKind, mimeType, url: mediaUrl });

  if (mediaUrl && isVideo) {
    return (
      <span
        className={cn(
          'relative block size-14 overflow-hidden rounded-md bg-gray-100',
          className
        )}
        title={label}
      >
        <video
          src={mediaUrl}
          muted={!videoControls}
          playsInline
          preload="metadata"
          controls={videoControls}
          className="size-full object-cover"
        />
        {!videoControls ? (
          <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/10 text-white">
            <PlayCircle className="size-5" />
          </span>
        ) : null}
      </span>
    );
  }

  if (mediaUrl && isImage) {
    return (
      <img
        src={mediaUrl}
        alt={label ?? ''}
        className={cn('size-14 rounded-md bg-gray-100 object-cover', className)}
      />
    );
  }

  const EmptyIcon = isVideo ? Video : mediaUrl ? FileText : ImageIcon;

  return (
    <span
      className={cn(
        'flex size-14 items-center justify-center rounded-md bg-gray-100 text-gray-300',
        className
      )}
      title={label}
    >
      <EmptyIcon className="size-5" />
    </span>
  );
}

export function AdminStatusBadge({
  labels,
  value,
}: {
  labels?: Record<string, string>;
  value: unknown;
}) {
  const normalized = String(value ?? '').toLowerCase();
  const text = labels?.[normalized] ?? formatAdminValue(value, 24);
  const matched =
    [
      'published',
      'uploaded',
      'succeeded',
      'admin',
      'active',
      'draft',
      'queued',
      'pending',
      'member',
      'submitting',
      'running',
      'rendering',
      'ops',
      'failed',
      'deleted',
      'archived',
      'inactive',
    ].includes(normalized) || !normalized;

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-6 rounded-md border-transparent px-2 py-0 text-xs font-semibold',
        ['published', 'uploaded', 'succeeded', 'admin', 'active'].includes(
          normalized
        ) && 'bg-emerald-50 text-emerald-700',
        ['draft', 'queued', 'pending', 'member'].includes(normalized) &&
          'bg-amber-50 text-amber-700',
        ['submitting', 'running', 'rendering', 'ops'].includes(normalized) &&
          'bg-sky-50 text-sky-700',
        ['failed', 'deleted'].includes(normalized) &&
          'bg-red-50 text-red-700',
        ['archived', 'inactive'].includes(normalized) &&
          'bg-gray-100 text-gray-600',
        !matched && 'bg-gray-100 text-gray-600'
      )}
    >
      {text}
    </Badge>
  );
}

export function AdminModal({
  children,
  closeLabel = 'Close',
  footer,
  maxWidth = 'max-w-3xl',
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  closeLabel?: string;
  footer?: ReactNode;
  maxWidth?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        showCloseButton={false}
        className={cn(
          'flex max-h-[calc(100vh-48px)] flex-col gap-0 overflow-hidden p-0 shadow-2xl',
          maxWidth
        )}
      >
        <DialogHeader className="flex-row items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 text-left">
          <DialogTitle className="text-base text-gray-950">{title}</DialogTitle>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={closeLabel}
              title={closeLabel}
            >
              <X className="size-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
            {footer}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function mediaFallbackKeys(key: string) {
  if (key === 'inputPreviewUrl') {
    return ['inputPreviewUrl', 'inputImageUrl', 'inputVideoUrl'];
  }

  if (key === 'finalPreviewUrl') {
    return [
      'finalPreviewUrl',
      'finalVideoUrl',
      'finalImageUrl',
      'outputPreviewUrl',
      'outputVideoUrl',
      'outputImageUrl',
    ];
  }

  return [key];
}

function firstRecordValue(record: AdminTableRow, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value != null && value !== '') return value;
  }
  return null;
}

function hasDetailColumn(record: AdminTableRow, key: string) {
  if (
    key === 'inputPreviewUrl' ||
    key === 'finalPreviewUrl' ||
    key.endsWith('PreviewUrl')
  ) {
    return firstRecordValue(record, mediaFallbackKeys(key)) != null;
  }

  return key in record;
}

export function AdminRecordDetails({
  columns,
  fieldLabels,
  layout = 'grid',
  record,
  statusLabels,
}: {
  columns?: string[];
  fieldLabels?: Record<string, string>;
  layout?: 'grid' | 'stacked';
  record: AdminTableRow;
  statusLabels?: Record<string, string>;
}) {
  const keys = columns?.length
    ? columns.filter((key) => hasDetailColumn(record, key))
    : Object.keys(record);

  return (
    <dl
      className={cn(
        'grid gap-3',
        layout === 'grid' ? 'sm:grid-cols-2' : 'grid-cols-1'
      )}
    >
      {keys.map((key) => {
        const value = record[key];
        const isObject = value != null && typeof value === 'object';
        const isMediaUrl =
          [
            'previewUrl',
            'publicUrl',
            'inputPreviewUrl',
            'inputImageUrl',
            'inputVideoUrl',
            'finalPreviewUrl',
            'finalImageUrl',
            'finalVideoUrl',
          ].includes(key) ||
          key.endsWith('PreviewUrl') ||
          key.endsWith('ImageUrl') ||
          key.endsWith('VideoUrl');
        const mediaKindKey =
          key === 'previewUrl' || key === 'publicUrl'
            ? 'mediaKind'
            : key
                .replace('PreviewUrl', 'MediaKind')
                .replace('ImageUrl', 'MediaKind')
                .replace('VideoUrl', 'MediaKind');
        const mediaMimeType =
          record[key.replace('Url', 'MimeType')] ??
          (key === 'publicUrl' ? record.mimeType : undefined);
        const isInputVideo =
          key === 'inputPreviewUrl' && Boolean(record.inputVideoUrl);
        const isInputImage =
          key === 'inputPreviewUrl' && Boolean(record.inputImageUrl);
        const isFinalVideo =
          key === 'finalPreviewUrl' &&
          Boolean(record.finalVideoUrl || record.outputVideoUrl);
        const isFinalImage =
          key === 'finalPreviewUrl' &&
          Boolean(record.finalImageUrl || record.outputImageUrl);
        const mediaKind =
          record[mediaKindKey] ??
          (isInputVideo ? 'video' : undefined) ??
          (isInputImage ? 'image' : undefined) ??
          (isFinalVideo ? 'video' : undefined) ??
          (isFinalImage ? 'image' : undefined) ??
          (key.endsWith('VideoUrl') ? 'video' : undefined) ??
          (key.endsWith('ImageUrl') ? 'image' : undefined);
        const mediaUrl = isMediaUrl
          ? firstRecordValue(record, mediaFallbackKeys(key))
          : value;

        return (
          <div
            key={key}
            className={cn(
              'rounded-lg border border-gray-200 bg-gray-50 p-3',
              isObject && 'sm:col-span-2'
            )}
          >
            <dt className="mb-1 text-xs font-semibold uppercase text-gray-500">
              {fieldLabels?.[key] ?? formatAdminLabel(key)}
            </dt>
            <dd className="break-words text-sm text-gray-900">
              {isMediaUrl ? (
                <AdminMediaPreview
                  url={mediaUrl}
                  mimeType={mediaMimeType}
                  mediaKind={mediaKind}
                  label={fieldLabels?.[key] ?? formatAdminLabel(key)}
                  className="h-36 w-full max-w-72"
                  videoControls
                />
              ) : isObject ? (
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-xs leading-5 text-gray-700">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                statusLabels?.[String(value ?? '').toLowerCase()] ??
                formatAdminValue(value, 300)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function getRowKey<T extends AdminTableRow>(
  row: T,
  index: number,
  rowKey: string | ((row: T, index: number) => string)
) {
  if (typeof rowKey === 'function') return rowKey(row, index);
  return String(row[rowKey] ?? index);
}

function defaultCell<T extends AdminTableRow>(
  column: AdminTableColumn<T>,
  row: T,
  statusLabels?: Record<string, string>
) {
  const value = row[column.key];
  const isTime =
    column.kind === 'time' ||
    column.key.endsWith('At') ||
    column.key.endsWith('_at');

  if (column.kind === 'status') {
    return <AdminStatusBadge labels={statusLabels} value={value} />;
  }

  return (
    <span
      className={cn(
        'block max-w-[360px] break-words text-xs leading-5 text-gray-700',
        (column.kind === 'id' || column.kind === 'mono') &&
          'font-mono text-gray-500',
        column.kind === 'primary' && 'text-sm font-medium text-gray-950',
        column.kind === 'number' && 'font-mono tabular-nums text-gray-600',
        isTime && 'tabular-nums text-gray-500'
      )}
    >
      {isTime ? formatAdminDate(value) : formatAdminValue(value)}
    </span>
  );
}

export function AdminManagementTable<T extends AdminTableRow>({
  actions,
  columns,
  description,
  emptyText = 'No data.',
  error,
  icon: Icon,
  labels,
  loading,
  onRefresh,
  onReset,
  onRowClick,
  onSearch,
  pagination,
  primaryAction,
  rowKey,
  rows,
  searchPlaceholder,
  searchValue,
  selectedRowKey,
  tableMinWidth = 1080,
  title,
  toolbarFilters,
  onSearchValueChange,
  statusLabels,
}: {
  actions?: (row: T) => AdminTableAction<T>[];
  columns: AdminTableColumn<T>[];
  description?: string;
  emptyText?: string;
  error?: string | null;
  icon?: ComponentType<{ className?: string }>;
  labels?: Partial<AdminTableLabels>;
  loading: boolean;
  onRefresh?: () => void;
  onReset?: () => void;
  onRowClick?: (row: T) => void;
  onSearch?: () => void;
  pagination?: PaginationConfig;
  primaryAction?: ReactNode;
  rowKey: string | ((row: T, index: number) => string);
  rows: T[];
  searchPlaceholder?: string;
  searchValue?: string;
  selectedRowKey?: string | null;
  tableMinWidth?: number;
  title: string;
  toolbarFilters?: ReactNode;
  onSearchValueChange?: (value: string) => void;
  statusLabels?: Record<string, string>;
}) {
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch?.();
  }

  const showActions = Boolean(actions);
  const showSearch = Boolean(onSearch && onSearchValueChange);
  const showToolbarFilters = Boolean(toolbarFilters);
  const colSpan = columns.length + (showActions ? 1 : 0);
  const copy = { ...defaultTableLabels, ...labels };
  const canPageBackward = Boolean(pagination && pagination.page > 1);
  const canPageForward = Boolean(
    pagination && pagination.page * pagination.pageSize < pagination.total
  );

  return (
    <Card className="rounded-lg border-gray-200 bg-white py-0 shadow-sm">
      <CardHeader className="border-b border-gray-100 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              {Icon ? <Icon className="size-5 text-orange-600" /> : null}
              {title}
            </CardTitle>
            {description ? (
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-4">
        {showSearch || toolbarFilters || primaryAction || onRefresh ? (
          <form
            onSubmit={submitSearch}
            className={cn(
              'mb-4 flex flex-wrap items-end gap-2 border-b border-gray-200 pb-4',
              primaryAction && 'lg:flex-nowrap'
            )}
          >
            {showSearch ? (
              <>
                <div className="relative w-full min-w-0 sm:w-72 sm:shrink-0 md:w-80 lg:w-96">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    value={searchValue ?? ''}
                    onChange={(event) =>
                      onSearchValueChange?.(event.target.value)
                    }
                    placeholder={searchPlaceholder}
                    className="pl-9"
                  />
                </div>
                {!showToolbarFilters ? (
                  <Button
                    type="submit"
                    className="bg-orange-600 text-white hover:bg-orange-700"
                  >
                    <Search className="size-4" />
                    {copy.search}
                  </Button>
                ) : null}
              </>
            ) : null}
            {toolbarFilters}
            {onReset ? (
              <Button
                type="button"
                variant="outline"
                className="self-end"
                onClick={onReset}
              >
                {copy.reset}
              </Button>
            ) : null}
            {onRefresh ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 self-end"
                onClick={onRefresh}
                aria-label={copy.refresh}
                title={copy.refresh}
              >
                <RefreshCw
                  className={cn('size-4', loading && 'animate-spin')}
                />
              </Button>
            ) : null}
            {primaryAction ? (
              <div className="ml-auto flex items-center gap-2">
                {primaryAction}
              </div>
            ) : null}
          </form>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table
            className="w-full min-w-full border-separate border-spacing-0 text-left text-sm"
            style={{ minWidth: tableMinWidth, width: '100%' }}
          >
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500">
                {columns.map((column, columnIndex) => {
                  const headerContext: AdminTableHeaderContext<T> = {
                    column,
                    columnIndex,
                    columns,
                  };

                  return (
                    <th
                      key={column.key}
                      className={cn(
                        'whitespace-nowrap border-b border-gray-200 px-4 py-3 font-semibold',
                        column.className
                      )}
                      style={
                        column.width ? { width: column.width } : undefined
                      }
                    >
                      {column.header !== undefined
                        ? renderAdminSlot(column.header, headerContext)
                        : column.label ?? formatAdminLabel(column.key)}
                    </th>
                  );
                })}
                {showActions ? (
                  <th className="sticky right-0 z-10 w-[132px] whitespace-nowrap border-b border-l border-gray-200 bg-gray-50 px-4 py-3 font-semibold">
                    {copy.actions}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="h-48 px-4 py-10 text-center text-gray-500"
                  >
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin" />
                    {copy.loading}
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row, index) => {
                  const key = getRowKey(row, index, rowKey);
                  const rowActions = actions?.(row) ?? [];
                  const selected = selectedRowKey === key;

                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        'group border-b border-gray-100 align-top transition hover:bg-gray-50',
                        onRowClick && 'cursor-pointer',
                        selected && 'bg-orange-50/60'
                      )}
                    >
                      {columns.map((column) => {
                        const value = row[column.key];
                        const cellContext: AdminTableCellContext<T> = {
                          row,
                          rowIndex: index,
                          column,
                          value,
                          getValue: () => value,
                          renderValue: () =>
                            column.render
                              ? column.render(row)
                              : defaultCell(column, row, statusLabels),
                        };

                        return (
                          <td
                            key={column.key}
                            className="border-b border-gray-100 px-4 py-3"
                          >
                            {column.cell !== undefined
                              ? renderAdminSlot(column.cell, cellContext)
                              : column.render
                                ? column.render(row)
                                : defaultCell(column, row, statusLabels)}
                          </td>
                        );
                      })}
                      {showActions ? (
                        <td
                          className={cn(
                            'sticky right-0 border-b border-l border-gray-100 px-4 py-3',
                            selected
                              ? 'bg-orange-50'
                              : 'bg-white group-hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-center gap-1">
                            {rowActions.map((action) => {
                              const ActionIcon = action.icon;

                              return (
                                <Button
                                  key={action.key}
                                  type="button"
                                  size="icon"
                                  variant={action.variant ?? 'ghost'}
                                  className="size-8"
                                  disabled={action.disabled}
                                  aria-label={action.label}
                                  title={action.label}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    action.onClick(row);
                                  }}
                                >
                                  <ActionIcon className="size-4" />
                                </Button>
                              );
                            })}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="h-48 px-4 py-10 text-center text-gray-500"
                  >
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
            <span>{copy.total}: {pagination.total}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs">
                {copy.page} {pagination.page}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canPageBackward}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
              >
                {copy.previous}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canPageForward}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
              >
                {copy.next}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
