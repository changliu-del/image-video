import { type NextRequest, NextResponse } from 'next/server';
import { completeTemplateAsset } from '@/lib/admin/services';
import { adminRouteError, readJsonBody } from '../../_utils';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    return NextResponse.json(await completeTemplateAsset(body));
  } catch (error) {
    return adminRouteError(error, 'Failed to complete upload');
  }
}
