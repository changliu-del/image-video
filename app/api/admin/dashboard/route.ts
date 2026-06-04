import { type NextRequest, NextResponse } from 'next/server';
import { getAdminDashboard } from '@/lib/admin/services';
import { adminRouteError } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      await getAdminDashboard({
        from: request.nextUrl.searchParams.get('from'),
        to: request.nextUrl.searchParams.get('to'),
      })
    );
  } catch (error) {
    return adminRouteError(error, 'Failed to load admin dashboard');
  }
}
