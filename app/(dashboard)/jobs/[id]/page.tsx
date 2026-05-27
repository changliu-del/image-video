import Link from 'next/link';
import { WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobStatus } from '@/components/video-generation/job-status';

export default async function JobPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-medium text-gray-900 lg:text-2xl">
            Video job
          </h1>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/generate">
              <WandSparkles className="size-4" />
              New video
            </Link>
          </Button>
        </div>
        <JobStatus jobId={id} />
      </div>
    </section>
  );
}
