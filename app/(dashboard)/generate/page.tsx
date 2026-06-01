import { Suspense } from 'react';
import { GenerateForm } from '@/components/video-generation/generate-form';

export default function GeneratePage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900 lg:text-2xl">
            Generate video
          </h1>
        </div>
        <Suspense fallback={<div className="rounded-lg border bg-white p-6 text-sm text-gray-500">Loading generator...</div>}>
          <GenerateForm />
        </Suspense>
      </div>
    </section>
  );
}
