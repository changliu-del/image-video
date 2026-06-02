import { type NextRequest } from 'next/server';

import { proxyTemplateAdminList } from '@/lib/services/template-admin-api';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return proxyTemplateAdminList({
    request,
    path: 'creative-templates',
  });
}
