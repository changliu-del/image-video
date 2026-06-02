import Link from 'next/link';
import { Shirt, Sparkles, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getUser } from '@/lib/db/queries';

const entries = [
  {
    href: '/create/video',
    title: 'Image to video',
    icon: Video,
    accent: 'bg-orange-50 text-orange-700',
  },
  {
    href: '/create/apparel',
    title: 'Apparel image',
    icon: Shirt,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    href: '/create/try-on',
    title: 'Try-on',
    icon: Sparkles,
    accent: 'bg-sky-50 text-sky-700',
  },
];

export default async function HomePage() {
  const user = await getUser();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-semibold text-gray-950">
            Image Video
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild>
                <Link href="/create">Create</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-up">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-medium text-orange-600">AI creative studio</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-gray-950 sm:text-4xl">
            Create product visuals from a focused workspace
          </h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {entries.map((entry) => (
            <Link
              key={entry.href}
              href={user ? entry.href : '/sign-in'}
              className="group flex min-h-52 flex-col justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-xs transition hover:border-gray-300 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex size-11 items-center justify-center rounded-md ${entry.accent}`}
                >
                  <entry.icon className="size-5" />
                </span>
                <span className="text-sm font-medium text-gray-400 transition group-hover:text-gray-700">
                  Open
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-950">{entry.title}</h2>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
