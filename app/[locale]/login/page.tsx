import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Login } from '@/app/(login)/login';
import {
  getMarketingContent,
  isLocale,
  locales,
  type Locale,
} from '@/lib/marketing/content';

type LocaleLoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocaleLoginPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const content = getMarketingContent(locale).auth.metadata;

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: `/${locale}/login`,
      languages: Object.fromEntries(
        locales.map((nextLocale) => [nextLocale, `/${nextLocale}/login`])
      ),
    },
  };
}

export default async function LocaleLoginPage({
  params,
}: LocaleLoginPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return (
    <Suspense>
      <Login locale={locale as Locale} />
    </Suspense>
  );
}
