import { MarketingHomePage } from '@/components/marketing/home-page';
import { MarketingShell } from '@/components/marketing/marketing-shell';

export default function HomePage() {
  return (
    <MarketingShell locale="pt">
      <MarketingHomePage locale="pt" />
    </MarketingShell>
  );
}
