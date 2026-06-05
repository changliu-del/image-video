import { ApparelWorkbench } from '@/components/create/apparel-workbench';
import { firstDashboardParam } from '@/lib/dashboard/locale-url';

type CreateApparelPageProps = {
  searchParams?: Promise<{
    templateId?: string | string[];
    prompt?: string | string[];
  }>;
};

export default async function CreateApparelPage({
  searchParams,
}: CreateApparelPageProps) {
  const params = await searchParams;
  return (
    <ApparelWorkbench
      initialTemplateId={firstDashboardParam(params?.templateId) ?? ''}
      initialPrompt={firstDashboardParam(params?.prompt) ?? ''}
    />
  );
}
