import 'server-only';

import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  libraryAssets,
  type Asset,
  type GenerationType,
  type LibraryAsset,
  type LibraryAssetKind,
} from '@/lib/db/schema';
import type { Locale } from '@/lib/marketing/content';

export type LibraryAssetCatalogItem = {
  id: string;
  assetId: string;
  locale: Locale;
  title: string;
  description: string | null;
  kind: LibraryAssetKind;
  assetUrl: string;
  imageUrl: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  publicUrl: string;
  mimeType: string | null;
  tags: string[];
  useCases: GenerationType[];
  qualityScore: number;
  sortWeight: number;
  usageCount: number;
};

export type ListPublishedLibraryAssetsInput = {
  locale: Locale;
  page?: number;
  pageSize?: number;
  kind?: LibraryAssetKind;
  useCase?: GenerationType;
  tags?: string[];
};

export type PublishedLibraryAssetsResult = {
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

function normalizeTags(tags: string[] | undefined) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag) => /^[a-z0-9][a-z0-9_-]*$/.test(tag))
    )
  ).slice(0, 12);
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
    locale: libraryAsset.locale as Locale,
    title: libraryAsset.title,
    description: libraryAsset.description,
    kind: libraryAsset.kind,
    assetUrl: asset.publicUrl,
    imageUrl: isVideo ? null : asset.publicUrl,
    videoUrl: isVideo ? asset.publicUrl : null,
    thumbnailUrl: isVideo ? null : asset.publicUrl,
    publicUrl: asset.publicUrl,
    mimeType: asset.mimeType,
    tags: libraryAsset.tagsJson,
    useCases: libraryAsset.useCasesJson,
    qualityScore: libraryAsset.qualityScore,
    sortWeight: libraryAsset.sortWeight,
    usageCount: libraryAsset.usageCount,
  };
}

function buildWhere(input: {
  kind?: LibraryAssetKind;
  locale: Locale;
  tags: string[];
  useCase?: GenerationType;
}) {
  const conditions = [
    eq(libraryAssets.locale, input.locale),
    eq(libraryAssets.status, 'published' as const),
    eq(assets.status, 'uploaded' as const),
  ];

  if (input.kind) {
    conditions.push(eq(libraryAssets.kind, input.kind));
  }

  if (input.useCase) {
    conditions.push(sql`${libraryAssets.useCasesJson} ? ${input.useCase}`);
  }

  for (const tag of input.tags) {
    conditions.push(sql`${libraryAssets.tagsJson} ? ${tag}`);
  }

  return sql.join(conditions, sql` and `);
}

export async function listPublishedLibraryAssets(
  input: ListPublishedLibraryAssetsInput
): Promise<PublishedLibraryAssetsResult> {
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);
  const where = buildWhere({
    locale: input.locale,
    kind: input.kind,
    useCase: input.useCase,
    tags: normalizeTags(input.tags),
  });

  const [rows, totalRows] = await Promise.all([
    db
      .select({ libraryAsset: libraryAssets, asset: assets })
      .from(libraryAssets)
      .innerJoin(assets, eq(libraryAssets.assetId, assets.id))
      .where(where)
      .orderBy(
        desc(libraryAssets.sortWeight),
        desc(libraryAssets.qualityScore),
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
