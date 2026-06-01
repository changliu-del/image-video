import { type NextRequest, NextResponse } from 'next/server';
import { listAssets, removeAsset, updateAsset } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import { adminRouteError, readJsonBody } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const { search, page, pageSize } = parsePagination(
      request.nextUrl.searchParams
    );
    return NextResponse.json(await listAssets({ search, page, pageSize }));
  } catch (error) {
    return adminRouteError(error, 'Failed to list assets');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const { id, ...data } = body;
    if (typeof id !== 'string') {
      throw new Error('id required');
    }

    return NextResponse.json(await updateAsset(id, data));
  } catch (error) {
    return adminRouteError(error, 'Failed to update asset');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    if (typeof body.id !== 'string') {
      throw new Error('id required');
    }

    await removeAsset(body.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return adminRouteError(error, 'Failed to delete asset');
  }
}
