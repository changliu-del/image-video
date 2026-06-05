import { ImageVideoWorkbench } from '@/components/create/image-video-workbench';
import { firstDashboardParam } from '@/lib/dashboard/locale-url';

type CreateVideoPageProps = {
  searchParams?: Promise<{
    templateId?: string | string[];
    prompt?: string | string[];
  }>;
};

export default async function CreateVideoPage({
  searchParams,
}: CreateVideoPageProps) {
  const params = await searchParams;
  return (
    <ImageVideoWorkbench
      initialTemplateId={firstDashboardParam(params?.templateId) ?? ''}
      initialPrompt={firstDashboardParam(params?.prompt) ?? ''}
    />
  );
}
