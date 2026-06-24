import { type NextRequest, NextResponse } from 'next/server';
import {
  createTemplate,
  listAdminTemplates,
} from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import { adminRouteError, readJsonBody } from '../_utils';
import {
  templateTypes,
  type TemplateType,
} from '@/lib/templates/catalog';

const templateTypeSet = new Set<TemplateType>(templateTypes);

function normalizeTemplateType(value: string | null) {
  return value && templateTypeSet.has(value as TemplateType)
    ? (value as TemplateType)
    : undefined;
}

function optionalSearchParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key)?.trim();
  return value ? value : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { search, page, pageSize } = parsePagination(
      request.nextUrl.searchParams
    );
    const searchParams = request.nextUrl.searchParams;
    return NextResponse.json(
      await listAdminTemplates({
        age: optionalSearchParam(searchParams, 'age'),
        category: optionalSearchParam(searchParams, 'category'),
        gender: optionalSearchParam(searchParams, 'gender'),
        id: optionalSearchParam(searchParams, 'id'),
        search,
        page,
        pageSize,
        style: optionalSearchParam(searchParams, 'style'),
        title: optionalSearchParam(searchParams, 'title'),
        type: normalizeTemplateType(searchParams.get('type')),
      })
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
