import type { Metadata } from 'next';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { PrivacyPolicyPage } from '@/components/marketing/privacy-policy-page';

export const metadata: Metadata = {
  title: 'Privacy Policy | Vendeo',
  description: 'Privacy Policy for Vendeo AI Commerce Studio.',
  alternates: {
    canonical: '/legal/privacy-policy',
    languages: {
      en: '/en/legal/privacy-policy',
      pt: '/pt/legal/privacy-policy',
    },
  },
};

export default function RootPrivacyPolicyPage() {
  return (
    <MarketingShell locale="en">
      <PrivacyPolicyPage locale="en" />
    </MarketingShell>
  );
}
