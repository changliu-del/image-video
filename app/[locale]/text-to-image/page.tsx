import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingTextToImagePage } from '@/components/marketing/text-to-image-page';
import {
  getMarketingContent,
  isLocale,
  locales,
  type Locale,
} from '@/lib/marketing/content';

type TextToImagePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: TextToImagePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const content = getMarketingContent(locale).textToImage.metadata;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `/${locale}/text-to-image`,
      languages: {
        pt: '/pt/text-to-image',
        en: '/en/text-to-image',
        zh: '/zh/text-to-image',
      },
    },
  };
}

export default async function TextToImagePage({ params }: TextToImagePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <MarketingTextToImagePage locale={locale as Locale} />;
}
