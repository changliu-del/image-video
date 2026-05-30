import { notFound } from 'next/navigation';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { isLocale, type Locale } from '@/lib/marketing/content';

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <MarketingShell locale={locale as Locale}>{children}</MarketingShell>;
}
