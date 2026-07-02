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
  open: string;
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
    open: 'Open',
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
    open: 'Abrir',
  },
};

type WorkbookColumnKind = 'rank' | 'image' | 'link' | 'product' | 'text';

type WorkbookColumn = {
  header: string;
  kind: WorkbookColumnKind;
  minWidth: number;
};

const fallbackWorkbookHeaders: Record<ProductAnalyticsRankType, string[]> = {
  sales: [
    '排名',
    '商品图片',
    '商品名称',
    '商品售价',
    '国家/地区',
    '店铺名',
    '店铺总销量',
    '商品分类',
    '佣金比例',
    '销量',
    '销量环比',
    '销售额',
    '总销量',
    '总销售额',
    '商品状态',
    '预估商品上架时间',
    'FastMoss 商品详情页',
    'TikTok 官网商品详情页',
    'FastMoss 店铺详情页',
  ],
  new: [
    '排名',
    '商品图片',
    '商品名称',
    '商品售价',
    '国家/地区',
    '店铺名',
    '店铺总销量',
    '商品分类',
    '销量',
    '总销量',
    '总销售额',
    '商品状态',
    '预估商品上架时间',
    'FastMoss 商品详情页',
    'TikTok 官网商品详情页',
    'FastMoss 店铺详情页',
  ],
  promoted: [
    '排名',
    '商品图片',
    '商品名称',
    '商品售价',
    '国家/地区',
    '店铺名',
    '店铺总销量',
    '商品分类',
    '佣金比例',
    '销量',
    '销量环比',
    '销售额',
    '总销量',
    '总销售额',
    'FastMoss 商品详情页',
    'TikTok 官网商品详情页',
    'FastMoss 店铺详情页',
  ],
  'video-products': [
    '排名',
    '商品图片',
    '商品名称',
    '商品售价',
    '国家/地区',
    '店铺名',
    '商品分类',
    '视频标题',
    '视频地址',
    '视频播放量',
    '视频销量',
    '视频总销量',
    '视频总销售额',
    '总播放量',
    '总点赞量',
    '总评论数',
    'FastMoss 商品详情页',
    'TikTok 官网商品详情页',
  ],
};

const fieldAliases = {
  rank: ['排名', 'Rank'],
  productImage: ['商品图片', '商品封面', '商品封面链接', 'Product image'],
  productId: ['商品ID', 'Product ID'],
  productName: ['商品名称', '商品标题', 'Product name'],
  price: ['商品售价', '售价', 'Price'],
  region: ['国家/地区', 'Region'],
  shopName: ['店铺名', '所属店铺', '所属店铺名称', 'Shop'],
  shopImage: ['店铺封面', 'Shop image'],
  shopSales: ['店铺总销量', '店铺销量', 'Shop sales'],
  category: ['商品分类', 'Category'],
  commission: ['佣金比例', 'Commission'],
  sales: ['销量', 'Sales'],
  salesChange: ['销量环比', 'Sales change'],
  totalSales: ['总销量', 'Total sales'],
  revenue: ['销售额', 'Revenue'],
  totalRevenue: ['总销售额', 'Total revenue'],
  status: ['商品状态', 'Status'],
  listed: ['预估商品上架时间', 'Listed at'],
  fastmossProductUrl: [
    'FastMoss 商品详情页',
    'FastMoss商品详情页',
    'FastMoss商品详情页链接',
  ],
  tiktokProductUrl: [
    'TikTok 官网商品详情页',
    'TikTok官网商品详情页',
    'TikTok商品链接',
  ],
  fastmossShopUrl: ['FastMoss 店铺详情页', 'FastMoss店铺详情页'],
  videoTitle: ['视频标题', 'Video title'],
  videoAddress: ['视频地址', 'Video URL'],
  videoViews: ['视频播放量', 'Video views'],
  videoSales: ['视频销量', 'Video sales'],
  videoTotalSales: ['视频总销量', 'Video total sales'],
  videoTotalRevenue: ['视频总销售额', 'Video total revenue'],
  totalViews: ['总播放量', 'Total views'],
  totalLikes: ['总点赞量', '总点赞数'],
  totalComments: ['总评论数'],
} as const;

function compactHeader(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function isVisibleWorkbookHeader(header: string) {
  return header.trim() !== '' && !/^__EMPTY(?:_\d+)?$/i.test(header);
}

function headerMatches(
  header: string,
  aliases: readonly string[]
) {
  const normalized = compactHeader(header);
  return aliases.some((alias) => compactHeader(alias) === normalized);
}

function isRankHeader(header: string) {
  return headerMatches(header, fieldAliases.rank);
}

function isImageHeader(header: string) {
  return (
    headerMatches(header, fieldAliases.productImage) ||
    headerMatches(header, fieldAliases.shopImage)
  );
}

function isProductHeader(header: string) {
  return headerMatches(header, fieldAliases.productName);
}

function isLinkHeader(header: string) {
  const normalized = compactHeader(header);
  return (
    normalized.includes('url') ||
    normalized.includes('link') ||
    normalized.includes('链接') ||
    normalized.includes('详情页') ||
    normalized.includes('地址')
  );
}

function isRevenueHeader(header: string) {
  return (
    headerMatches(header, fieldAliases.revenue) ||
    headerMatches(header, fieldAliases.totalRevenue) ||
    headerMatches(header, fieldAliases.videoTotalRevenue)
  );
}

function isIntegerHeader(header: string) {
  return [
    fieldAliases.rank,
    fieldAliases.shopSales,
    fieldAliases.sales,
    fieldAliases.totalSales,
    fieldAliases.videoViews,
    fieldAliases.videoSales,
    fieldAliases.videoTotalSales,
    fieldAliases.totalViews,
    fieldAliases.totalLikes,
    fieldAliases.totalComments,
  ].some((aliases) => headerMatches(header, aliases));
}

function inferColumnKind(header: string): WorkbookColumnKind {
  if (isRankHeader(header)) return 'rank';
  if (isImageHeader(header)) return 'image';
  if (isLinkHeader(header)) return 'link';
  if (isProductHeader(header)) return 'product';
  return 'text';
}

function columnMinWidth(kind: WorkbookColumnKind) {
  switch (kind) {
    case 'rank':
      return 88;
    case 'image':
      return 104;
    case 'product':
      return 360;
    case 'link':
      return 152;
    default:
      return 156;
  }
}

function buildWorkbookColumns(
  headers: string[],
  rankType: ProductAnalyticsRankType
): WorkbookColumn[] {
  const sourceHeaders = headers.length
    ? headers
    : fallbackWorkbookHeaders[rankType];
  const uniqueHeaders = sourceHeaders
    .map((header) => header.trim())
    .filter(
      (header, index, all) =>
        isVisibleWorkbookHeader(header) &&
        all.findIndex((item) => compactHeader(item) === compactHeader(header)) === index
    );

  if (!uniqueHeaders.some(isRankHeader)) {
    uniqueHeaders.unshift('排名');
  }

  return uniqueHeaders.map((header) => {
    const kind = inferColumnKind(header);
    return {
      header,
      kind,
      minWidth: columnMinWidth(kind),
    };
  });
}

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
  src,
  label,
}: {
  src: string | null;
  label: string;
}) {
  const image = src ? (
    <img src={src} alt="" className="size-full object-cover" />
  ) : (
    <div className="grid size-full place-items-center text-gray-300">
      <PackageOpen className="size-5" />
    </div>
  );

  const content = image;

  const className =
    'relative size-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-100';

  if (!src) {
    return <div className={className}>{content}</div>;
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      title={label}
      className={className}
    >
      {content}
    </a>
  );
}

function cleanCellString(value: unknown) {
  if (value == null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text && text !== '-' ? text : null;
}

function normalizedHref(value: unknown) {
  const text = cleanCellString(value);
  return text && /^https?:\/\//i.test(text) ? text : null;
}

function getFallbackCellValue(
  item: ProductAnalyticsItemDto,
  header: string
) {
  if (headerMatches(header, fieldAliases.rank)) return item.rank;
  if (headerMatches(header, fieldAliases.productImage)) {
    return item.productImageUrl;
  }
  if (headerMatches(header, fieldAliases.productId)) return item.productId;
  if (headerMatches(header, fieldAliases.productName)) return item.productName;
  if (headerMatches(header, fieldAliases.price)) return item.priceText;
  if (headerMatches(header, fieldAliases.region)) return item.region;
  if (headerMatches(header, fieldAliases.shopName)) return item.shopName;
  if (headerMatches(header, fieldAliases.shopImage)) return item.shopImageUrl;
  if (headerMatches(header, fieldAliases.shopSales)) return item.shopSales;
  if (headerMatches(header, fieldAliases.category)) return item.category;
  if (headerMatches(header, fieldAliases.commission)) {
    return item.commissionRateText;
  }
  if (headerMatches(header, fieldAliases.sales)) return item.sales;
  if (headerMatches(header, fieldAliases.salesChange)) {
    return item.salesChangeText;
  }
  if (headerMatches(header, fieldAliases.totalSales)) return item.totalSales;
  if (headerMatches(header, fieldAliases.revenue)) return item.revenueAmount;
  if (headerMatches(header, fieldAliases.totalRevenue)) {
    return item.totalRevenueAmount;
  }
  if (headerMatches(header, fieldAliases.status)) return item.status;
  if (headerMatches(header, fieldAliases.listed)) return item.listedAtText;
  if (headerMatches(header, fieldAliases.fastmossProductUrl)) {
    return item.fastmossProductUrl;
  }
  if (headerMatches(header, fieldAliases.tiktokProductUrl)) {
    return item.tiktokProductUrl;
  }
  if (headerMatches(header, fieldAliases.fastmossShopUrl)) {
    return item.fastmossShopUrl;
  }
  if (headerMatches(header, fieldAliases.videoTitle)) return item.videoTitle;
  if (headerMatches(header, fieldAliases.videoAddress)) {
    return item.rawJson[header];
  }
  if (headerMatches(header, fieldAliases.videoViews)) return item.videoViews;
  if (headerMatches(header, fieldAliases.videoSales)) return item.videoSales;
  if (headerMatches(header, fieldAliases.videoTotalSales)) {
    return item.videoTotalSales;
  }
  if (headerMatches(header, fieldAliases.videoTotalRevenue)) {
    return item.videoTotalRevenueAmount;
  }
  if (headerMatches(header, fieldAliases.totalViews)) return item.totalViews;
  if (headerMatches(header, fieldAliases.totalLikes)) return item.totalLikes;
  if (headerMatches(header, fieldAliases.totalComments)) {
    return item.totalComments;
  }
  return null;
}

function getWorkbookCellValue(
  item: ProductAnalyticsItemDto,
  header: string
) {
  if (Object.prototype.hasOwnProperty.call(item.rawJson, header)) {
    return item.rawJson[header];
  }
  return getFallbackCellValue(item, header);
}

function formatWorkbookValue(
  value: unknown,
  header: string,
  locale: string
) {
  if (value == null || value === '') return '-';
  if (typeof value === 'number') {
    if (isRevenueHeader(header)) return formatCurrency(value, locale);
    if (isIntegerHeader(header)) return formatInteger(value, locale);
    return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US').format(
      value
    );
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function linkLabel(header: string, labels: ProductAnalyticsCopy) {
  const normalized = compactHeader(header);
  if (normalized.includes('fastmoss')) return labels.fastmoss;
  if (normalized.includes('tiktok')) return labels.tiktok;
  return labels.open;
}

function imageFallbackForHeader(
  item: ProductAnalyticsItemDto,
  header: string
) {
  if (headerMatches(header, fieldAliases.shopImage)) return item.shopImageUrl;
  return item.productImageUrl;
}

function WorkbookCell({
  column,
  item,
  labels,
  locale,
}: {
  column: WorkbookColumn;
  item: ProductAnalyticsItemDto;
  labels: ProductAnalyticsCopy;
  locale: string;
}) {
  const value = getWorkbookCellValue(item, column.header);

  if (column.kind === 'rank') {
    return (
      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-gray-100 px-2 text-sm font-bold text-gray-700">
        {formatWorkbookValue(value ?? item.rank, column.header, locale)}
      </span>
    );
  }

  if (column.kind === 'image') {
    return (
      <ProductImage
        src={cleanCellString(value) ?? imageFallbackForHeader(item, column.header)}
        label={column.header}
      />
    );
  }

  if (column.kind === 'link') {
    const href = normalizedHref(value);
    if (!href) return <span className="text-sm text-gray-400">-</span>;
    return <SourceLink href={href} label={linkLabel(column.header, labels)} />;
  }

  if (column.kind === 'product') {
    return (
      <div className="min-w-[320px] max-w-[420px]">
        <div className="line-clamp-3 text-sm font-semibold leading-5 text-gray-950">
          {formatWorkbookValue(value, column.header, locale)}
        </div>
      </div>
    );
  }

  return (
    <span className="block max-w-[220px] whitespace-normal break-words text-sm font-medium leading-5 text-gray-700">
      {formatWorkbookValue(value, column.header, locale)}
    </span>
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
  const workbookColumns = useMemo(
    () => buildWorkbookColumns(data?.headers ?? [], rankType),
    [data?.headers, rankType]
  );
  const tableMinWidth = useMemo(
    () =>
      workbookColumns.reduce(
        (width, column) => width + column.minWidth,
        0
      ),
    [workbookColumns]
  );

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
              <table
                className="w-full text-left"
                style={{ minWidth: tableMinWidth }}
              >
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    {workbookColumns.map((column) => (
                      <th
                        key={column.header}
                        className="px-5 py-3 font-bold"
                        style={{ minWidth: column.minWidth }}
                        title={column.header}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.list.map((item) => (
                    <tr key={item.id} className="align-top">
                      {workbookColumns.map((column) => (
                        <td
                          key={`${item.id}-${column.header}`}
                          className="px-5 py-4"
                        >
                          <WorkbookCell
                            column={column}
                            item={item}
                            labels={labels}
                            locale={locale}
                          />
                        </td>
                      ))}
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
