'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, PlayCircle, Sparkles } from 'lucide-react';

import type { DashboardLocale } from '@/lib/dashboard/content';
import { withDashboardLocale } from '@/lib/dashboard/locale-url';
import {
  getTemplateCategoryLabel,
  templateTypeLabels,
  type TemplateType,
} from '@/lib/templates/catalog';
import {
  normalizePublicTemplateItems,
  type PublicTemplateItem,
  type PublicTemplatesApiResponse,
} from '@/lib/templates/public-client';
import { cn } from '@/lib/utils';

type GalleryTemplateType = Exclude<TemplateType, 'model'>;
type GalleryType = GalleryTemplateType | 'all';
type GalleryStatus = 'loading' | 'ready' | 'error';

type TemplateBucket = {
  hasMore: boolean;
  items: PublicTemplateItem[];
  page: number;
  total: number;
};

type GalleryCopy = {
  title: string;
  subtitle: string;
  all: string;
  total: string;
  loading: string;
  error: string;
  retry: string;
  empty: string;
  useTemplate: string;
};

const galleryTypes: GalleryTemplateType[] = [
  'image_to_video',
  'image_to_image',
  'try_on',
];
const galleryPageSize = 12;

const copyByLocale: Record<DashboardLocale, GalleryCopy> = {
  pt: {
    title: 'Praça de inspiração',
    subtitle:
      'Veja o total e filtre por tipo para partir de templates reais do catálogo.',
    all: 'Todos',
    total: 'Total',
    loading: 'Carregando',
    error: 'Não foi possível carregar as inspirações.',
    retry: 'Tentar novamente',
    empty: 'Nenhum template disponível ainda.',
    useTemplate: 'Usar',
  },
  en: {
    title: 'Inspiration Gallery',
    subtitle:
      'See the total and filter by type to start from real catalog templates.',
    all: 'All',
    total: 'Total',
    loading: 'Loading',
    error: 'Could not load inspiration.',
    retry: 'Try again',
    empty: 'No templates are available yet.',
    useTemplate: 'Use',
  },
  zh: {
    title: '灵感广场',
    subtitle: '查看 total 和各类型模板，选中后直接进入对应工作台。',
    all: '全部精选',
    total: 'Total',
    loading: '正在加载',
    error: '灵感加载失败。',
    retry: '重试',
    empty: '暂无可用模板。',
    useTemplate: '使用模板',
  },
};

function emptyBucket(): TemplateBucket {
  return { hasMore: false, items: [], page: 0, total: 0 };
}

function templateHref(item: PublicTemplateItem, locale: DashboardLocale) {
  if (item.type === 'image_to_video') {
    return withDashboardLocale(`/create/video?templateId=${item.id}`, locale);
  }

  if (item.type === 'image_to_image') {
    return withDashboardLocale(`/create/apparel?templateId=${item.id}`, locale);
  }

  return withDashboardLocale(`/create/try-on?templateId=${item.id}`, locale);
}

function interleaveItems(buckets: Record<GalleryTemplateType, TemplateBucket>) {
  const maxLength = Math.max(
    ...galleryTypes.map((type) => buckets[type].items.length)
  );
  const items: PublicTemplateItem[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    for (const type of galleryTypes) {
      const item = buckets[type].items[index];
      if (item) items.push(item);
    }
  }

  return items;
}

function useTemplateGallery(locale: DashboardLocale) {
  const [status, setStatus] = useState<GalleryStatus>('loading');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [buckets, setBuckets] = useState<
    Record<GalleryTemplateType, TemplateBucket>
  >({
    image_to_video: emptyBucket(),
    image_to_image: emptyBucket(),
    try_on: emptyBucket(),
  });
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function loadTemplates() {
      setStatus('loading');
      try {
        const responses = await Promise.all(
          galleryTypes.map(async (type) => {
            const params = new URLSearchParams({
              page: '1',
              pageSize: String(galleryPageSize),
              type,
              locale,
            });
            const response = await fetch(`/api/templates?${params}`, {
              signal: controller.signal,
            });

            if (!response.ok) {
              throw new Error(`Failed to load ${type}`);
            }

            const data = (await response.json()) as PublicTemplatesApiResponse;
            const total = typeof data.total === 'number' ? data.total : 0;
            return [
              type,
              {
                hasMore:
                  typeof data.hasMore === 'boolean'
                    ? data.hasMore
                    : galleryPageSize < total,
                items: normalizePublicTemplateItems(data),
                page: 1,
                total,
              },
            ] as const;
          })
        );

        if (!ignore) {
          setBuckets(
            Object.fromEntries(responses) as Record<
              GalleryTemplateType,
              TemplateBucket
            >
          );
          setStatus('ready');
        }
      } catch {
        if (!ignore) {
          setStatus('error');
        }
      }
    }

    loadTemplates();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [locale, reloadKey]);

  const loadMore = useCallback(
    async (active: GalleryType) => {
      if (status !== 'ready' || loadingMoreRef.current) return;

      const typesToLoad =
        active === 'all'
          ? galleryTypes.filter((type) => buckets[type].hasMore)
          : buckets[active].hasMore
            ? [active]
            : [];

      if (typesToLoad.length === 0) return;

      loadingMoreRef.current = true;
      setIsLoadingMore(true);

      try {
        const responses = await Promise.all(
          typesToLoad.map(async (type) => {
            const nextPage = buckets[type].page + 1;
            const params = new URLSearchParams({
              page: String(nextPage),
              pageSize: String(galleryPageSize),
              type,
              locale,
            });
            const response = await fetch(`/api/templates?${params}`);

            if (!response.ok) {
              throw new Error(`Failed to load ${type} page ${nextPage}`);
            }

            const data = (await response.json()) as PublicTemplatesApiResponse;
            const items = normalizePublicTemplateItems(data);
            const total =
              typeof data.total === 'number' ? data.total : buckets[type].total;
            const page = typeof data.page === 'number' ? data.page : nextPage;
            const hasMore =
              typeof data.hasMore === 'boolean'
                ? data.hasMore
                : page * galleryPageSize < total;

            return { hasMore, items, page, total, type };
          })
        );

        setBuckets((current) => {
          const next = { ...current };

          for (const result of responses) {
            const previous = next[result.type];
            const seen = new Set(previous.items.map((item) => item.id));
            const items = [
              ...previous.items,
              ...result.items.filter((item) => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
              }),
            ];

            next[result.type] = {
              hasMore: result.hasMore,
              items,
              page: result.page,
              total: result.total,
            };
          }

          return next;
        });
      } finally {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    },
    [buckets, locale, status]
  );

  return {
    buckets,
    isLoadingMore,
    loadMore,
    reload: () => setReloadKey((value) => value + 1),
    status,
  };
}

function GalleryTabs({
  active,
  buckets,
  copy,
  locale,
  onChange,
}: {
  active: GalleryType;
  buckets: Record<GalleryTemplateType, TemplateBucket>;
  copy: GalleryCopy;
  locale: DashboardLocale;
  onChange: (type: GalleryType) => void;
}) {
  const total = galleryTypes.reduce(
    (sum, type) => sum + buckets[type].total,
    0
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-base font-black text-gray-700 md:gap-8 md:text-lg">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'rounded-full px-4 py-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2',
          active === 'all' && 'bg-gray-100 text-gray-950'
        )}
      >
        {copy.all}
        <span className="ml-2 text-xs font-bold text-gray-400">{total}</span>
      </button>
      {galleryTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'rounded-full px-4 py-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2',
            active === type && 'bg-gray-100 text-gray-950'
          )}
        >
          {templateTypeLabels[type][locale]}
          <span className="ml-2 text-xs font-bold text-gray-400">
            {buckets[type].total}
          </span>
        </button>
      ))}
    </div>
  );
}

function GalleryCard({
  index,
  item,
  locale,
  useTemplate,
}: {
  index: number;
  item: PublicTemplateItem;
  locale: DashboardLocale;
  useTemplate: string;
}) {
  const categoryLabel = item.category
    ? getTemplateCategoryLabel(item.category, locale)
    : templateTypeLabels[item.type][locale];

  return (
    <Link
      href={templateHref(item, locale)}
      className="group mb-5 block break-inside-avoid overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-gray-100 transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)]"
    >
      <div
        className={cn(
          'relative overflow-hidden bg-gray-100',
          index % 5 === 0 && 'aspect-[4/5]',
          index % 5 === 1 && 'aspect-[1/1]',
          index % 5 === 2 && 'aspect-[5/4]',
          index % 5 === 3 && 'aspect-[3/4]',
          index % 5 === 4 && 'aspect-[4/3]'
        )}
      >
        <img
          src={item.thumbnailUrl}
          alt=""
          className="size-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {item.type === 'image_to_video' ? (
          <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-gray-950 shadow-sm backdrop-blur">
            <PlayCircle className="size-5" />
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="truncate text-sm font-bold text-gray-800">
          {item.title || categoryLabel}
        </span>
        <span className="shrink-0 text-xs font-bold text-indigo-600">
          {useTemplate}
        </span>
      </div>
    </Link>
  );
}

export function DashboardInspirationGallery({
  locale,
}: {
  locale: DashboardLocale;
}) {
  const copy = copyByLocale[locale];
  const [active, setActive] = useState<GalleryType>('all');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { buckets, isLoadingMore, loadMore, reload, status } =
    useTemplateGallery(locale);
  const total = galleryTypes.reduce(
    (sum, type) => sum + buckets[type].total,
    0
  );
  const remoteItems = useMemo(() => {
    if (active === 'all') return interleaveItems(buckets);
    return buckets[active].items;
  }, [active, buckets]);
  const hasMore =
    active === 'all'
      ? galleryTypes.some((type) => buckets[type].hasMore)
      : buckets[active].hasMore;

  useEffect(() => {
    if (status !== 'ready' || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void loadMore(active);
        }
      },
      {
        rootMargin: '720px 0px',
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [active, hasMore, loadMore, status]);

  return (
    <section className="bg-white px-5 pb-20 pt-12 md:px-8 md:pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="relative inline-flex text-4xl font-black tracking-tight text-gray-950 md:text-5xl">
            {copy.title}
            <span className="absolute -bottom-2 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-sky-300/80" />
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-semibold leading-7 text-gray-500 md:text-base">
            {copy.subtitle}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-700">
            <Sparkles className="size-4 text-indigo-500" />
            {copy.total}
            <span className="text-indigo-600">{total}</span>
          </div>
        </div>

        <div className="mt-8">
          <GalleryTabs
            active={active}
            buckets={buckets}
            copy={copy}
            locale={locale}
            onChange={setActive}
          />
        </div>

        {status === 'loading' ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-gray-400">
            <Loader2 className="size-4 animate-spin" />
            {copy.loading}
          </div>
        ) : null}

        {status === 'error' ? (
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center rounded-lg border border-gray-200 bg-gray-50 px-5 py-6 text-center">
            <p className="text-sm font-bold text-gray-700">{copy.error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-sm font-bold text-gray-800 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              {copy.retry}
            </button>
          </div>
        ) : null}

        {status === 'ready' && remoteItems.length === 0 ? (
          <p className="mt-8 text-center text-sm font-bold text-gray-500">
            {copy.empty}
          </p>
        ) : null}

        {status === 'ready' && remoteItems.length > 0 ? (
          <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-5">
            {remoteItems.map((item, index) => (
              <GalleryCard
                key={`${item.id}-${active}-${index}`}
                index={index}
                item={item}
                locale={locale}
                useTemplate={copy.useTemplate}
              />
            ))}
          </div>
        ) : null}

        <div ref={sentinelRef} className="mt-2 flex h-12 items-center justify-center">
          {isLoadingMore ? (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-400">
              <Loader2 className="size-4 animate-spin" />
              {copy.loading}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
