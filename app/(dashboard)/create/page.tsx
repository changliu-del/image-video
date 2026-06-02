import Link from 'next/link';
import { Shirt, Sparkles, Video } from 'lucide-react';

const entries = [
  {
    href: '/create/video',
    title: 'Image to video',
    icon: Video,
    accent: 'text-orange-600',
  },
  {
    href: '/create/apparel',
    title: 'Apparel image',
    icon: Shirt,
    accent: 'text-emerald-600',
  },
  {
    href: '/create/try-on',
    title: 'Try-on',
    icon: Sparkles,
    accent: 'text-sky-600',
  },
];

export default function CreatePage() {
  return (
    <main className="flex-1 bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-medium text-orange-600">Create</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Choose a creative tool
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="group rounded-lg border border-gray-200 bg-white p-5 shadow-xs transition hover:border-gray-300 hover:shadow-sm"
            >
              <div className="mb-8 flex items-center justify-between">
                <entry.icon className={`size-6 ${entry.accent}`} />
                <span className="text-sm font-medium text-gray-400 transition group-hover:text-gray-700">
                  Open
                </span>
              </div>
              <h2 className="text-lg font-semibold text-gray-950">{entry.title}</h2>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
