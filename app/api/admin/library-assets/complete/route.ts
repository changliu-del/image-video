import { type NextRequest, NextResponse } from 'next/server';
import { completeLibraryAsset } from '@/lib/admin/services';
import { adminRouteError, readJsonBody } from '../../_utils';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    return NextResponse.json(await completeLibraryAsset(body), { status: 201 });
  } catch (error) {
    return adminRouteError(error, 'Failed to complete library asset upload');
  }
}
