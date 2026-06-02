'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import { ChevronDown, Home, ImageIcon, Shirt, UserRound, Video } from 'lucide-react';

import { getDashboardContent } from '@/lib/dashboard/content';
import { useDashboardLocale, withDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import { cn } from '@/lib/utils';
import type { DashboardHeaderUser } from './dashboard-header';

type ShellItem = {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  match?: 'prefix' | 'exact' | 'never';
};

function SidebarLink({
  href,
  icon: Icon,
  label,
  badge,
  match = 'prefix',
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  match?: 'prefix' | 'exact' | 'never';
}) {
  const pathname = usePathname();
  const locale = useDashboardLocale();
  const active =
    match === 'never'
      ? false
      : match === 'exact' || href === '/'
        ? pathname === href
        : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={withDashboardLocale(href, locale)}>
      <span
        className={cn(
          'my-0.5 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-950',
          active && 'border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm'
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{label}</span>
        {badge ? (
          <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function SidebarSection({ title, items }: { title: string; items: ShellItem[] }) {
  return (
    <section className="mt-4 first:mt-0">
      <div className="mb-1 flex items-center gap-1 px-3 text-sm font-bold text-gray-800">
        <ChevronDown className="size-3.5 text-gray-500" />
        {title}
      </div>
      {items.map((item, index) => (
        <SidebarLink key={`${item.href}-${item.label}-${index}`} {...item} />
      ))}
    </section>
  );
}

export function AppShell({
  children,
  templateAdminUrl,
  user,
}: {
  children: ReactNode;
  templateAdminUrl?: string | null;
  user: DashboardHeaderUser | null;
}) {
  const pathname = usePathname();
  const locale = useDashboardLocale();
  const content = getDashboardContent(locale);
  const toolItems: ShellItem[] = [
    { href: '/create/video', icon: Video, label: content.nav.imageVideo },
    { href: '/create/apparel', icon: ImageIcon, label: content.nav.apparel },
    { href: '/create/try-on', icon: Shirt, label: content.nav.tryOn },
  ];

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[calc(100dvh-58px)] bg-[#f4f6fa] text-gray-950">
      <aside className="hidden w-[156px] shrink-0 border-r border-gray-200 bg-white lg:block">
        <nav className="sticky top-[58px] flex h-[calc(100dvh-58px)] flex-col overflow-y-auto px-2 py-4">
          <SidebarLink href="/" icon={Home} label={content.nav.home} match="exact" />
          <SidebarSection title={content.nav.tools} items={toolItems} />
          <div className="mt-auto border-t border-gray-100 pt-3">
            <SidebarLink
              href="/dashboard/profile"
              icon={UserRound}
              label={content.nav.profileCenter}
            />
            {user ? (
              <p className="mt-1 truncate px-3 text-[11px] font-medium text-gray-400">
                {user.name || user.email}
              </p>
            ) : null}
          </div>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 bg-[#f4f6fa]">
        {children}
      </main>
    </div>
  );
}
