import { type NextRequest, NextResponse } from 'next/server';
import { listJobs, removeJob, updateJob } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import { adminRouteError, readJsonBody } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { search, page, pageSize } = parsePagination(
      searchParams
    );
    return NextResponse.json(
      await listJobs({
        search,
        page,
        pageSize,
        genId: searchParams.get('genId') ?? searchParams.get('id') ?? '',
      })
    );
  } catch (error) {
    return adminRouteError(error, 'Failed to list generation jobs');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const { id, ...data } = body;
    if (typeof id !== 'string') {
      throw new Error('id required');
    }

    return NextResponse.json(await updateJob(id, data));
  } catch (error) {
    return adminRouteError(error, 'Failed to update generation job');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    if (typeof body.id !== 'string') {
      throw new Error('id required');
    }

    await removeJob(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return adminRouteError(error, 'Failed to delete generation job');
  }
}
