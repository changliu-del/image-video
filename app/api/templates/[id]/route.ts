import { type NextRequest, NextResponse } from 'next/server';
import { templateCatalogReadHeaders } from '@/lib/http/cache-control';
import { getTemplateDetail } from '@/lib/templates/query';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const template = await getTemplateDetail(
      id,
      request.nextUrl.searchParams.get('locale')
    );

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404, headers: templateCatalogReadHeaders }
      );
    }

    return NextResponse.json(template, { headers: templateCatalogReadHeaders });
  } catch (error) {
    console.error('Failed to load template detail', error);
    return NextResponse.json(
      { error: 'Failed to load template detail' },
      { status: 500 }
    );
  }
}
