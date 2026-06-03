import { type NextRequest, NextResponse } from 'next/server';
import {
  archiveLibraryAsset,
  publishLibraryAsset,
  removeLibraryAsset,
  updateLibraryAsset,
} from '@/lib/admin/services';
import { adminRouteError, readJsonBody } from '../../_utils';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = await readJsonBody(request);
    return NextResponse.json(await updateLibraryAsset(id, body));
  } catch (error) {
    return adminRouteError(error, 'Failed to update library asset');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    await removeLibraryAsset(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return adminRouteError(error, 'Failed to delete library asset');
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = (await readJsonBody(request)) as { action?: unknown };
    if (body.action === 'publish') {
      return NextResponse.json(await publishLibraryAsset(id));
    }
    if (body.action === 'archive') {
      return NextResponse.json(await archiveLibraryAsset(id));
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return adminRouteError(error, 'Failed to update library asset status');
  }
}
