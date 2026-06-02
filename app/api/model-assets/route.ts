import { type NextRequest, NextResponse } from 'next/server';
import { isLocale } from '@/lib/marketing/content';
import { listModelCatalogAssets } from '@/lib/model-assets/catalog';

export const runtime = 'nodejs';

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const localeParam = searchParams.get('locale') ?? 'pt';
  const locale = isLocale(localeParam) ? localeParam : 'pt';

  try {
    const items = await listModelCatalogAssets({
      locale,
      provider: searchParams.get('provider') ?? 'wanxiang',
      limit: parsePositiveInteger(searchParams.get('limit'), 24),
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to list model assets', error);
    return NextResponse.json(
      { error: 'Failed to list model assets' },
      { status: 500 }
    );
  }
}
