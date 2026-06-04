import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = ['/create', '/dashboard', '/generate', '/jobs'];
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

export async function middleware(request: NextRequest) {
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
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(getLoginRedirect(request));
  }

  let res = NextResponse.next();

  const shouldRefreshSession =
    sessionCookie && request.method === 'GET' && !pathname.startsWith('/create');

  if (shouldRefreshSession) {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      res.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(getLoginRedirect(request));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
