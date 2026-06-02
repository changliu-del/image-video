import 'server-only';

import { type NextRequest, NextResponse } from 'next/server';

type ProxyOptions = {
  request: NextRequest;
  path: string;
};

const emptyList = {
  items: [],
  total: 0,
};

function configuredAdmin() {
  const baseUrl = process.env.ADMIN_API_URL?.trim();
  const token = process.env.ADMIN_API_TOKEN?.trim();

  if (!baseUrl || !token) {
    return null;
  }

  return { baseUrl, token };
}

function buildAdminUrl(baseUrl: string, path: string, request: NextRequest) {
  const url = new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  return url;
}

export async function proxyTemplateAdminList({ request, path }: ProxyOptions) {
  const admin = configuredAdmin();

  if (!admin) {
    return NextResponse.json(emptyList);
  }

  try {
    const response = await fetch(buildAdminUrl(admin.baseUrl, path, request), {
      headers: {
        Authorization: `Bearer ${admin.token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Template Admin request failed' },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Template Admin proxy failed', error);
    return NextResponse.json(
      { error: 'Template Admin request failed' },
      { status: 502 }
    );
  }
}
