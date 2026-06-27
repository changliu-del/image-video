'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Globe2, Menu, X } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import {
  getLocalizedHref,
  getMarketingContent,
  locales,
  type Locale,
} from '@/lib/marketing/content';
import { withDashboardLocale } from '@/lib/dashboard/locale-url';
import { cn } from '@/lib/utils';

type MarketingShellProps = {
  children: React.ReactNode;
  locale: Locale;
};

type MarketingContent = ReturnType<typeof getMarketingContent>;
type MarketingNavItem = MarketingContent['navItems'][number];

const localeNames: Record<(typeof locales)[number], string> = {
  pt: 'Português',
  en: 'English',
};

function Brand({ locale }: { locale: Locale }) {
  return (
    <Link href={getLocalizedHref(locale, '')} className="flex items-center gap-2">
      <BrandMark className="size-9" />
      <span className="hidden flex-col leading-none sm:flex">
        <span className="text-base font-bold tracking-tight text-white">
          Vendeo
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
          AI Commerce Studio
        </span>
      </span>
    </Link>
  );
}

function localizedPath(pathname: string, nextLocale: Locale) {
  const segments = pathname.split('/').filter(Boolean);
  const rest = locales.includes(segments[0] as (typeof locales)[number])
    ? segments.slice(1)
    : segments;

  return `/${[nextLocale, ...rest].join('/')}`;
}

function getNavHref(locale: Locale, item: MarketingNavItem) {
  if (item.localized === false) {
    return item.href.startsWith('/dashboard')
      ? withDashboardLocale(item.href, locale)
      : item.href;
  }

  return getLocalizedHref(locale, item.href);
}

function LanguageMenu({
  content,
  locale,
}: {
  content: MarketingContent;
  locale: Locale;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={content.nav.language}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <Globe2 className="size-4" />
        <span className="hidden sm:inline">{content.localeLabel}</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 min-w-40 overflow-hidden rounded-lg border border-white/10 bg-gray-900 p-1 shadow-2xl">
          {locales.map((nextLocale) => (
            <Link
              key={nextLocale}
              href={localizedPath(pathname, nextLocale)}
              onClick={() => setOpen(false)}
              className={cn(
                'block rounded-md px-3 py-2 text-sm transition',
                nextLocale === locale
                  ? 'bg-white text-gray-950'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              )}
            >
              {localeNames[nextLocale]}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DesktopNav({
  content,
  locale,
}: {
  content: MarketingContent;
  locale: Locale;
}) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-2 md:flex">
      {content.navItems.map((item) => {
        const href = getNavHref(locale, item);
        const hrefPathname = href.split('?')[0];
        const active =
          pathname === hrefPathname ||
          (item.localized === false && pathname.startsWith(`${hrefPathname}/`));

        return (
          <Link
            key={item.href || 'home'}
            href={href}
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
  );
}

function MobileMenu({
  content,
  locale,
  open,
  onClose,
}: {
  content: MarketingContent;
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="border-b border-white/10 bg-gray-950 px-4 py-4 md:hidden">
      <div className="grid gap-2">
        {content.navItems.map((item) => (
          <Link
            key={item.href || 'home'}
            href={getNavHref(locale, item)}
            onClick={onClose}
            className="rounded-md px-3 py-3 text-sm font-medium text-white/75 hover:bg-white/[0.06] hover:text-white"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href={getLocalizedHref(locale, '/login')}
          onClick={onClose}
          className="mt-2 rounded-md bg-white px-3 py-3 text-center text-sm font-semibold text-gray-950"
        >
          {content.nav.login}
        </Link>
      </div>
    </div>
  );
}

function Header({ content, locale }: { content: MarketingContent; locale: Locale }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-gray-950/90 text-white backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 md:h-[72px] md:px-8">
        <Brand locale={locale} />
        <DesktopNav content={content} locale={locale} />
        <div className="flex items-center gap-2">
          <LanguageMenu content={content} locale={locale} />
          <Link
            href={getLocalizedHref(locale, '/login')}
            className="hidden h-10 items-center rounded-full bg-white px-5 text-sm font-medium text-gray-950 transition hover:bg-white/90 md:inline-flex"
          >
            {content.nav.login}
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? content.nav.closeMenu : content.nav.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <MobileMenu
        content={content}
        locale={locale}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </header>
  );
}

function Footer({ content, locale }: { content: MarketingContent; locale: Locale }) {
  return (
    <footer className="border-t border-white/10 bg-gray-950 text-white/55">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_2fr] lg:px-8">
        <div>
          <Brand locale={locale} />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/45">
            {content.footer.description}
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              {content.footer.legal}
            </h2>
            <div className="mt-4 grid gap-3">
              <a
                href="https://lumalabs-app.com/legal/privacy-policy"
                target="_blank"
                rel="noreferrer"
                className="text-sm text-white/45 transition hover:text-white"
              >
                {content.footer.privacy}
              </a>
            </div>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
              {content.footer.contact}
            </h2>
            <a
              href="mailto:support@8ilx.com"
              className="mt-4 block text-sm text-white/45 transition hover:text-white"
            >
              support@8ilx.com
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-8 text-center text-xs text-gray-400">
        {content.footer.copyright}
      </div>
    </footer>
  );
}

export function MarketingShell({ children, locale }: MarketingShellProps) {
  const content = getMarketingContent(locale);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header content={content} locale={locale} />
      {children}
      <Footer content={content} locale={locale} />
    </div>
  );
}
