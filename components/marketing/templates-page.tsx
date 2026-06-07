'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Eye, Loader2, Search, Video, X } from 'lucide-react';
import {
  getLocalizedHref,
  type Locale,
} from '@/lib/marketing/content';
import { getTemplateCategoryLabel } from '@/lib/templates/catalog';
import { imageToVideoTemplateCategories } from '@/lib/templates/category-config';
import { publicTemplatesPageContent } from '@/lib/templates/public-content';
import {
  getPublicTemplateMediaUrl,
  isPublicTemplateVideo,
  normalizePublicTemplateCategories,
  normalizePublicTemplateDetail,
  normalizePublicTemplateItems,
  uniquePublicTemplates,
  type PublicTemplateDetailItem,
  type PublicTemplateItem,
  type PublicTemplatesApiResponse,
} from '@/lib/templates/public-client';
import { cn } from '@/lib/utils';

const templateType = 'image_to_video';
const defaultTemplateCategory: string = imageToVideoTemplateCategories[0] ?? '';

function getTemplateWorkbenchPath(template: PublicTemplateItem) {
  const params = new URLSearchParams({ templateId: template.id });
  return `/create/video?${params.toString()}`;
}

function categoryLabel(template: PublicTemplateItem, locale: Locale) {
  return (
    (template.category
      ? getTemplateCategoryLabel(template.category, locale)
      : null) ||
    publicTemplatesPageContent[locale].defaultCategory
  );
}

function TemplateMedia({
  locale,
  template,
}: {
  locale: Locale;
  template: PublicTemplateItem;
}) {
  const mediaUrl = getPublicTemplateMediaUrl(template);
  const [isHovering, setIsHovering] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoadFailed, setPreviewLoadFailed] = useState(false);

  useEffect(() => {
    if (!isHovering || previewUrl || previewLoadFailed) return;

    let ignore = false;
    const controller = new AbortController();

    async function loadPreview() {
      try {
        const params = new URLSearchParams({ locale });
        const response = await fetch(`/api/templates/${template.id}?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('template-preview-load-failed');
        }

        const detail = normalizePublicTemplateDetail(await response.json());
        if (!detail?.previewUrl) {
          throw new Error('template-preview-invalid');
        }

        if (!ignore) {
          setPreviewUrl(detail.previewUrl);
        }
      } catch {
        if (!ignore) {
          setPreviewLoadFailed(true);
        }
      }
    }

    loadPreview();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [isHovering, locale, previewLoadFailed, previewUrl, template.id]);

  if (!mediaUrl) {
    return (
      <div className="flex size-full items-center justify-center bg-gray-100 text-gray-300">
        <Video className="size-10" />
      </div>
    );
  }

  const previewIsActive = isHovering && previewUrl;

  return (
    <div
      className="relative size-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={() => setIsHovering(false)}
    >
      {isPublicTemplateVideo(template) ? (
        <video
          src={mediaUrl}
          className="size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={mediaUrl}
          alt=""
          className="size-full object-cover transition duration-700 group-hover:scale-105"
        />
      )}
      {previewIsActive ? (
        <video
          key={previewUrl}
          src={previewUrl}
          poster={template.thumbnailUrl}
          className="absolute inset-0 size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
      ) : null}
    </div>
  );
}

function TemplateCard({
  locale,
  onDetails,
  template,
}: {
  locale: Locale;
  onDetails: (template: PublicTemplateItem) => void;
  template: PublicTemplateItem;
}) {
  const content = publicTemplatesPageContent[locale];
  const category = categoryLabel(template, locale);

  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <TemplateMedia locale={locale} template={template} />
        <div className="absolute left-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-white/92 px-2.5 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur">
          <Video className="size-3.5 text-orange-600" />
          {category}
        </div>
      </div>
      <div className="grid min-h-[190px] content-between gap-5 p-5">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
              {template.type}
            </span>
            <span className="max-w-[12rem] truncate text-xs font-medium text-gray-500">
              {content.idLabel}: {template.id}
            </span>
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-gray-950">
            {template.title}
          </h2>
        </div>
        <div>
          <p className="mb-3 text-xs text-gray-500">{content.loginHint}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onDetails(template)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              <Eye className="size-4" />
              {content.viewDetails}
            </button>
            <Link
              href={getLocalizedHref(
                locale,
                `/login?redirect=${encodeURIComponent(getTemplateWorkbenchPath(template))}`
              )}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-gray-950 px-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {content.useTemplate}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function DetailMedia({ detail }: { detail: PublicTemplateDetailItem }) {
  if (detail.type === 'image_to_video') {
    return (
      <video
        src={detail.previewUrl}
        poster={detail.thumbnailUrl}
        className="aspect-[4/5] w-full rounded-lg bg-gray-100 object-cover"
        autoPlay
        controls
        loop
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={detail.previewUrl}
      alt=""
      className="aspect-[4/5] w-full rounded-lg bg-gray-100 object-cover"
    />
  );
}

function TemplateDetailModal({
  detail,
  error,
  isLoading,
  locale,
  onClose,
  template,
}: {
  detail: PublicTemplateDetailItem | null;
  error: boolean;
  isLoading: boolean;
  locale: Locale;
  onClose: () => void;
  template: PublicTemplateItem;
}) {
  const content = publicTemplatesPageContent[locale];
  const title = detail?.title ?? template.title;

  return (
    <div className="fixed inset-0 z-50 bg-gray-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto grid max-h-[calc(100dvh-48px)] max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-gray-950">
              {title}
            </h2>
            <p className="mt-1 truncate font-mono text-xs text-gray-500">
              {template.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-950"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-5">
          {isLoading ? (
            <div className="grid min-h-[420px] place-items-center text-sm font-semibold text-gray-500">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {content.loading}
              </span>
            </div>
          ) : error || !detail ? (
            <div className="grid min-h-[360px] place-items-center text-center">
              <div>
                <p className="text-sm font-semibold text-gray-950">
                  {content.error}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 inline-flex h-10 items-center rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-900"
                >
                  {content.clearFilters}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
              <DetailMedia detail={detail} />
              <div className="grid content-between gap-5">
                <div>
                  <div className="mb-3 inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {detail.type}
                  </div>
                  <h3 className="text-sm font-semibold uppercase text-gray-500">
                    {content.promptLabel}
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-800">
                    {detail.prompt}
                  </p>
                </div>
                <Link
                  href={getLocalizedHref(
                    locale,
                    `/login?redirect=${encodeURIComponent(getTemplateWorkbenchPath(template))}`
                  )}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  {content.useTemplate}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
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
      <span>{label}</span>
    </button>
  );
}

function TemplateGridSkeleton({ label }: { label: string }) {
  return (
    <div aria-busy="true" aria-label={label}>
      <div className="sr-only">{label}</div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            <div className="aspect-[4/5] animate-pulse bg-gray-200" />
            <div className="space-y-4 p-5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
              <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketingTemplatesPage({ locale }: { locale: Locale }) {
  const content = publicTemplatesPageContent[locale];
  const [templates, setTemplates] = useState<PublicTemplateItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    ...imageToVideoTemplateCategories,
  ]);
  const [activeCategory, setActiveCategory] = useState<string>(
    defaultTemplateCategory
  );
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [detailTemplate, setDetailTemplate] =
    useState<PublicTemplateItem | null>(null);
  const [templateDetail, setTemplateDetail] =
    useState<PublicTemplateDetailItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialType = params.get('type');
    const initialCategory = params.get('category')?.trim() ?? '';

    if (initialType && initialType !== templateType) {
      params.set('type', templateType);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }

    setActiveCategory(initialCategory || defaultTemplateCategory);
  }, []);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function loadTemplates() {
      setIsLoading(true);
      setError(false);

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: '12',
          type: 'image_to_video',
          locale,
        });
        if (activeCategory) params.set('category', activeCategory);
        if (search.trim()) params.set('search', search.trim());
        const response = await fetch(`/api/templates?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('template-load-failed');
        }

        const data = (await response.json()) as PublicTemplatesApiResponse;
        const remoteTemplates = normalizePublicTemplateItems(data);
        const remoteCategories = normalizePublicTemplateCategories(data);

        if (!ignore) {
          if (remoteCategories.length) {
            setCategories(remoteCategories);
            if (!activeCategory || !remoteCategories.includes(activeCategory)) {
              setActiveCategory(remoteCategories[0]);
              setPage(1);
            }
          }
          setTemplates((current) =>
            page === 1
              ? remoteTemplates
              : uniquePublicTemplates([...current, ...remoteTemplates])
          );
          setHasMore(Boolean(data.hasMore));
        }
      } catch {
        if (!ignore) {
          if (page === 1) {
            setTemplates([]);
          }
          setError(true);
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
      controller.abort();
    };
  }, [activeCategory, locale, page, reloadKey, search]);

  useEffect(() => {
    if (!detailTemplate) return;

    const templateId = detailTemplate.id;
    let ignore = false;
    const controller = new AbortController();

    async function loadTemplateDetail() {
      setIsLoadingDetail(true);
      setDetailError(false);
      setTemplateDetail(null);

      try {
        const params = new URLSearchParams({ locale });
        const response = await fetch(`/api/templates/${templateId}?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('template-detail-load-failed');
        }

        const detail = normalizePublicTemplateDetail(await response.json());
        if (!detail) {
          throw new Error('template-detail-invalid');
        }

        if (!ignore) {
          setTemplateDetail(detail);
        }
      } catch {
        if (!ignore) {
          setDetailError(true);
        }
      } finally {
        if (!ignore) {
          setIsLoadingDetail(false);
        }
      }
    }

    loadTemplateDetail();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [detailTemplate, locale]);

  function clearFilters() {
    setActiveCategory(categories[0] ?? defaultTemplateCategory);
    setSearch('');
    setPage(1);
  }

  function retry() {
    setPage(1);
    setReloadKey((value) => value + 1);
  }

  const showInitialLoading = templates.length === 0 && isLoading && !error;
  const activeCategoryLabel = activeCategory
    ? getTemplateCategoryLabel(activeCategory, locale)
    : content.categoryFilterLabel;

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
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4">
              <div className="text-sm font-semibold text-white">
                {content.defaultCategory}
              </div>
              <div className="mt-1 text-xs uppercase text-white/50">
                {templateType}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="mb-6 grid gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-950">
                {content.categoryFilterLabel}
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-gray-500 transition hover:text-gray-950"
              >
                {content.clearFilters}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <CategoryChip
                  key={category}
                  active={activeCategory === category}
                  label={getTemplateCategoryLabel(category, locale)}
                  onClick={() => {
                    setActiveCategory(category);
                    setPage(1);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="self-end">
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
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="font-medium text-gray-950">
            {content.categoryFilterLabel}: {activeCategoryLabel}
          </span>
        </div>

        {showInitialLoading ? (
          <TemplateGridSkeleton label={content.loading} />
        ) : templates.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                locale={locale}
                onDetails={setDetailTemplate}
                template={template}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-[420px] place-items-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-950">
                {error ? content.error : content.emptyTitle}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-600">
                {content.emptyText}
              </p>
              <button
                type="button"
                onClick={error ? retry : clearFilters}
                className="mt-5 inline-flex h-10 items-center rounded-md bg-gray-950 px-4 text-sm font-semibold text-white"
              >
                {error ? content.retry : content.clearFilters}
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
              {isLoading ? content.loadingMore : content.loadMore}
            </button>
          </div>
        ) : null}
      </section>
      {detailTemplate ? (
        <TemplateDetailModal
          detail={templateDetail}
          error={detailError}
          isLoading={isLoadingDetail}
          locale={locale}
          onClose={() => {
            setDetailTemplate(null);
            setTemplateDetail(null);
            setDetailError(false);
          }}
          template={detailTemplate}
        />
      ) : null}
    </main>
  );
}
