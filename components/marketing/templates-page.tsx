'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Filter,
  ImageIcon,
  Search,
  SlidersHorizontal,
  Video,
  X,
} from 'lucide-react';
import {
  getLocalizedHref,
  type Locale,
} from '@/lib/marketing/content';
import {
  getStarterTemplates,
  getTemplateTagGroupLabel,
  getTemplateTagLabel,
  templateTagGroups,
  templateTagOptions,
  templatesPageContent,
  type TemplateCatalogItem,
  type TemplateTagGroup,
} from '@/lib/templates/catalog';
import { cn } from '@/lib/utils';

type SortKey = 'featured' | 'newest' | 'lowCost';
type TemplateCategory = TemplateCatalogItem['category'];

const templateCategories: TemplateCategory[] = [
  'image_to_image',
  'image_to_video',
  'try_on',
];

type TemplatesApiResponse = {
  list?: TemplateCatalogItem[];
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
};

function uniqueById(items: TemplateCatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeTemplateCategory(value: string | null): TemplateCategory | null {
  return templateCategories.includes(value as TemplateCategory)
    ? (value as TemplateCategory)
    : null;
}

function TemplateMedia({ template }: { template: TemplateCatalogItem }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
      {template.mediaType === 'video' ? (
        <video
          src={template.asset}
          className="size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={template.asset}
          alt=""
          className="size-full object-cover transition duration-700 group-hover:scale-105"
        />
      )}
      <div className="absolute left-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-white/92 px-2.5 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur">
        {template.mediaType === 'video' ? (
          <Video className="size-3.5 text-orange-600" />
        ) : (
          <ImageIcon className="size-3.5 text-emerald-600" />
        )}
        {template.costCredits}
      </div>
    </div>
  );
}

function getTemplateWorkbenchPath(template: TemplateCatalogItem) {
  const basePath =
    template.category === 'image_to_video'
      ? '/create/video'
      : template.category === 'try_on'
        ? '/create/try-on'
        : '/create/apparel';
  const params = new URLSearchParams();

  if (template.source === 'starter') {
    params.set('prompt', template.prompt);
  } else {
    params.set('templateId', template.id);
  }

  return `${basePath}?${params.toString()}`;
}

function TemplateCard({
  content,
  locale,
  template,
}: {
  content: (typeof templatesPageContent)[Locale];
  locale: Locale;
  template: TemplateCatalogItem;
}) {
  const visibleTags = template.tags.slice(0, 4);

  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg">
      <TemplateMedia template={template} />
      <div className="grid min-h-[300px] content-between gap-5 p-5">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              {content.categoryLabels[template.category]}
            </span>
            <span className="text-xs font-medium text-gray-500">
              {template.costCredits} {content.costSuffix}
              {template.costCredits === 1 ? '' : 's'}
            </span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-950">
            {template.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {template.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700"
              >
                {getTemplateTagLabel(tag, locale)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-xs text-gray-500">{content.loginHint}</p>
          <Link
            href={getLocalizedHref(
              locale,
              `/login?redirect=${encodeURIComponent(getTemplateWorkbenchPath(template))}`
            )}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            {content.useTemplate}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function FilterChip({
  active,
  count,
  label,
  onClick,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition',
        active
          ? 'border-gray-950 bg-gray-950 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      {active ? <Check className="size-3.5" /> : null}
      <span>{label}</span>
      <span
        className={cn(
          'rounded bg-gray-100 px-1.5 py-0.5 text-[11px]',
          active && 'bg-white/15 text-white'
        )}
      >
        {count}
      </span>
    </button>
  );
}

function FilterGroup({
  activeTags,
  group,
  locale,
  tagCounts,
  onToggle,
}: {
  activeTags: Set<string>;
  group: TemplateTagGroup;
  locale: Locale;
  tagCounts: Map<string, number>;
  onToggle: (tag: string) => void;
}) {
  const options = templateTagOptions.filter((tag) => tag.group === group);

  return (
    <div className="border-b border-gray-200 py-5 last:border-b-0">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-950">
        <Filter className="size-4 text-orange-600" />
        {getTemplateTagGroupLabel(group, locale)}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const count = tagCounts.get(tag.slug) ?? 0;
          if (count === 0) {
            return null;
          }

          return (
            <FilterChip
              key={tag.slug}
              active={activeTags.has(tag.slug)}
              count={count}
              label={tag.labels[locale]}
              onClick={() => onToggle(tag.slug)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function MarketingTemplatesPage({ locale }: { locale: Locale }) {
  const content = templatesPageContent[locale];
  const starterTemplates = useMemo(() => getStarterTemplates(locale), [locale]);
  const [templates, setTemplates] = useState<TemplateCatalogItem[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<TemplateCategory | null>(null);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('featured');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const activeTagKey = useMemo(
    () => Array.from(activeTags).sort().join(','),
    [activeTags]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCategory = normalizeTemplateCategory(params.get('category'));

    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadTemplates() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: '12',
          sort,
        });
        const query = search.trim();
        if (query) {
          params.set('search', query);
        }
        if (activeCategory) {
          params.set('category', activeCategory);
        }
        for (const tag of activeTagKey.split(',').filter(Boolean)) {
          params.append('tag', tag);
        }

        const response = await fetch(`/api/templates?${params.toString()}`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as TemplatesApiResponse;
        const remoteTemplates = data.list ?? [];

        if (!ignore) {
          const normalizedRemoteTemplates = remoteTemplates.map((template) => ({
            ...template,
            source: 'admin' as const,
          }));
          const starterFallbackTemplates = activeCategory
            ? starterTemplates.filter(
                (template) => template.category === activeCategory
              )
            : starterTemplates;
          const shouldUseStarterFallback =
            page === 1 &&
            normalizedRemoteTemplates.length === 0 &&
            !query &&
            !activeTagKey;

          setTemplates((current) =>
            page === 1
              ? uniqueById(
                  shouldUseStarterFallback
                    ? starterFallbackTemplates
                    : normalizedRemoteTemplates
                )
              : uniqueById([...current, ...normalizedRemoteTemplates])
          );
          setTotal(
            shouldUseStarterFallback
              ? starterFallbackTemplates.length
              : data.total ?? normalizedRemoteTemplates.length
          );
          setHasMore(shouldUseStarterFallback ? false : Boolean(data.hasMore));
        }
      } catch {
        if (!ignore && page === 1 && !search.trim() && !activeTagKey) {
          const starterFallbackTemplates = activeCategory
            ? starterTemplates.filter(
                (template) => template.category === activeCategory
              )
            : starterTemplates;
          setTemplates(starterFallbackTemplates);
          setTotal(starterFallbackTemplates.length);
          setHasMore(false);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadTemplates();

    return () => {
      ignore = true;
    };
  }, [activeCategory, activeTagKey, locale, page, search, sort, starterTemplates]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const template of templates) {
      for (const tag of template.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return counts;
  }, [templates]);

  function toggleTag(tag: string) {
    setActiveTags((current) => {
      const next = new Set(current);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
    setPage(1);
  }

  function toggleCategory(category: TemplateCategory) {
    setActiveCategory((current) => (current === category ? null : category));
    setPage(1);
  }

  function clearFilters() {
    setActiveCategory(null);
    setActiveTags(new Set());
    setSearch('');
    setSort('featured');
    setPage(1);
  }

  return (
    <main className="bg-white">
      <section className="border-b border-white/10 bg-gray-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-16">
          <div>
            <div className="mb-4 inline-flex rounded-md bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-white/70">
              {content.eyebrow}
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-5xl">
              {content.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-white/62">
              {content.description}
            </p>
          </div>
          <div className="grid content-end gap-3 lg:justify-end">
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-white/[0.06] p-2">
              {(['goal', 'channel', 'cost'] as TemplateTagGroup[]).map(
                (group) => (
                  <div key={group} className="rounded-md bg-white/8 p-3">
                    <div className="text-2xl font-semibold">
                      {
                        templateTagOptions.filter((tag) => tag.group === group)
                          .length
                      }
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      {getTemplateTagGroupLabel(group, locale)}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[280px_1fr] lg:px-8 lg:py-10">
        <aside className="self-start rounded-lg border border-gray-200 bg-gray-50 p-4 lg:sticky lg:top-24">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
              <SlidersHorizontal className="size-4 text-orange-600" />
              Templates
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-gray-500 transition hover:text-gray-950"
            >
              {content.clearFilters}
            </button>
          </div>
          <div className="border-b border-gray-200 pb-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-950">
              <Filter className="size-4 text-orange-600" />
              {content.categoryFilterLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {templateCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium transition',
                    activeCategory === category
                      ? 'border-gray-950 bg-gray-950 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {content.categoryLabels[category]}
                </button>
              ))}
            </div>
          </div>
          {templateTagGroups.map(({ group }) => (
            <FilterGroup
              key={group}
              activeTags={activeTags}
              group={group}
              locale={locale}
              tagCounts={tagCounts}
              onToggle={toggleTag}
            />
          ))}
        </aside>

        <div>
          <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={content.searchPlaceholder}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-10 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-950"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </label>
            <label className="flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700">
              <span className="whitespace-nowrap text-xs font-semibold uppercase text-gray-400">
                {content.sortLabel}
              </span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SortKey);
                  setPage(1);
                }}
                className="h-full min-w-36 bg-transparent text-sm font-medium text-gray-950 outline-none"
              >
                {Object.entries(content.sortOptions).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium text-gray-950">
              {total || templates.length}
            </span>
            <span>{content.results}</span>
            {activeCategory ? (
              <button
                type="button"
                onClick={() => toggleCategory(activeCategory)}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-gray-100 px-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                {content.categoryLabels[activeCategory]}
                <X className="size-3" />
              </button>
            ) : null}
            {Array.from(activeTags).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="inline-flex h-7 items-center gap-1 rounded-md bg-gray-100 px-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                {getTemplateTagLabel(tag, locale)}
                <X className="size-3" />
              </button>
            ))}
          </div>

          {templates.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard
                  key={`${template.source}-${template.id}`}
                  content={content}
                  locale={locale}
                  template={template}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  {content.emptyTitle}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
                  {content.emptyText}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 inline-flex h-10 items-center rounded-md bg-gray-950 px-4 text-sm font-semibold text-white"
                >
                  {content.clearFilters}
                </button>
              </div>
            </div>
          )}
          {hasMore ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPage((value) => value + 1)}
                disabled={isLoading}
                className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? locale === 'zh'
                    ? '加载中...'
                    : 'Loading...'
                  : locale === 'zh'
                    ? '加载更多'
                    : 'Load more'}
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
