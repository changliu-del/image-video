import { type NextRequest, NextResponse } from 'next/server';
import {
  GENERATION_TYPES,
  LIBRARY_ASSET_KINDS,
  type GenerationType,
  type LibraryAssetKind,
} from '@/lib/db/schema';
import {
  listPublishedLibraryAssets,
} from '@/lib/library-assets/query';
import { isLocale } from '@/lib/marketing/content';

export const runtime = 'nodejs';

const publicReadHeaders = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
};

const libraryAssetKinds = new Set<string>(LIBRARY_ASSET_KINDS);
const generationTypes = new Set<string>(GENERATION_TYPES);

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const localeParam = searchParams.get('locale') ?? 'pt';
  const locale = isLocale(localeParam) ? localeParam : 'pt';
  const kindParam = searchParams.get('kind');
  const useCaseParam = searchParams.get('useCase');
  const tags = searchParams
    .getAll('tag')
    .concat(searchParams.get('tags')?.split(',') ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean);

  try {
    const result = await listPublishedLibraryAssets({
      locale,
      page: parsePositiveInteger(searchParams.get('page'), 1),
      pageSize: parsePositiveInteger(searchParams.get('pageSize'), 12),
      kind:
        kindParam && libraryAssetKinds.has(kindParam)
          ? (kindParam as LibraryAssetKind)
          : undefined,
      useCase:
        useCaseParam && generationTypes.has(useCaseParam)
          ? (useCaseParam as GenerationType)
          : undefined,
      tags,
    });

    return NextResponse.json(result, { headers: publicReadHeaders });
  } catch (error) {
    console.error('Failed to list library assets', error);
    return NextResponse.json(
      { error: 'Failed to list library assets' },
      { status: 500 }
    );
  }
}
