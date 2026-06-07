import { type NextRequest, NextResponse } from 'next/server';
import { templateCatalogReadHeaders } from '@/lib/http/cache-control';
import { listPublishedTemplates } from '@/lib/templates/query';
import {
  templateTypes,
  type TemplateType,
} from '@/lib/templates/catalog';

export const runtime = 'nodejs';

const templateTypeSet = new Set<TemplateType>(templateTypes);

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeTemplateType(value: string | null) {
  return value && templateTypeSet.has(value as TemplateType)
    ? (value as TemplateType)
    : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const rawType = normalizeTemplateType(searchParams.get('type'));
  const rawCategory = searchParams.get('category');
  const legacyCategoryType = normalizeTemplateType(rawCategory);
  const type = rawType ?? legacyCategoryType ?? 'image_to_video';
  const category = legacyCategoryType ? undefined : rawCategory ?? undefined;

  try {
    const result = await listPublishedTemplates({
      page: parsePositiveInteger(searchParams.get('page'), 1),
      pageSize: parsePositiveInteger(searchParams.get('pageSize'), 12),
      locale: searchParams.get('locale') ?? undefined,
      search: searchParams.get('search') ?? '',
      type,
      category,
    });
    return NextResponse.json(result, { headers: templateCatalogReadHeaders });
  } catch (error) {
    console.error('Failed to list templates', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}
