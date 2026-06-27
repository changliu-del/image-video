import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { workspaceRouteRequiresAuth } from '@/lib/auth/workspace-routes';

const marketingLocales = ['pt', 'en', 'zh'] as const;
type MarketingLocale = (typeof marketingLocales)[number];

function isMarketingLocale(
  value: string | null | undefined
): value is MarketingLocale {
  return (
    typeof value === 'string' &&
    marketingLocales.includes(value as MarketingLocale)
  );
}

function getRequestLocale(request: NextRequest): MarketingLocale {
  const queryLocale = request.nextUrl.searchParams.get('locale');
  if (isMarketingLocale(queryLocale)) {
    return queryLocale;
  }

  const [firstSegment] = request.nextUrl.pathname.split('/').filter(Boolean);
  return isMarketingLocale(firstSegment) ? firstSegment : 'pt';
}

function getLoginRedirect(request: NextRequest) {
  const redirectUrl = new URL('/sign-in', request.url);
  redirectUrl.searchParams.set('locale', getRequestLocale(request));

  const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (target && target !== '/') {
    redirectUrl.searchParams.set('redirect', target);
  }

  return redirectUrl;
}

function getTextToImageRedirect(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 1 && segments[0] === 'text-to-image') {
    return '/pt/templates';
  }

  if (
    segments.length === 2 &&
    marketingLocales.includes(
      segments[0] as (typeof marketingLocales)[number]
    ) &&
    segments[1] === 'text-to-image'
  ) {
    return `/${segments[0]}/templates`;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const textToImageRedirect = getTextToImageRedirect(pathname);

  if (textToImageRedirect) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = textToImageRedirect;
    redirectUrl.search = '';
    redirectUrl.searchParams.set('type', 'image');

    return NextResponse.redirect(redirectUrl, 308);
  }

  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = workspaceRouteRequiresAuth(pathname);

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(getLoginRedirect(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
