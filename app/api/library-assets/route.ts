import { type NextRequest, NextResponse } from 'next/server';
import { publicCatalogReadHeaders } from '@/lib/http/cache-control';
import {
  LIBRARY_ASSET_CATEGORIES,
  type LibraryAssetCategory,
} from '@/lib/db/schema';
import { listLibraryAssets } from '@/lib/library-assets/query';

export const runtime = 'nodejs';

const libraryAssetCategories = new Set<string>(LIBRARY_ASSET_CATEGORIES);

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const categoryParam = searchParams.get('category');

  try {
    const result = await listLibraryAssets({
      page: parsePositiveInteger(searchParams.get('page'), 1),
      pageSize: parsePositiveInteger(searchParams.get('pageSize'), 12),
      category:
        categoryParam && libraryAssetCategories.has(categoryParam)
          ? (categoryParam as LibraryAssetCategory)
          : undefined,
    });

    return NextResponse.json(result, { headers: publicCatalogReadHeaders });
  } catch (error) {
    console.error('Failed to list library assets', error);
    return NextResponse.json(
      { error: 'Failed to list library assets' },
      { status: 500 }
    );
  }
}
