import { type NextRequest, NextResponse } from 'next/server';
import {
  listAdminUserMedia,
  softDeleteAdminUserMedia,
  updateAdminUserMedia,
} from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import { adminRouteError, readJsonBody } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { search, page, pageSize } = parsePagination(
      searchParams
    );
    return NextResponse.json(
      await listAdminUserMedia({
        search,
        page,
        pageSize,
        userEmail: searchParams.get('userEmail') ?? '',
        assetId:
          searchParams.get('assetId') ??
          searchParams.get('materialId') ??
          '',
      })
    );
  } catch (error) {
    return adminRouteError(error, 'Failed to list user media');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const { id, ...data } = body;
    if (typeof id !== 'string') {
      throw new Error('id required');
    }

    return NextResponse.json(await updateAdminUserMedia(id, data));
  } catch (error) {
    return adminRouteError(error, 'Failed to update user media');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    if (typeof body.id !== 'string') {
      throw new Error('id required');
    }

    await softDeleteAdminUserMedia(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return adminRouteError(error, 'Failed to delete user media');
  }
}
