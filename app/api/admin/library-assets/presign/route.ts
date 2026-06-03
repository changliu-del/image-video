import { type NextRequest, NextResponse } from 'next/server';
import { createLibraryAssetPresign } from '@/lib/admin/services';
import { adminRouteError, readJsonBody } from '../../_utils';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    return NextResponse.json(await createLibraryAssetPresign(body));
  } catch (error) {
    return adminRouteError(error, 'Failed to prepare library asset upload');
  }
}
