'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/app/(login)/actions';
import {
  Check,
  ChevronDown,
  ExternalLink,
  Gem,
  Globe2,
  Home,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { identifyClientUser } from '@/lib/analytics/posthog';
import {
  dashboardLocales,
  getDashboardContent,
  type DashboardLocale,
} from '@/lib/dashboard/content';
import { useDashboardLocale, withDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { cn } from '@/lib/utils';

export type DashboardHeaderUser = {
  id: number;
  email?: string | null;
  name?: string | null;
  isAdmin?: boolean;
  role?: string | null;
  creditBalance?: number;
  planName?: string | null;
  subscriptionStatus?: string | null;
};

function canAccessAdmin(user: DashboardHeaderUser) {
  return user.isAdmin || user.role === 'admin' || user.role === 'ops';
}

function UserMenu({
  user,
  templateAdminUrl,
  labels,
}: {
  user: DashboardHeaderUser | null;
  templateAdminUrl?: string | null;
  labels: ReturnType<typeof getDashboardContent>['userMenu'];
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const locale = useDashboardLocale();

  useEffect(() => {
    if (!user) return;
    identifyClientUser({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
  }, [user]);

  async function handleSignOut() {
    await signOut();
    router.push(`/${locale}`);
  }

  if (!user) {
    return (
      <>
        <Link
          href={withDashboardLocale('/sign-in', locale)}
          className="text-sm font-medium text-gray-600 hover:text-gray-950"
        >
          {labels.signIn}
        </Link>
        <Button asChild className="rounded-full bg-gray-950 text-white hover:bg-gray-800">
          <Link href={withDashboardLocale('/sign-up', locale)}>{labels.startFree}</Link>
        </Button>
      </>
    );
  }

  const initials = user.email
    ?.split(' ')
    .map((part) => part[0])
    .join('') || 'U';

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          aria-label={labels.openMenu}
        >
          <Avatar className="size-9 cursor-pointer ring-2 ring-white shadow-sm">
            <AvatarImage alt={user.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href={withDashboardLocale('/dashboard/profile', locale)} className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>{labels.account}</span>
          </Link>
        </DropdownMenuItem>
        {user && canAccessAdmin(user) && templateAdminUrl ? (
          <DropdownMenuItem className="cursor-pointer md:hidden">
            <a
              href={templateAdminUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>{labels.templateAdmin}</span>
            </a>
          </DropdownMenuItem>
        ) : null}
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{labels.signOut}</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function languageHref({
  pathname,
  searchParams,
  locale,
}: {
  pathname: string;
  searchParams: { toString(): string };
  locale: DashboardLocale;
}) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('locale', locale);
  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function DashboardLanguageMenu({
  locale,
  content,
}: {
  locale: DashboardLocale;
  content: ReturnType<typeof getDashboardContent>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
          aria-label={content.header.language}
        >
          <Globe2 className="size-4" />
          <span className="hidden sm:inline">{content.localeNames[locale]}</span>
          <ChevronDown className="size-3.5 text-gray-400" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {dashboardLocales.map((nextLocale) => (
          <DropdownMenuItem key={nextLocale} asChild>
            <Link
              href={languageHref({
                pathname,
                searchParams,
                locale: nextLocale,
              })}
              className="flex cursor-pointer items-center justify-between gap-4"
            >
              <span>{content.localeNames[nextLocale]}</span>
              {nextLocale === locale ? <Check className="size-4 text-indigo-600" /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DashboardHeader({
  user,
  templateAdminUrl,
}: {
  user: DashboardHeaderUser | null;
  templateAdminUrl?: string | null;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const locale = useDashboardLocale();
  const content = getDashboardContent(locale);
  const homeHref = isAdminPage ? withDashboardLocale('/dashboard', locale) : `/${locale}`;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur',
        isAdminPage
          ? 'border-gray-200 bg-white'
          : 'border-gray-200 bg-white/92 text-gray-950'
      )}
    >
      <div
        className={cn(
          'flex h-[58px] items-center justify-between',
          isAdminPage
            ? 'w-full max-w-none px-5 sm:px-6'
            : 'w-full px-4 sm:px-5'
        )}
      >
        <div className="flex items-center gap-1.5">
          <Link
            href={homeHref}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-full px-2 text-sm font-bold transition',
              isAdminPage
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-800 hover:bg-indigo-50 hover:text-indigo-600'
            )}
          >
            {!isAdminPage ? <Home className="size-4" /> : null}
            <span>
              {isAdminPage ? content.header.admin : content.header.marketingHome}
            </span>
          </Link>
          {!isAdminPage && user && canAccessAdmin(user) ? (
            <Link
              href={withDashboardLocale('/admin', locale)}
              className="inline-flex h-9 items-center gap-2 rounded-full px-2 text-sm font-bold text-gray-800 transition hover:bg-indigo-50 hover:text-indigo-600"
            >
              <ShieldCheck className="size-4" />
              <span>{content.header.admin}</span>
            </Link>
          ) : null}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {!isAdminPage ? (
            <>
            <Link
              href={withDashboardLocale('/dashboard/credits', locale)}
              className="hidden h-9 items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 text-sm font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-100 md:flex"
            >
              <Gem className="size-4 fill-indigo-300 text-indigo-500" />
              {user?.creditBalance ?? 0}
              <span className="text-xs text-gray-500">{content.header.credits}</span>
            </Link>
            <Link
              href={withDashboardLocale('/dashboard/billing', locale)}
              className={cn(
                'hidden h-9 items-center rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 sm:flex',
                pathname.startsWith('/dashboard/billing') && 'text-indigo-600'
              )}
            >
              {content.header.buy}
            </Link>
            </>
          ) : null}
          <DashboardLanguageMenu locale={locale} content={content} />
        </div>
        <div className="ml-2 flex items-center space-x-3">
          <UserMenu user={user} templateAdminUrl={templateAdminUrl} labels={content.userMenu} />
        </div>
      </div>
    </header>
  );
}
