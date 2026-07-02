'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  Loader2,
  PackageOpen,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  productAnalyticsRankConfig,
  type ProductAnalyticsRankType,
} from '@/lib/product-analytics/catalog';
import type {
  ProductAnalyticsItemDto,
  ProductAnalyticsListResponse,
} from '@/lib/product-analytics/query';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 30;
const CATEGORY_PREVIEW_LIMIT = 12;

type ProductAnalyticsCopy = {
  allCategories: string;
  moreCategories: string;
  fewerCategories: string;
  rank: string;
  product: string;
  sales: string;
  revenue: string;
  totalSales: string;
  totalRevenue: string;
  image: string;
  shop: string;
  category: string;
  commission: string;
  listed: string;
  loading: string;
  loadFailed: string;
  empty: string;
  retry: string;
  previous: string;
  next: string;
  page: string;
  rows: string;
  fastmoss: string;
  tiktok: string;
};

const copy: Record<'en' | 'pt', ProductAnalyticsCopy> = {
  en: {
    allCategories: 'All',
    moreCategories: 'More',
    fewerCategories: 'Less',
    rank: 'Rank',
    product: 'Product',
    sales: 'Sales',
    revenue: 'Revenue',
    totalSales: 'Total sales',
    totalRevenue: 'Total revenue',
    image: 'Product image',
    shop: 'Shop',
    category: 'Category',
    commission: 'Commission',
    listed: 'Listed',
    loading: 'Loading ranking...',
    loadFailed: 'Ranking could not be loaded.',
    empty: 'No imported data yet.',
    retry: 'Retry',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    rows: 'rows',
    fastmoss: 'FastMoss',
    tiktok: 'TikTok',
  },
  pt: {
    allCategories: 'Todas',
    moreCategories: 'Mais',
    fewerCategories: 'Menos',
    rank: 'Posição',
    product: 'Produto',
    sales: 'Vendas',
    revenue: 'Receita',
    totalSales: 'Vendas totais',
    totalRevenue: 'Receita total',
    image: 'Imagem do produto',
    shop: 'Loja',
    category: 'Categoria',
    commission: 'Comissão',
    listed: 'Publicado',
    loading: 'Carregando ranking...',
    loadFailed: 'Não foi possível carregar o ranking.',
    empty: 'Ainda não há dados importados.',
    retry: 'Tentar novamente',
    previous: 'Anterior',
    next: 'Próxima',
    page: 'Página',
    rows: 'linhas',
    fastmoss: 'FastMoss',
    tiktok: 'TikTok',
  },
};

function formatInteger(value: number | null, locale: string) {
  if (value == null) return '-';
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrency(value: number | null, locale: string) {
  if (value == null) return '-';
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(value);
}

function Metric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase text-gray-400">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 whitespace-nowrap text-sm font-semibold',
          tone === 'accent' ? 'text-orange-600' : 'text-gray-950'
        )}
      >
        {value}
      </div>
    </div>
  );
}

function SourceLink({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-[11px] font-semibold text-gray-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
    >
      <ExternalLink className="size-3.5" />
      {label}
    </a>
  );
}

function ProductImage({
  item,
  label,
}: {
  item: ProductAnalyticsItemDto;
  label: string;
}) {
  const image = item.productImageUrl ? (
    <img src={item.productImageUrl} alt="" className="size-full object-cover" />
  ) : (
    <div className="grid size-full place-items-center text-gray-300">
      <PackageOpen className="size-5" />
    </div>
  );

  const content = image;

  const className =
    'relative size-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-100';

  if (!item.productImageUrl) {
    return <div className={className}>{content}</div>;
  }

  return (
    <a
      href={item.productImageUrl}
      target="_blank"
      rel="noreferrer"
      title={label}
      className={className}
    >
      {content}
    </a>
  );
}

function ProductCell({
  item,
  labels,
}: {
  item: ProductAnalyticsItemDto;
  labels: ProductAnalyticsCopy;
}) {
  return (
    <div className="flex min-w-[420px] gap-3">
      <ProductImage item={item} label={labels.image} />
      <div className="min-w-0">
        <div className="line-clamp-2 text-sm font-semibold leading-5 text-gray-950">
          {item.productName}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-500">
          {item.priceText ? (
            <span className="text-orange-600">{item.priceText}</span>
          ) : null}
          {item.category ? (
            <span>
              {labels.category}: {item.category}
            </span>
          ) : null}
          {item.region ? <span>{item.region}</span> : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
          {item.shopName ? (
            <span>
              {labels.shop}: {item.shopName}
            </span>
          ) : null}
          {item.commissionRateText ? (
            <span>
              {labels.commission}: {item.commissionRateText}
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <SourceLink href={item.fastmossProductUrl} label={labels.fastmoss} />
          <SourceLink href={item.tiktokProductUrl} label={labels.tiktok} />
          {item.listedAtText ? (
            <span className="text-[11px] font-medium text-gray-400">
              {labels.listed}: {item.listedAtText}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ProductAnalyticsPage({
  initialRank,
}: {
  initialRank: ProductAnalyticsRankType;
}) {
  const locale = useDashboardLocale();
  const labels = copy[locale === 'pt' ? 'pt' : 'en'];
  const rankType = initialRank;
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [data, setData] = useState<ProductAnalyticsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeConfig = productAnalyticsRankConfig[rankType];
  const hasNext = Boolean(data && page * data.pageSize < data.total);
  const categories = data?.categories ?? [];
  const visibleCategories = useMemo(() => {
    if (showAllCategories) return categories;
    const preview = categories.slice(0, CATEGORY_PREVIEW_LIMIT);
    if (
      selectedCategory &&
      categories.includes(selectedCategory) &&
      !preview.includes(selectedCategory)
    ) {
      return [...preview, selectedCategory];
    }
    return preview;
  }, [categories, selectedCategory, showAllCategories]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({
      rankType,
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (selectedCategory) params.set('category', selectedCategory);
    return `/api/product-analytics?${params}`;
  }, [page, rankType, selectedCategory]);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(labels.loadFailed);
      const nextData = (await response.json()) as ProductAnalyticsListResponse;
      setData(nextData);
      if (selectedCategory && nextData.activeCategory !== selectedCategory) {
        setSelectedCategory(nextData.activeCategory ?? '');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : labels.loadFailed);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [endpoint]);

  useEffect(() => {
    setPage(1);
    setSelectedCategory('');
    setShowAllCategories(false);
  }, [rankType]);

  function selectCategory(category: string) {
    setPage(1);
    setSelectedCategory(category);
  }

  return (
    <main className="min-h-[calc(100dvh-58px)] bg-[#f5f7fb] px-4 py-5 text-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">
            {activeConfig.title[locale === 'pt' ? 'pt' : 'en']}
          </h1>
        </header>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div className="shrink-0 pt-2 text-xs font-bold uppercase text-gray-500">
              {labels.category}
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectCategory('')}
                className={cn(
                  'h-8 rounded-full px-4 text-xs font-bold transition',
                  selectedCategory
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                    : 'bg-pink-500 text-white shadow-sm'
                )}
              >
                {labels.allCategories}
              </button>
              {visibleCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => selectCategory(category)}
                  className={cn(
                    'h-8 max-w-[220px] truncate rounded-full px-4 text-xs font-bold transition',
                    selectedCategory === category
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  )}
                  title={category}
                >
                  {category}
                </button>
              ))}
              {categories.length > CATEGORY_PREVIEW_LIMIT ? (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((value) => !value)}
                  className="h-8 rounded-full bg-pink-50 px-4 text-xs font-bold text-pink-600 transition hover:bg-pink-100"
                >
                  {showAllCategories
                    ? labels.fewerCategories
                    : labels.moreCategories}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <div className="text-sm font-semibold text-gray-950">
              {data?.total ?? 0} {labels.rows}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {labels.retry}
            </Button>
          </div>

          {error ? (
            <div className="px-5 py-10 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          ) : isLoading && !data ? (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm font-medium text-gray-500">
              <Loader2 className="size-4 animate-spin" />
              {labels.loading}
            </div>
          ) : !data?.list.length ? (
            <div className="px-5 py-16 text-center text-sm font-medium text-gray-500">
              {labels.empty}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="w-20 px-5 py-3">{labels.rank}</th>
                    <th className="px-5 py-3">{labels.product}</th>
                    <th className="px-5 py-3">{labels.sales}</th>
                    <th className="px-5 py-3">{labels.revenue}</th>
                    <th className="px-5 py-3">{labels.totalSales}</th>
                    <th className="px-5 py-3">{labels.totalRevenue}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.list.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-5 py-4">
                        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-gray-100 px-2 text-sm font-bold text-gray-700">
                          {item.rank}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ProductCell item={item} labels={labels} />
                      </td>
                      <td className="px-5 py-4">
                        <Metric
                          label={labels.sales}
                          value={formatInteger(
                            item.sales ?? item.videoSales,
                            locale
                          )}
                          tone="accent"
                        />
                        {item.salesChangeText ? (
                          <div className="mt-1 text-xs font-medium text-gray-400">
                            {item.salesChangeText}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <Metric
                          label={labels.revenue}
                          value={formatCurrency(item.revenueAmount, locale)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <Metric
                          label={labels.totalSales}
                          value={formatInteger(
                            item.totalSales ?? item.videoTotalSales,
                            locale
                          )}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <Metric
                          label={labels.totalRevenue}
                          value={formatCurrency(
                            item.totalRevenueAmount ??
                              item.videoTotalRevenueAmount,
                            locale
                          )}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 text-sm">
            <span className="font-medium text-gray-500">
              {labels.page} {page}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                {labels.previous}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!hasNext || isLoading}
                onClick={() => setPage((value) => value + 1)}
              >
                {labels.next}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
