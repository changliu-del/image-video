'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, ReactNode } from 'react';
import {
  CreditCard,
  ExternalLink,
  LayoutGrid,
  ReceiptText,
  Settings,
  Shirt,
  Sparkles,
  UserRound,
  Video,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DashboardHeaderUser } from './dashboard-header';

const createItems = [
  { href: '/create', icon: LayoutGrid, label: 'Create home' },
  { href: '/create/video', icon: Video, label: 'Image to video' },
  { href: '/create/apparel', icon: Shirt, label: 'Apparel image' },
  { href: '/create/try-on', icon: Sparkles, label: 'Try-on' },
];

const accountItems = [
  { href: '/dashboard', icon: UserRound, label: 'Account overview' },
  { href: '/dashboard/credits', icon: CreditCard, label: 'Credits' },
  { href: '/dashboard/billing', icon: ReceiptText, label: 'Billing' },
  { href: '/dashboard/profile', icon: Settings, label: 'Profile' },
];

function canAccessTemplateAdmin(user: DashboardHeaderUser | null) {
  return Boolean(user && (user.isAdmin || user.role === 'admin' || user.role === 'ops'));
}

function SidebarLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link href={href}>
      <Button
        variant={active ? 'secondary' : 'ghost'}
        className={cn(
          'my-0.5 h-9 w-full justify-start gap-2 text-white/65 shadow-none hover:bg-white/10 hover:text-white',
          active && 'bg-white text-gray-950 hover:bg-white hover:text-gray-950'
        )}
      >
        <Icon className="size-4" />
        <span className="truncate">{label}</span>
      </Button>
    </Link>
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

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[calc(100dvh-60px)] bg-gray-950 text-white md:min-h-[calc(100dvh-72px)]">
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-gray-950/95 lg:block">
        <nav className="sticky top-[60px] flex h-[calc(100dvh-60px)] flex-col overflow-y-auto p-4 md:top-[72px] md:h-[calc(100dvh-72px)]">
          <div>
            <p className="px-3 pb-2 text-xs font-semibold uppercase text-white/35">
              Create
            </p>
            {createItems.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </div>

          <div className="mt-6">
            <p className="px-3 pb-2 text-xs font-semibold uppercase text-white/35">
              Account
            </p>
            {accountItems.map((item) => (
              <SidebarLink key={item.href} {...item} />
            ))}
          </div>

          {canAccessTemplateAdmin(user) && templateAdminUrl ? (
            <div className="mt-auto border-t border-white/10 pt-4">
              <a
                href={templateAdminUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-white/65 transition hover:bg-white/10 hover:text-white"
              >
                <ExternalLink className="size-4" />
                <span className="truncate">Template Admin</span>
              </a>
            </div>
          ) : null}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.12),transparent_34%),linear-gradient(180deg,#111827_0%,#030712_55%,#030712_100%)]">
        {children}
      </main>
    </div>
  );
}
