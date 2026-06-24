import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MarketingTemplatesPage } from '@/components/marketing/templates-page';
import {
  isLocale,
  locales,
  type Locale,
} from '@/lib/marketing/content';
import { publicTemplatesPageContent } from '@/lib/templates/public-content';

type TemplatesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: TemplatesPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const content = publicTemplatesPageContent[locale].metadata;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `/${locale}/templates`,
      languages: {
        pt: '/pt/templates',
        en: '/en/templates',
      },
    },
  };
}

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <MarketingTemplatesPage locale={locale as Locale} />;
}
