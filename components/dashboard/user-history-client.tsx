'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import {
  Download,
  Film,
  Heart,
  ImageIcon,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  useDashboardLocale,
  withDashboardLocale,
} from '@/lib/dashboard/use-dashboard-locale';
import type { DashboardLocale } from '@/lib/dashboard/content';
import { cn } from '@/lib/utils';

type HistoryFilter = 'all' | 'images' | 'videos';

type HistoryItem = {
  id: string;
  assetId: string;
  source: 'user_upload' | 'generated_image' | 'generated_video';
  title: string | null;
  generationType: 'image_to_video' | 'apparel_image' | 'try_on' | null;
  assetUrl: string;
  imageUrl: string | null;
  videoUrl: string | null;
  mimeType: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

type HistoryResponse = {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

type HistoryCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  filters: Record<HistoryFilter, string>;
  retry: string;
  loadMore: string;
  loading: string;
  emptyTitle: string;
  emptyBody: string;
  create: string;
  open: string;
  download: string;
  favorite: string;
  unfavorite: string;
  delete: string;
  imageResult: string;
  videoResult: string;
  created: string;
  types: Record<NonNullable<HistoryItem['generationType']>, string>;
};

const historyCopy: Record<DashboardLocale, HistoryCopy> = {
  pt: {
    eyebrow: 'Pessoal',
    title: 'Histórico de gerações',
    intro: 'Resultados gerados pela sua conta, salvos de forma privada.',
    filters: {
      all: 'Todos',
      images: 'Imagens',
      videos: 'Vídeos',
    },
    retry: 'Tentar novamente',
    loadMore: 'Carregar mais',
    loading: 'Carregando histórico...',
    emptyTitle: 'Nenhum resultado gerado ainda',
    emptyBody: 'Crie uma imagem ou vídeo para salvar resultados aqui.',
    create: 'Criar agora',
    open: 'Abrir resultado',
    download: 'Baixar',
    favorite: 'Favoritar',
    unfavorite: 'Remover favorito',
    delete: 'Remover',
    imageResult: 'Imagem',
    videoResult: 'Vídeo',
    created: 'Criado',
    types: {
      image_to_video: 'Imagem para vídeo',
      apparel_image: 'Imagem de produto',
      try_on: 'Provador virtual',
    },
  },
  en: {
    eyebrow: 'Personal',
    title: 'User history',
    intro: 'Generated results from your account, saved privately for reuse and review.',
    filters: {
      all: 'All',
      images: 'Images',
      videos: 'Videos',
    },
    retry: 'Retry',
    loadMore: 'Load more',
    loading: 'Loading history...',
    emptyTitle: 'No generated results yet',
    emptyBody: 'Create an image or video to save results here.',
    create: 'Create now',
    open: 'Open result',
    download: 'Download',
    favorite: 'Favorite',
    unfavorite: 'Remove favorite',
    delete: 'Remove',
    imageResult: 'Image',
    videoResult: 'Video',
    created: 'Created',
    types: {
      image_to_video: 'Image to video',
      apparel_image: 'Product image',
      try_on: 'Virtual try-on',
    },
  },
  zh: {
    eyebrow: 'Personal',
    title: 'User history',
    intro: 'Generated results from your account, saved privately for reuse and review.',
    filters: {
      all: 'All',
      images: 'Images',
      videos: 'Videos',
    },
    retry: 'Retry',
    loadMore: 'Load more',
    loading: 'Loading history...',
    emptyTitle: 'No generated results yet',
    emptyBody: 'Create an image or video to save results here.',
    create: 'Create now',
    open: 'Open result',
    download: 'Download',
    favorite: 'Favorite',
    unfavorite: 'Remove favorite',
    delete: 'Remove',
    imageResult: 'Image',
    videoResult: 'Video',
    created: 'Created',
    types: {
      image_to_video: 'Image to video',
      apparel_image: 'Product image',
      try_on: 'Virtual try-on',
    },
  },
};

const pageSize = 24;

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error('Failed to load user history');
  }
  return response.json() as Promise<HistoryResponse>;
};

function formatDate(value: string, locale: DashboardLocale) {
  const dateLocale = locale === 'pt' ? 'pt-BR' : 'en-US';
  return new Intl.DateTimeFormat(dateLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getHistoryKey(filter: HistoryFilter, pageIndex: number) {
  const params = new URLSearchParams({
    page: String(pageIndex + 1),
    pageSize: String(pageSize),
  });

  if (filter === 'all') {
    params.set('sourceGroup', 'generated');
  }
  if (filter === 'images') {
    params.set('source', 'generated_image');
  }
  if (filter === 'videos') {
    params.set('source', 'generated_video');
  }

  return `/api/user-media?${params.toString()}`;
}

function isVideoItem(item: HistoryItem) {
  return item.videoUrl || item.mimeType?.startsWith('video/');
}

function itemLabel(item: HistoryItem, copy: HistoryCopy) {
  if (item.title) return item.title;
  if (item.generationType) return copy.types[item.generationType];
  return isVideoItem(item) ? copy.videoResult : copy.imageResult;
}

export function UserHistoryClient() {
  const locale = useDashboardLocale();
  const copy = historyCopy[locale];
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const createHref = withDashboardLocale('/create/video', locale);
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    setSize,
    size,
  } = useSWRInfinite<HistoryResponse>(
    (pageIndex, previousPageData) => {
      if (previousPageData && !previousPageData.hasMore) return null;
      return getHistoryKey(filter, pageIndex);
    },
    fetcher,
    {
      revalidateFirstPage: false,
    }
  );
  const pages = data ?? [];
  const items = useMemo(() => pages.flatMap((page) => page.items), [pages]);
  const total = pages[0]?.total ?? 0;
  const hasMore = pages.at(-1)?.hasMore ?? false;
  const isInitialLoading = isLoading && items.length === 0;

  async function patchItem(item: HistoryItem, body: Record<string, unknown>) {
    await fetch(`/api/user-media/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    });
    await mutate();
  }

  async function deleteItem(item: HistoryItem) {
    await fetch(`/api/user-media/${item.id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    await mutate();
  }

  return (
    <main className="flex-1 px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">{copy.eyebrow}</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-950">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              {copy.intro}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(copy.filters) as HistoryFilter[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setFilter(key);
                  void setSize(1);
                }}
                className={cn(
                  'h-9 rounded-lg border px-3 text-sm font-semibold transition',
                  filter === key
                    ? 'border-gray-950 bg-gray-950 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-950'
                )}
              >
                {copy.filters[key]}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span>{error.message}</span>
            <button
              type="button"
              onClick={() => void mutate()}
              className="ml-2 inline-flex items-center gap-1 font-semibold underline"
            >
              <RefreshCw className="size-3.5" />
              {copy.retry}
            </button>
          </section>
        ) : null}

        {isInitialLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="aspect-video animate-pulse bg-gray-100" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </section>
        ) : items.length === 0 ? (
          <section className="rounded-lg border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Film className="size-6" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-950">
              {copy.emptyTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              {copy.emptyBody}
            </p>
            <Button asChild className="mt-5 bg-gray-950 text-white hover:bg-gray-800">
              <Link href={createHref}>{copy.create}</Link>
            </Button>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const video = isVideoItem(item);
                const label = itemLabel(item, copy);

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-video bg-gray-100">
                      {video && item.videoUrl ? (
                        <video
                          src={item.videoUrl}
                          className="size-full object-cover"
                          controls
                          playsInline
                          preload="metadata"
                        />
                      ) : item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={label}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-gray-400">
                          {video ? (
                            <Film className="size-8" />
                          ) : (
                            <ImageIcon className="size-8" />
                          )}
                        </div>
                      )}
                      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-gray-800 shadow-sm">
                        {video ? (
                          <Film className="size-3.5" />
                        ) : (
                          <ImageIcon className="size-3.5" />
                        )}
                        {video ? copy.videoResult : copy.imageResult}
                      </div>
                    </div>
                    <div className="space-y-4 p-4">
                      <div>
                        <h2 className="line-clamp-1 text-sm font-semibold text-gray-950">
                          {label}
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                          {copy.created} {formatDate(item.createdAt, locale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                          <a href={item.assetUrl} target="_blank" rel="noreferrer">
                            {copy.open}
                          </a>
                        </Button>
                        <Button asChild variant="ghost" size="icon">
                          <a
                            href={item.assetUrl}
                            download
                            aria-label={copy.download}
                            title={copy.download}
                          >
                            <Download className="size-4" />
                          </a>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={item.isFavorite ? copy.unfavorite : copy.favorite}
                          title={item.isFavorite ? copy.unfavorite : copy.favorite}
                          onClick={() =>
                            void patchItem(item, { isFavorite: !item.isFavorite })
                          }
                        >
                          <Heart
                            className={cn(
                              'size-4',
                              item.isFavorite && 'fill-rose-500 text-rose-500'
                            )}
                          />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-auto text-gray-500 hover:text-red-600"
                          aria-label={copy.delete}
                          title={copy.delete}
                          onClick={() => void deleteItem(item)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="flex items-center justify-center">
              {hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isValidating}
                  onClick={() => void setSize(size + 1)}
                >
                  {isValidating ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {copy.loadMore}
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  {total} {copy.filters[filter].toLowerCase()}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
