'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import { useState } from 'react';
import {
  ChevronDown,
  CreditCard,
  Coins,
  Home,
  ImageIcon,
  ShieldCheck,
  Shirt,
  Sparkles,
  UserRound,
  Video,
} from 'lucide-react';

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
          'my-0.5 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600',
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

function SidebarSection({
  title,
  items,
  collapsible,
}: {
  title: string;
  items: ShellItem[];
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const TitleIcon = collapsible ? ChevronDown : null;

  return (
    <section className="mt-4 first:mt-0">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mb-1 flex w-full items-center gap-1 rounded-lg px-3 py-1 text-left text-sm font-bold text-gray-800 transition hover:bg-indigo-50 hover:text-indigo-600"
          aria-expanded={open}
        >
          {TitleIcon ? (
            <TitleIcon className={cn('size-3.5 text-gray-400 transition', !open && '-rotate-90')} />
          ) : null}
          {title}
        </button>
      ) : (
        <div className="mb-1 px-3 py-1 text-sm font-bold text-gray-800">{title}</div>
      )}
      {open ? (
        <div>
          {items.map((item, index) => (
            <SidebarLink key={`${item.href}-${item.label}-${index}`} {...item} />
          ))}
        </div>
      ) : null}
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
    {
      href: '/create',
      icon: Sparkles,
      label: content.nav.allTools,
      match: 'exact',
    },
    { href: '/create/video', icon: Video, label: content.nav.imageVideo },
    { href: '/create/apparel', icon: ImageIcon, label: content.nav.apparel },
    { href: '/create/try-on', icon: Shirt, label: content.nav.tryOn },
  ];
  const personalItems: ShellItem[] = [
    { href: '/dashboard/billing', icon: CreditCard, label: content.nav.billing },
    { href: '/dashboard/credits', icon: Coins, label: content.nav.credits },
    { href: '/dashboard/security', icon: ShieldCheck, label: content.nav.security },
  ];

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[calc(100dvh-58px)] bg-[#f5f7fb] text-gray-950">
      <aside className="hidden w-[208px] shrink-0 border-r border-gray-200 bg-white lg:block">
        <nav className="sticky top-[58px] flex h-[calc(100dvh-58px)] flex-col overflow-y-auto px-3 py-4">
          <SidebarLink href="/dashboard" icon={Home} label={content.nav.home} match="exact" />
          <SidebarSection title={content.nav.tools} items={toolItems} collapsible />
          <SidebarSection title={content.nav.personal} items={personalItems} />
          <div className="mt-auto border-t border-gray-200 pt-3">
            <SidebarLink
              href="/dashboard/profile"
              icon={UserRound}
              label={content.nav.profileCenter}
              match="exact"
            />
            {user ? (
              <p className="truncate px-3 text-[11px] font-medium text-gray-400">
                {user.name || user.email}
              </p>
            ) : null}
          </div>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 bg-[#f5f7fb]">
        {children}
      </main>
    </div>
  );
}
