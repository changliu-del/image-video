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
        <GenerateForm />
      </div>
    </section>
  );
}
