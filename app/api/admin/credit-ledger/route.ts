import { type NextRequest, NextResponse } from 'next/server';
import { listCredits, updateCreditLedgerEntry } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import { adminRouteError, readJsonBody } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const { search, page, pageSize } = parsePagination(
      request.nextUrl.searchParams
    );
    return NextResponse.json(
      await listCredits({
        search,
        page,
        pageSize,
        userId: request.nextUrl.searchParams.get('userId') ?? '',
        jobId: request.nextUrl.searchParams.get('jobId') ?? '',
        createdAt:
          request.nextUrl.searchParams.get('createdAt') ??
          request.nextUrl.searchParams.get('created') ??
          '',
      })
    );
  } catch (error) {
    return adminRouteError(error, 'Failed to list credit ledger');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const { id, ...data } = body;
    if (typeof id !== 'string') {
      throw new Error('id required');
    }

    return NextResponse.json(await updateCreditLedgerEntry(id, data));
  } catch (error) {
    return adminRouteError(error, 'Failed to update credit ledger entry');
  }
}
