function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function workspaceRouteRequiresAuth(pathname: string) {
  if (pathname === '/dashboard') {
    return false;
  }

  if (pathname.startsWith('/dashboard/')) {
    return true;
  }

  return ['/admin', '/jobs', '/pricing'].some((route) =>
    matchesRoute(pathname, route)
  );
}
