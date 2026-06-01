'use client';

import { useEffect } from 'react';
import type { ComponentType, FormEvent, ReactNode } from 'react';
import { Loader2, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type AdminTableRow = Record<string, unknown>;

type CellKind = 'id' | 'primary' | 'time' | 'mono' | 'status' | 'number';

export type AdminTableColumn<T extends AdminTableRow = AdminTableRow> = {
  key: string;
  label?: string;
  kind?: CellKind;
  width?: number;
  className?: string;
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

export function formatAdminLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\bid\b/gi, 'ID')
    .replace(/\bjson\b/gi, 'JSON')
    .replace(/\burl\b/gi, 'URL')
    .replace(/\bcta\b/gi, 'CTA')
    .replace(/\bpdp\b/gi, 'PDP')
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

export function AdminStatusBadge({ value }: { value: unknown }) {
  const text = formatAdminValue(value, 24);
  const normalized = String(value ?? '').toLowerCase();
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
      'running',
      'rendering',
      'ops',
      'failed',
      'deleted',
      'archived',
      'inactive',
    ].includes(normalized) || !normalized;

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center rounded-md px-2 text-xs font-semibold',
        ['published', 'uploaded', 'succeeded', 'admin', 'active'].includes(
          normalized
        ) && 'bg-emerald-50 text-emerald-700',
        ['draft', 'queued', 'pending', 'member'].includes(normalized) &&
          'bg-amber-50 text-amber-700',
        ['running', 'rendering', 'ops'].includes(normalized) &&
          'bg-sky-50 text-sky-700',
        ['failed', 'deleted'].includes(normalized) &&
          'bg-red-50 text-red-700',
        ['archived', 'inactive'].includes(normalized) &&
          'bg-gray-100 text-gray-600',
        !matched && 'bg-gray-100 text-gray-600'
      )}
    >
      {text}
    </span>
  );
}

export function AdminModal({
  children,
  footer,
  maxWidth = 'max-w-3xl',
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4 py-6"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'flex max-h-[calc(100vh-48px)] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl',
          maxWidth
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-950">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Close"
            title="Close"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-5 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AdminRecordDetails({
  columns,
  layout = 'grid',
  record,
}: {
  columns?: string[];
  layout?: 'grid' | 'stacked';
  record: AdminTableRow;
}) {
  const keys = columns?.length
    ? columns.filter((key) => key in record)
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

        return (
          <div
            key={key}
            className={cn(
              'rounded-lg border border-gray-200 bg-gray-50 p-3',
              isObject && 'sm:col-span-2'
            )}
          >
            <dt className="mb-1 text-xs font-semibold uppercase text-gray-500">
              {formatAdminLabel(key)}
            </dt>
            <dd className="break-words text-sm text-gray-900">
              {isObject ? (
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-xs leading-5 text-gray-700">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
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
  row: T
) {
  const value = row[column.key];
  const isTime =
    column.kind === 'time' ||
    column.key.endsWith('At') ||
    column.key.endsWith('_at');

  if (column.kind === 'status') {
    return <AdminStatusBadge value={value} />;
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
}: {
  actions?: (row: T) => AdminTableAction<T>[];
  columns: AdminTableColumn<T>[];
  description?: string;
  emptyText?: string;
  error?: string | null;
  icon?: ComponentType<{ className?: string }>;
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
}) {
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch?.();
  }

  const showActions = Boolean(actions);
  const showSearch = Boolean(onSearch && onSearchValueChange);
  const colSpan = columns.length + (showActions ? 1 : 0);
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
              primaryAction && 'sm:flex-nowrap'
            )}
          >
            {showSearch ? (
              <>
                <div className="relative w-full min-w-0 sm:w-auto sm:flex-1">
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
                <Button
                  type="submit"
                  className="bg-orange-600 text-white hover:bg-orange-700"
                >
                  <Search className="size-4" />
                  Search
                </Button>
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
                Reset
              </Button>
            ) : null}
            {onRefresh ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 self-end"
                onClick={onRefresh}
                aria-label="Refresh"
                title="Refresh"
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
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'whitespace-nowrap border-b border-gray-200 px-4 py-3 font-semibold',
                      column.className
                    )}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.label ?? formatAdminLabel(column.key)}
                  </th>
                ))}
                {showActions ? (
                  <th className="sticky right-0 z-10 w-[132px] whitespace-nowrap border-b border-l border-gray-200 bg-gray-50 px-4 py-3 font-semibold">
                    Actions
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
                    Loading...
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
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="border-b border-gray-100 px-4 py-3"
                        >
                          {column.render
                            ? column.render(row)
                            : defaultCell(column, row)}
                        </td>
                      ))}
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
            <span>Total: {pagination.total}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs">Page {pagination.page}</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canPageBackward}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canPageForward}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
