import { type NextRequest, NextResponse } from 'next/server';
import { listCredits, updateCreditLedgerEntry } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import { adminRouteError, readJsonBody } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { search, page, pageSize } = parsePagination(
      searchParams
    );
    return NextResponse.json(
      await listCredits({
        search,
        page,
        pageSize,
        userId: searchParams.get('userId') ?? '',
        userEmail:
          searchParams.get('userEmail') ?? searchParams.get('email') ?? '',
        jobId: searchParams.get('jobId') ?? '',
        createdAt:
          searchParams.get('createdAt') ??
          searchParams.get('created') ??
          '',
        createdFrom:
          searchParams.get('createdFrom') ??
          searchParams.get('from') ??
          searchParams.get('startDate') ??
          '',
        createdTo:
          searchParams.get('createdTo') ??
          searchParams.get('to') ??
          searchParams.get('endDate') ??
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
