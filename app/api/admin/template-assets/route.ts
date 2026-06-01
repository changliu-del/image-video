import { type NextRequest, NextResponse } from 'next/server';
import { listTemplateAssets } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import { adminRouteError } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const { search, page, pageSize } = parsePagination(
      request.nextUrl.searchParams
    );
    return NextResponse.json(
      await listTemplateAssets({ search, page, pageSize })
    );
  } catch (error) {
    return adminRouteError(error, 'Failed to list template assets');
  }
}
