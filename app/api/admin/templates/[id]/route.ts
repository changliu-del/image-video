import { type NextRequest, NextResponse } from 'next/server';
import {
  archiveTemplate,
  publishTemplate,
  removeTemplate,
  updateTemplate,
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
    return NextResponse.json(await updateTemplate(id, body));
  } catch (error) {
    return adminRouteError(error, 'Failed to update template');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    await removeTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return adminRouteError(error, 'Failed to delete template');
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const body = (await readJsonBody(request)) as { action?: unknown };
    if (body.action === 'publish') {
      return NextResponse.json(await publishTemplate(id));
    }
    if (body.action === 'archive') {
      return NextResponse.json(await archiveTemplate(id));
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return adminRouteError(error, 'Failed to update template status');
  }
}
