import { type NextRequest, NextResponse } from 'next/server';
import { publicCatalogReadHeaders } from '@/lib/http/cache-control';
import { isLocale } from '@/lib/marketing/content';
import {
  listPublishedTemplates,
  type PublishedTemplateSort,
} from '@/lib/templates/query';
import type { TemplateType } from '@/lib/templates/catalog';

export const runtime = 'nodejs';

const templateTypes = new Set<TemplateType>(['image', 'image_to_video', 'video']);
const sortKeys = new Set<PublishedTemplateSort>([
  'featured',
  'newest',
  'lowCost',
]);

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const localeParam = searchParams.get('locale') ?? 'pt';
  const locale = isLocale(localeParam) ? localeParam : 'pt';
  const rawType = searchParams.get('type');
  const rawSort = searchParams.get('sort');
  const tags = searchParams
    .getAll('tag')
    .concat(searchParams.get('tags')?.split(',') ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean);

  try {
    const result = await listPublishedTemplates({
      locale,
      page: parsePositiveInteger(searchParams.get('page'), 1),
      pageSize: parsePositiveInteger(searchParams.get('pageSize'), 12),
      search: searchParams.get('search') ?? '',
      type:
        rawType && templateTypes.has(rawType as TemplateType)
          ? (rawType as TemplateType)
          : undefined,
      tags,
      sort:
        rawSort && sortKeys.has(rawSort as PublishedTemplateSort)
          ? (rawSort as PublishedTemplateSort)
          : 'featured',
    });
    return NextResponse.json(result, { headers: publicCatalogReadHeaders });
  } catch (error) {
    console.error('Failed to list templates', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}
