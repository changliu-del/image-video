import * as XLSX from 'xlsx';
import type { ProductAnalyticsRankType } from './catalog';

export type ParsedProductAnalyticsItem = {
  rankType: ProductAnalyticsRankType;
  rank: number;
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
  revenueAmount: string | null;
  totalRevenueAmount: string | null;
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
  videoTotalRevenueAmount: string | null;
  totalViews: number | null;
  totalLikes: number | null;
  totalComments: number | null;
  rawJson: Record<string, unknown>;
};

export type ParsedProductAnalyticsWorkbook = {
  sheetName: string;
  headers: string[];
  items: ParsedProductAnalyticsItem[];
};

type RawWorkbookRow = Record<string, unknown>;

const PRODUCT_ID_RE = /(?:product\/|detail\/)(\d{8,})/i;

function cleanText(value: unknown) {
  if (value == null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text : null;
}

function readValue(row: RawWorkbookRow, aliases: readonly string[]) {
  for (const alias of aliases) {
    if (alias in row) {
      const value = cleanText(row[alias]);
      if (value != null) return value;
    }
  }

  return null;
}

function readAnyValue(row: RawWorkbookRow, aliases: readonly string[]) {
  for (const alias of aliases) {
    if (alias in row) return row[alias];
  }

  return null;
}

function normalizeNumericText(value: unknown) {
  const text = cleanText(value);
  if (!text || text === '-') return null;
  const stripped = text.replace(/[^\d,.-]/g, '');
  if (!stripped || stripped === '-' || stripped === '.' || stripped === ',') {
    return null;
  }

  const lastComma = stripped.lastIndexOf(',');
  const lastDot = stripped.lastIndexOf('.');
  let normalized = stripped;

  if (lastComma > -1 && lastDot > -1) {
    const decimalSep = lastComma > lastDot ? ',' : '.';
    const thousandsSep = decimalSep === ',' ? '.' : ',';
    normalized = stripped
      .replace(new RegExp(`\\${thousandsSep}`, 'g'), '')
      .replace(decimalSep, '.');
  } else if (lastComma > -1) {
    const decimals = stripped.length - lastComma - 1;
    normalized =
      decimals > 0 && decimals <= 2
        ? stripped.replace(',', '.')
        : stripped.replace(/,/g, '');
  } else {
    normalized = stripped.replace(/,/g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: unknown) {
  const parsed = normalizeNumericText(value);
  return parsed == null ? null : Math.round(parsed);
}

function parseDecimal(value: unknown) {
  const parsed = normalizeNumericText(value);
  return parsed == null ? null : parsed.toFixed(2);
}

function normalizeRawValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  if (value == null) return null;
  return value;
}

function normalizeRawJson(row: RawWorkbookRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, normalizeRawValue(value)])
  );
}

function deriveProductId(row: RawWorkbookRow) {
  const explicit = readValue(row, ['商品ID', 'Product ID']);
  if (explicit) return explicit;

  const url = readValue(row, [
    'TikTok 官网商品详情页',
    'TikTok官网商品详情页',
    'TikTok商品链接',
    'FastMoss 商品详情页',
    'FastMoss商品详情页',
    'FastMoss商品详情页链接',
  ]);
  const match = url?.match(PRODUCT_ID_RE);
  return match?.[1] ?? null;
}

function parseRank(row: RawWorkbookRow, fallback: number) {
  return parseInteger(readAnyValue(row, ['排名', 'Rank'])) ?? fallback;
}

function parseProductAnalyticsRow(
  row: RawWorkbookRow,
  rankType: ProductAnalyticsRankType,
  rowIndex: number
): ParsedProductAnalyticsItem | null {
  const productName = readValue(row, ['商品名称', '商品标题', 'Product name']);
  if (!productName) return null;

  const sales = parseInteger(
    readAnyValue(row, [
      '销量',
      rankType === 'video-products' ? '视频销量' : '',
    ])
  );
  const totalSales = parseInteger(
    readAnyValue(row, [
      '总销量',
      rankType === 'video-products' ? '视频总销量' : '',
    ])
  );

  return {
    rankType,
    rank: parseRank(row, rowIndex + 1),
    productId: deriveProductId(row),
    productName,
    productImageUrl: readValue(row, [
      '商品图片',
      '商品封面',
      '商品封面链接',
      'Product image',
    ]),
    priceText: readValue(row, ['商品售价', '售价', 'Price']),
    region: readValue(row, ['国家/地区', 'Region']),
    shopName: readValue(row, ['店铺名', '所属店铺', '所属店铺名称', 'Shop']),
    shopImageUrl: readValue(row, ['店铺封面', 'Shop image']),
    shopSales: parseInteger(
      readAnyValue(row, ['店铺总销量', '店铺销量', 'Shop sales'])
    ),
    category: readValue(row, ['商品分类', 'Category']),
    commissionRateText: readValue(row, ['佣金比例', 'Commission']),
    sales,
    salesChangeText: readValue(row, ['销量环比', 'Sales change']),
    totalSales,
    revenueAmount: parseDecimal(readAnyValue(row, ['销售额', 'Revenue'])),
    totalRevenueAmount: parseDecimal(
      readAnyValue(row, ['总销售额', '视频总销售额', 'Total revenue'])
    ),
    status: readValue(row, ['商品状态', 'Status']),
    listedAtText: readValue(row, ['预估商品上架时间', 'Listed at']),
    fastmossProductUrl: readValue(row, [
      'FastMoss 商品详情页',
      'FastMoss商品详情页',
      'FastMoss商品详情页链接',
    ]),
    tiktokProductUrl: readValue(row, [
      'TikTok 官网商品详情页',
      'TikTok官网商品详情页',
      'TikTok商品链接',
    ]),
    fastmossShopUrl: readValue(row, [
      'FastMoss 店铺详情页',
      'FastMoss店铺详情页',
    ]),
    videoTitle: readValue(row, ['视频标题', 'Video title']),
    videoUrl: readValue(row, ['视频地址', 'Video URL']),
    videoViews: parseInteger(readAnyValue(row, ['视频播放量', 'Video views'])),
    videoSales: parseInteger(readAnyValue(row, ['视频销量', 'Video sales'])),
    videoTotalSales: parseInteger(
      readAnyValue(row, ['视频总销量', 'Video total sales'])
    ),
    videoTotalRevenueAmount: parseDecimal(
      readAnyValue(row, ['视频总销售额', 'Video total revenue'])
    ),
    totalViews: parseInteger(readAnyValue(row, ['总播放量', 'Total views'])),
    totalLikes: parseInteger(readAnyValue(row, ['总点赞量', '总点赞数'])),
    totalComments: parseInteger(readAnyValue(row, ['总评论数'])),
    rawJson: normalizeRawJson(row),
  };
}

export function parseProductAnalyticsWorkbook(
  buffer: Buffer,
  rankType: ProductAnalyticsRankType
): ParsedProductAnalyticsWorkbook {
  const workbook = XLSX.read(buffer, {
    cellDates: false,
    raw: false,
    type: 'buffer',
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Workbook has no sheets');
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<RawWorkbookRow>(sheet, {
    defval: null,
    raw: false,
  });
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const items = rows
    .map((row, index) => parseProductAnalyticsRow(row, rankType, index))
    .filter((item): item is ParsedProductAnalyticsItem => Boolean(item));

  if (items.length === 0) {
    throw new Error('No product rows found in workbook');
  }

  return { sheetName, headers, items };
}
