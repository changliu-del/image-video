import { type NextRequest, NextResponse } from 'next/server';
import {
  createTemplate,
  listAdminTemplates,
} from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import { adminRouteError, readJsonBody } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const { search, page, pageSize } = parsePagination(
      request.nextUrl.searchParams
    );
    return NextResponse.json(
      await listAdminTemplates({ search, page, pageSize })
    );
  } catch (error) {
    return adminRouteError(error, 'Failed to list templates');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    return NextResponse.json(await createTemplate(body), { status: 201 });
  } catch (error) {
    return adminRouteError(error, 'Failed to create template');
  }
}
