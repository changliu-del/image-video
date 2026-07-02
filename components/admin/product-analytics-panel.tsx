'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  productAnalyticsRankTypes,
  type ProductAnalyticsRankType,
} from '@/lib/product-analytics/catalog';
import type { AdminContent } from '@/lib/admin/content';
import { cn } from '@/lib/utils';

type ProductAnalyticsSummary = {
  rankType: ProductAnalyticsRankType;
  label: string;
  rowCount: number;
  sourceFileName: string | null;
  importedAt: string | null;
  importedByEmail: string | null;
  batchId: number | null;
};

type ProductAnalyticsSummaryResponse = {
  ranks: ProductAnalyticsSummary[];
};

type ImportResponse = {
  rankType: ProductAnalyticsRankType;
  label: string;
  rowCount: number;
};

function formatDateTime(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export function ProductAnalyticsPanel({
  content,
  canImport,
}: {
  content: AdminContent;
  canImport: boolean;
}) {
  const copy = content.productAnalytics;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [rankType, setRankType] =
    useState<ProductAnalyticsRankType>('sales');
  const [summaries, setSummaries] = useState<ProductAnalyticsSummary[]>([]);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const summaryByRank = useMemo(
    () => new Map(summaries.map((summary) => [summary.rankType, summary])),
    [summaries]
  );

  async function loadSummaries() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/product-analytics');
      if (!response.ok) {
        throw new Error(await readError(response, content.common.loadFailed));
      }
      const data = (await response.json()) as ProductAnalyticsSummaryResponse;
      setSummaries(data.ranks);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : content.common.loadFailed
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSummaries();
  }, []);

  async function submitImport() {
    const file = fileRef.current?.files?.[0] ?? null;
    if (!file || isImporting) return;

    setIsImporting(true);
    setError(null);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.set('rankType', rankType);
      formData.set('file', file);

      const response = await fetch('/api/admin/product-analytics', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(await readError(response, copy.importFailed));
      }

      const result = (await response.json()) as ImportResponse;
      setNotice(copy.importSuccess(copy.ranks[result.rankType], result.rowCount));
      setSelectedFileName('');
      if (fileRef.current) fileRef.current.value = '';
      await loadSummaries();
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : copy.importFailed
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-orange-50 text-orange-600">
                <BarChart3 className="size-4" />
              </span>
              <div>
                <h1 className="text-lg font-semibold text-gray-950">
                  {copy.title}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {copy.description}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium text-gray-500">
              {copy.replaceNote}
            </p>
          </div>

          <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:min-w-[420px]">
            <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">
              {copy.rankType}
              <select
                value={rankType}
                disabled={!canImport || isImporting}
                onChange={(event) =>
                  setRankType(event.target.value as ProductAnalyticsRankType)
                }
                className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm font-semibold normal-case text-gray-900 outline-none transition focus:border-gray-400 disabled:bg-gray-100"
              >
                {productAnalyticsRankTypes.map((type) => (
                  <option key={type} value={type}>
                    {copy.ranks[type]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-xs font-semibold uppercase text-gray-500">
              {copy.file}
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={!canImport || isImporting}
                onChange={(event) =>
                  setSelectedFileName(event.target.files?.[0]?.name ?? '')
                }
                className="block h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm normal-case text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1 file:text-xs file:font-semibold disabled:bg-gray-100"
              />
            </label>

            <Button
              type="button"
              disabled={!canImport || !selectedFileName || isImporting}
              onClick={submitImport}
              className="h-10 justify-center gap-2"
            >
              {isImporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              {isImporting ? copy.importing : copy.importAction}
            </Button>
          </div>
        </div>

        {notice || error ? (
          <div
            className={cn(
              'mt-4 rounded-md border px-3 py-2 text-sm font-medium',
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            )}
          >
            {error ?? notice}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-950">
            {copy.latestImports}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadSummaries}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            {content.common.refresh}
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-3">{copy.rankType}</th>
                <th className="px-5 py-3">{copy.rowCount}</th>
                <th className="px-5 py-3">{copy.sourceFileName}</th>
                <th className="px-5 py-3">{copy.importedAt}</th>
                <th className="px-5 py-3">{copy.importedBy}</th>
                <th className="px-5 py-3">{copy.batchId}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productAnalyticsRankTypes.map((type) => {
                const summary = summaryByRank.get(type);
                return (
                  <tr key={type} className="align-top">
                    <td className="px-5 py-4 font-semibold text-gray-950">
                      {copy.ranks[type]}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {summary?.rowCount ?? 0}
                    </td>
                    <td className="max-w-[280px] truncate px-5 py-4 text-gray-700">
                      {summary?.sourceFileName ?? copy.noImport}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {formatDateTime(summary?.importedAt ?? null)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {summary?.importedByEmail ?? '-'}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      {summary?.batchId ?? '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
