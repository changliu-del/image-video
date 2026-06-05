import 'server-only';

import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  libraryAssets,
  type Asset,
  type LibraryAsset,
  type LibraryAssetCategory,
} from '@/lib/db/schema';

export type LibraryAssetCatalogItem = {
  id: string;
  assetId: string;
  title: string;
  description: string | null;
  category: LibraryAssetCategory;
  assetUrl: string;
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  publicUrl: string;
  mimeType: string | null;
  sortWeight: number;
  usageCount: number;
};

export type ListLibraryAssetsInput = {
  page?: number;
  pageSize?: number;
  category?: LibraryAssetCategory;
};

export type LibraryAssetsResult = {
  items: LibraryAssetCatalogItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function normalizePage(value: number | undefined) {
  if (!Number.isInteger(value) || !value || value < 1) {
    return 1;
  }

  return value;
}

function normalizePageSize(value: number | undefined) {
  if (!Number.isInteger(value) || !value) {
    return 12;
  }

  return Math.min(48, Math.max(1, value));
}

function mapLibraryAssetRecord(input: {
  asset: Asset;
  libraryAsset: LibraryAsset;
}): LibraryAssetCatalogItem {
  const { asset, libraryAsset } = input;
  const isVideo = asset.mimeType?.startsWith('video/') ?? false;

  return {
    id: libraryAsset.id,
    assetId: libraryAsset.assetId,
    title: libraryAsset.title,
    description: libraryAsset.description,
    category: libraryAsset.category,
    assetUrl: asset.publicUrl,
    imageUrl: isVideo ? null : asset.publicUrl,
    videoUrl: isVideo ? asset.publicUrl : null,
    thumbnailUrl: isVideo ? null : asset.publicUrl,
    publicUrl: asset.publicUrl,
    mimeType: asset.mimeType,
    sortWeight: libraryAsset.sortWeight,
    usageCount: libraryAsset.usageCount,
  };
}

function buildWhere(input: {
  category?: LibraryAssetCategory;
}) {
  const conditions = [eq(assets.status, 'uploaded' as const)];

  if (input.category) {
    conditions.push(eq(libraryAssets.category, input.category));
  }

  return sql.join(conditions, sql` and `);
}

export async function listLibraryAssets(
  input: ListLibraryAssetsInput
): Promise<LibraryAssetsResult> {
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);
  const where = buildWhere({
    category: input.category,
  });

  const [rows, totalRows] = await Promise.all([
    db
      .select({ libraryAsset: libraryAssets, asset: assets })
      .from(libraryAssets)
      .innerJoin(assets, eq(libraryAssets.assetId, assets.id))
      .where(where)
      .orderBy(
        desc(libraryAssets.sortWeight),
        desc(libraryAssets.updatedAt)
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(libraryAssets)
      .innerJoin(assets, eq(libraryAssets.assetId, assets.id))
      .where(where),
  ]);

  const total = Number(totalRows[0]?.count ?? 0);

  return {
    items: rows.map(mapLibraryAssetRecord),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}
