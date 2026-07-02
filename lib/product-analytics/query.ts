import { and, asc, count, desc, eq, isNotNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  productAnalyticsActiveBatches,
  productAnalyticsBatches,
  productAnalyticsItems,
} from '@/lib/db/schema';
import type { ProductAnalyticsRankType } from '@/lib/product-analytics/catalog';

export type ProductAnalyticsItemDto = {
  id: number;
  rank: number;
  rankType: ProductAnalyticsRankType;
  productId: string | null;
  productName: string;
  productImageUrl: string | null;
  priceText: string | null;
  region: string | null;
  shopName: string | null;
  shopImageUrl: string | null;
  shopSales: number | null;
  category: string | null;
  commissionRateText: string | null;
  sales: number | null;
  salesChangeText: string | null;
  totalSales: number | null;
  revenueAmount: number | null;
  totalRevenueAmount: number | null;
  status: string | null;
  listedAtText: string | null;
  fastmossProductUrl: string | null;
  tiktokProductUrl: string | null;
  fastmossShopUrl: string | null;
  videoTitle: string | null;
  videoUrl: string | null;
  videoViews: number | null;
  videoSales: number | null;
  videoTotalSales: number | null;
  videoTotalRevenueAmount: number | null;
  totalViews: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  rawJson: Record<string, unknown>;
};

export type ProductAnalyticsListResponse = {
  list: ProductAnalyticsItemDto[];
  headers: string[];
  categories: string[];
  activeCategory: string | null;
  total: number;
  page: number;
  pageSize: number;
  batch: {
    id: number;
    sourceFileName: string;
    rowCount: number;
    importedAt: string;
  } | null;
};

function numberFromDb(value: unknown) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function itemToDto(
  row: typeof productAnalyticsItems.$inferSelect
): ProductAnalyticsItemDto {
  return {
    id: row.id,
    rank: row.rank,
    rankType: row.rankType,
    productId: row.productId,
    productName: row.productName,
    productImageUrl: row.productImageUrl,
    priceText: row.priceText,
    region: row.region,
    shopName: row.shopName,
    shopImageUrl: row.shopImageUrl,
    shopSales: row.shopSales,
    category: row.category,
    commissionRateText: row.commissionRateText,
    sales: row.sales,
    salesChangeText: row.salesChangeText,
    totalSales: row.totalSales,
    revenueAmount: numberFromDb(row.revenueAmount),
    totalRevenueAmount: numberFromDb(row.totalRevenueAmount),
    status: row.status,
    listedAtText: row.listedAtText,
    fastmossProductUrl: row.fastmossProductUrl,
    tiktokProductUrl: row.tiktokProductUrl,
    fastmossShopUrl: row.fastmossShopUrl,
    videoTitle: row.videoTitle,
    videoUrl: row.videoUrl,
    videoViews: row.videoViews,
    videoSales: row.videoSales,
    videoTotalSales: row.videoTotalSales,
    videoTotalRevenueAmount: numberFromDb(row.videoTotalRevenueAmount),
    totalViews: row.totalViews,
    totalLikes: row.totalLikes,
    totalComments: row.totalComments,
    rawJson: row.rawJson,
  };
}

function headersFromMetadata(metadata: Record<string, unknown> | null) {
  const headers = metadata?.headers;
  if (!Array.isArray(headers)) return [];
  return headers
    .map((header) => (typeof header === 'string' ? header.trim() : ''))
    .filter(
      (header, index, all) =>
        header &&
        !/^__EMPTY(?:_\d+)?$/i.test(header) &&
        all.indexOf(header) === index
    );
}

export async function listActiveProductAnalyticsItems({
  category = '',
  page,
  pageSize,
  rankType,
}: {
  category?: string;
  page: number;
  pageSize: number;
  rankType: ProductAnalyticsRankType;
}): Promise<ProductAnalyticsListResponse> {
  const [active] = await db
    .select({
      batchId: productAnalyticsActiveBatches.batchId,
      sourceFileName: productAnalyticsBatches.sourceFileName,
      rowCount: productAnalyticsBatches.rowCount,
      importedAt: productAnalyticsBatches.createdAt,
      metadataJson: productAnalyticsBatches.metadataJson,
    })
    .from(productAnalyticsActiveBatches)
    .innerJoin(
      productAnalyticsBatches,
      eq(productAnalyticsActiveBatches.batchId, productAnalyticsBatches.id)
    )
    .where(eq(productAnalyticsActiveBatches.rankType, rankType))
    .limit(1);

  if (!active) {
    return {
      list: [],
      headers: [],
      categories: [],
      activeCategory: null,
      total: 0,
      page,
      pageSize,
      batch: null,
    };
  }

  const normalizedCategory = sql<string>`trim(${productAnalyticsItems.category})`;
  const categoryRows = await db
    .select({
      name: normalizedCategory,
      value: count(),
    })
    .from(productAnalyticsItems)
    .where(
      and(
        eq(productAnalyticsItems.batchId, active.batchId),
        isNotNull(productAnalyticsItems.category),
        sql`length(trim(${productAnalyticsItems.category})) > 0`
      )
    )
    .groupBy(normalizedCategory)
    .orderBy(desc(count()), asc(normalizedCategory));
  const categories = categoryRows
    .map((row) => row.name.trim())
    .filter((name, index, names) => name && names.indexOf(name) === index);
  const requestedCategory = category.trim();
  const activeCategory = categories.includes(requestedCategory)
    ? requestedCategory
    : null;

  const filters = [eq(productAnalyticsItems.batchId, active.batchId)];
  if (activeCategory) {
    filters.push(sql`trim(${productAnalyticsItems.category}) = ${activeCategory}`);
  }
  const whereClause = and(...filters);

  const [{ value: totalValue } = { value: 0 }] = await db
    .select({ value: count() })
    .from(productAnalyticsItems)
    .where(whereClause);

  const rows = await db
    .select()
    .from(productAnalyticsItems)
    .where(whereClause)
    .orderBy(asc(productAnalyticsItems.rank), asc(productAnalyticsItems.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    list: rows.map(itemToDto),
    headers: headersFromMetadata(active.metadataJson),
    categories,
    activeCategory,
    total: totalValue,
    page,
    pageSize,
    batch: {
      id: active.batchId,
      sourceFileName: active.sourceFileName,
      rowCount: active.rowCount,
      importedAt: active.importedAt.toISOString(),
    },
  };
}
