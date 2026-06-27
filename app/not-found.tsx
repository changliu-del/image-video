'use client';

import Link from 'next/link';
import { CircleIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

const notFoundCopy = {
  pt: {
    title: 'Página não encontrada',
    description:
      'A página que você procura pode ter sido removida, renomeada ou estar temporariamente indisponível.',
    action: 'Voltar ao início',
    href: '/pt',
  },
  en: {
    title: 'Page not found',
    description:
      'The page you are looking for might have been removed, renamed, or temporarily unavailable.',
    action: 'Back to home',
    href: '/',
  },
};

export default function NotFound() {
  const pathname = usePathname();
  const copy = pathname?.startsWith('/pt') ? notFoundCopy.pt : notFoundCopy.en;

  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <CircleIcon className="size-12 text-orange-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          {copy.title}
        </h1>
        <p className="text-base text-gray-500">
          {copy.description}
        </p>
        <Link
          href={copy.href}
          className="max-w-48 mx-auto flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          {copy.action}
        </Link>
      </div>
    </div>
  );
}
