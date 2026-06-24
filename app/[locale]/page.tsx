import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingHomePage } from '@/components/marketing/home-page';
import {
  getMarketingContent,
  isLocale,
  locales,
  type Locale,
} from '@/lib/marketing/content';

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const content = getMarketingContent(locale).home.metadata;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        pt: '/pt',
        en: '/en',
      },
    },
  };
}

export default async function LocaleHomePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <MarketingHomePage locale={locale as Locale} />;
}
