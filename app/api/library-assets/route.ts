import { type NextRequest, NextResponse } from 'next/server';
import { publicCatalogReadHeaders } from '@/lib/http/cache-control';
import { parseLibraryAssetCategoryParam } from '@/lib/library-assets/categories';
import { listLibraryAssets } from '@/lib/library-assets/query';

export const runtime = 'nodejs';

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = parseLibraryAssetCategoryParam(searchParams.get('category'));

  if (!category.ok) {
    return NextResponse.json(
      { error: 'Invalid library asset category' },
      { status: 400 }
    );
  }

  try {
    const result = await listLibraryAssets({
      page: parsePositiveInteger(searchParams.get('page'), 1),
      pageSize: parsePositiveInteger(searchParams.get('pageSize'), 12),
      category: category.category,
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
