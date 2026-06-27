import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PrivacyPolicyPage } from '@/components/marketing/privacy-policy-page';
import {
  isLocale,
  locales,
  type Locale,
} from '@/lib/marketing/content';

type PrivacyPolicyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: PrivacyPolicyPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return {};
  }

  const isPortuguese = locale === 'pt';

  return {
    title: isPortuguese
      ? 'Política de Privacidade | Vendeo'
      : 'Privacy Policy | Vendeo',
    description: isPortuguese
      ? 'Política de Privacidade do Vendeo AI Commerce Studio.'
      : 'Privacy Policy for Vendeo AI Commerce Studio.',
    alternates: {
      canonical: `/${locale}/legal/privacy-policy`,
      languages: {
        en: '/en/legal/privacy-policy',
        pt: '/pt/legal/privacy-policy',
      },
    },
  };
}

export default async function LocalePrivacyPolicyPage({
  params,
}: PrivacyPolicyPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <PrivacyPolicyPage locale={locale as Locale} />;
}
