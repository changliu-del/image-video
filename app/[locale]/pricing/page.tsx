import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingPricingPage } from '@/components/marketing/pricing-page';
import {
  getMarketingContent,
  isLocale,
  locales,
  type Locale,
} from '@/lib/marketing/content';

type PricingPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const content = getMarketingContent(locale).pricing.metadata;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: {
        pt: '/pt/pricing',
        en: '/en/pricing',
      },
    },
  };
}

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <MarketingPricingPage locale={locale as Locale} />;
}
