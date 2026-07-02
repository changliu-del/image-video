import { type NextRequest, NextResponse } from 'next/server';
import {
  importProductAnalyticsWorkbook,
  listProductAnalyticsImportSummaries,
} from '@/lib/admin/services';
import { adminRouteError } from '../_utils';

export async function GET() {
  try {
    return NextResponse.json(await listProductAnalyticsImportSummaries());
  } catch (error) {
    return adminRouteError(error, 'Failed to list product analytics imports');
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rankType = formData.get('rankType');
    const file = formData.get('file');

    if (typeof rankType !== 'string') {
      throw new Error('rankType is required');
    }
    if (!(file instanceof File)) {
      throw new Error('xlsx file is required');
    }
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      throw new Error('Only .xlsx files are supported');
    }

    const result = await importProductAnalyticsWorkbook({
      rankType,
      fileName: file.name,
      buffer: Buffer.from(await file.arrayBuffer()),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return adminRouteError(error, 'Failed to import product analytics');
  }
}
