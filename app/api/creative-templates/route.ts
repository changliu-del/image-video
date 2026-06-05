import { type NextRequest, NextResponse } from 'next/server';

import { getUser, hasOpsAccess } from '@/lib/db/queries';
import { proxyTemplateAdminList } from '@/lib/services/template-admin-api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasOpsAccess(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return proxyTemplateAdminList({
    request,
    path: 'creative-templates',
  });
}
