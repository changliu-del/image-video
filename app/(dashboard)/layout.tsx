'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { CircleIcon, Home, LogOut, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import { identifyClientUser } from '@/lib/analytics/posthog';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      identifyClientUser({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    }
  }, [user]);

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link href="/sign-in" className="text-sm font-medium text-gray-700 hover:text-gray-900">
          Sign in
        </Link>
        <Button asChild>
          <Link href="/sign-up">Start free</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        {user.isAdmin ? (
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

function Header() {
  const { data: user } = useSWR<User>('/api/user', fetcher);

  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">Image Video</span>
        </Link>
        {user ? (
          <nav className="hidden items-center gap-5 md:flex">
            <Link href="/generate" className="text-sm font-medium text-gray-700 hover:text-gray-950">
              Generate
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-700 hover:text-gray-950">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-gray-950">
              Dashboard
            </Link>
            {user.isAdmin ? (
              <Link href="/admin" className="text-sm font-medium text-gray-700 hover:text-gray-950">
                Admin
              </Link>
            ) : null}
          </nav>
        ) : null}
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}
