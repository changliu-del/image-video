import { ImageVideoWorkbench } from '@/components/create/image-video-workbench';
import { firstDashboardParam } from '@/lib/dashboard/locale-url';

type CreateVideoPageProps = {
  searchParams?: Promise<{
    jobId?: string | string[];
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
      initialJobId={firstDashboardParam(params?.jobId) ?? ''}
      initialTemplateId={firstDashboardParam(params?.templateId) ?? ''}
      initialPrompt={firstDashboardParam(params?.prompt) ?? ''}
    />
  );
}
