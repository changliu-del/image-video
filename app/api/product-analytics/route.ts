import { type NextRequest, NextResponse } from 'next/server';
import { parsePagination } from '@/lib/admin/services/shared';
import { normalizeProductAnalyticsRank } from '@/lib/product-analytics/catalog';
import { listActiveProductAnalyticsItems } from '@/lib/product-analytics/query';

export async function GET(request: NextRequest) {
  const { search, page, pageSize } = parsePagination(
    request.nextUrl.searchParams
  );
  const rankType = normalizeProductAnalyticsRank(
    request.nextUrl.searchParams.get('rankType')
  );

  return NextResponse.json(
    await listActiveProductAnalyticsItems({
      rankType,
      search,
      page,
      pageSize,
    }),
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
