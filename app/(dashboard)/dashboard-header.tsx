'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  ExternalLink,
  LogOut,
  Settings,
} from 'lucide-react';
import { identifyClientUser } from '@/lib/analytics/posthog';
import { cn } from '@/lib/utils';

export type DashboardHeaderUser = {
  id: number;
  email?: string | null;
  name?: string | null;
  isAdmin?: boolean;
  role?: string | null;
};

function canAccessAdmin(user: DashboardHeaderUser) {
  return user.isAdmin || user.role === 'admin' || user.role === 'ops';
}

function UserMenu({
  user,
  templateAdminUrl,
}: {
  user: DashboardHeaderUser | null;
  templateAdminUrl?: string | null;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

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
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/sign-in"
          className="text-sm font-medium text-white/70 hover:text-white"
        >
          Sign in
        </Link>
        <Button asChild className="rounded-full bg-white text-gray-950 hover:bg-white/90">
          <Link href="/sign-up">Start free</Link>
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
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          aria-label="Open user menu"
        >
          <Avatar className="cursor-pointer size-9">
            <AvatarImage alt={user.name || ''} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Account</span>
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
              <span>Template Admin</span>
            </a>
          </DropdownMenuItem>
        ) : null}
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
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
  const navItems = [
    { href: '/', label: 'Início', exact: true },
    { href: '/pt/templates', label: 'Templates' },
    { href: '/create', label: 'Estúdio' },
    { href: '/pt/pricing', label: 'Preços' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b backdrop-blur',
        isAdminPage
          ? 'border-gray-200 bg-white'
          : 'border-white/10 bg-gray-950/90 text-white'
      )}
    >
      <div
        className={cn(
          'mx-auto flex h-[60px] items-center justify-between md:h-[72px]',
          isAdminPage
            ? 'w-full max-w-none px-5 sm:px-6'
            : 'max-w-7xl px-4 md:px-8'
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg text-lg font-black',
              isAdminPage
                ? 'bg-gray-950 text-white'
                : 'bg-white text-gray-950'
            )}
          >
            g
          </span>
          <span className="hidden flex-col leading-none sm:flex">
            <span
              className={cn(
                'text-base font-bold tracking-tight',
                isAdminPage ? 'text-gray-950' : 'text-white'
              )}
            >
              gptimage
            </span>
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-[0.22em]',
                isAdminPage ? 'text-gray-400' : 'text-white/40'
              )}
            >
              AI Commerce Studio
            </span>
          </span>
        </Link>
        {!isAdminPage ? (
          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-white'
                      : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
        <div className="flex items-center space-x-4">
          <UserMenu user={user} templateAdminUrl={templateAdminUrl} />
        </div>
      </div>
    </header>
  );
}
