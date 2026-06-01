import { type NextRequest, NextResponse } from 'next/server';
import { isLocale } from '@/lib/marketing/content';
import { listPublishedTemplates } from '@/lib/templates/query';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get('locale') ?? 'pt';
  const locale = isLocale(localeParam) ? localeParam : 'pt';

  try {
    const list = await listPublishedTemplates(locale);
    return NextResponse.json({ list });
  } catch (error) {
    console.error('Failed to list templates', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}
