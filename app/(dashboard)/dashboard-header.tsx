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
import { Home, LogOut, ShieldCheck, CircleIcon } from 'lucide-react';
import { identifyClientUser } from '@/lib/analytics/posthog';
import { cn } from '@/lib/utils';

export type DashboardHeaderUser = {
  id: number;
  email: string;
  name: string | null;
  isAdmin: boolean;
  role: string;
};

function canAccessAdmin(user: DashboardHeaderUser) {
  return user.isAdmin || user.role === 'admin' || user.role === 'ops';
}

function UserMenu({ user }: { user: DashboardHeaderUser | null }) {
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
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Sign in
        </Link>
        <Button asChild>
          <Link href="/sign-up">Start free</Link>
        </Button>
      </>
    );
  }

  const initials = user.email
    .split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
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
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        {canAccessAdmin(user) ? (
          <DropdownMenuItem className="cursor-pointer">
            <Link href="/admin" className="flex w-full items-center">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Admin</span>
            </Link>
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
}: {
  user: DashboardHeaderUser | null;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const navItems = [
    { href: '/generate', label: 'Generate' },
    { href: '/pricing', label: 'Pricing' },
    ...(user && canAccessAdmin(user)
      ? [{ href: '/admin', label: 'Admin' }]
      : []),
  ];

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link
          href={isAdminPage ? '/' : user ? '/dashboard' : '/'}
          className="flex items-center"
        >
          <CircleIcon className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            Image Video
          </span>
        </Link>
        {user && !isAdminPage ? (
          <nav className="hidden h-9 items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative inline-flex h-9 items-center px-3 text-sm font-medium text-gray-700 transition-colors hover:text-gray-950',
                    active &&
                      'text-orange-600 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-orange-600'
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
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
