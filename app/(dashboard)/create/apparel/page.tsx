import { ApparelWorkbench } from '@/components/create/apparel-workbench';
import { firstDashboardParam } from '@/lib/dashboard/locale-url';

type CreateApparelPageProps = {
  searchParams?: Promise<{
    prompt?: string | string[];
    templateId?: string | string[];
  }>;
};

export default async function CreateApparelPage({
  searchParams,
}: CreateApparelPageProps) {
  const params = await searchParams;
  return (
    <ApparelWorkbench
      initialPrompt={firstDashboardParam(params?.prompt) ?? ''}
      initialTemplateId={firstDashboardParam(params?.templateId) ?? ''}
    />
  );
}
