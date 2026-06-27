import { type NextRequest, NextResponse } from 'next/server';
import { modelAssetsReadHeaders } from '@/lib/http/cache-control';
import { isLocale } from '@/lib/marketing/content';
import { listModelTemplates } from '@/lib/model-assets/catalog';

export const runtime = 'nodejs';

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalSearchParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)?.trim();
  return value ? value : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const localeParam = searchParams.get('locale') ?? 'en';
  const locale = isLocale(localeParam) ? localeParam : 'en';

  try {
    const items = await listModelTemplates({
      age: optionalSearchParam(searchParams, 'age'),
      gender: optionalSearchParam(searchParams, 'gender'),
      locale,
      limit: parsePositiveInteger(searchParams.get('limit'), 24),
      style: optionalSearchParam(searchParams, 'style'),
    });

    return NextResponse.json({ items }, { headers: modelAssetsReadHeaders });
  } catch (error) {
    console.error('Failed to list model assets', error);
    return NextResponse.json(
      { error: 'Failed to list model assets' },
      { status: 500 }
    );
  }
}
