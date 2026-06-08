import { type NextRequest, NextResponse } from 'next/server';
import {
  listAdminTemplateOrder,
  updateAdminTemplateOrder,
} from '@/lib/admin/services';
import { adminRouteError, readJsonBody } from '../../_utils';

function readTemplateOrderParams(request: NextRequest) {
  return {
    type: request.nextUrl.searchParams.get('type'),
    category: request.nextUrl.searchParams.get('category'),
  };
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await listAdminTemplateOrder(readTemplateOrderParams(request))
    );
  } catch (error) {
    return adminRouteError(error, 'Failed to list template order');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    return NextResponse.json(await updateAdminTemplateOrder(body));
  } catch (error) {
    return adminRouteError(error, 'Failed to update template order');
  }
}
