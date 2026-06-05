import { type NextRequest, NextResponse } from 'next/server';
import {
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
