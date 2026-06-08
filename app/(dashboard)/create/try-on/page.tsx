import { TryOnWorkbench } from '@/components/create/try-on-workbench';
import { firstDashboardParam } from '@/lib/dashboard/locale-url';

type CreateTryOnPageProps = {
  searchParams?: Promise<{
    prompt?: string | string[];
    templateId?: string | string[];
  }>;
};

export default async function CreateTryOnPage({
  searchParams,
}: CreateTryOnPageProps) {
  const params = await searchParams;
  return (
    <TryOnWorkbench
      initialPrompt={firstDashboardParam(params?.prompt) ?? ''}
      initialTemplateId={firstDashboardParam(params?.templateId) ?? ''}
    />
  );
}
