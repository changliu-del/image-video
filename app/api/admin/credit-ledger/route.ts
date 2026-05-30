import { NextRequest, NextResponse } from 'next/server';
import { listCredits } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';

export async function GET(req: NextRequest) {
  const { page, pageSize } = parsePagination(req.nextUrl.searchParams);
  return NextResponse.json(await listCredits({ page, pageSize }));
}
