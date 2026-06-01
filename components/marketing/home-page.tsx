'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ImageIcon,
  Layers,
  Rocket,
  Sparkles,
  Video,
  WandSparkles,
} from 'lucide-react';
import {
  getLocalizedHref,
  getMarketingContent,
  type Locale,
} from '@/lib/marketing/content';
import type { TemplateCatalogItem } from '@/lib/templates/catalog';
import { cn } from '@/lib/utils';

type MarketingContent = ReturnType<typeof getMarketingContent>;
type HomeContent = MarketingContent['home'];
type StaticTemplateItem = HomeContent['templates']['items'][number];
type TemplateItem = {
  slug: string;
  title: string;
  asset: string;
  mediaType: 'image' | 'video';
  category: string;
  cost: string;
  hook: string;
  useCase: string;
};

type TemplatesApiResponse = {
  list?: TemplateCatalogItem[];
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
};

function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase text-white/65',
        className
      )}
    >
      <Sparkles className="size-3.5 text-amber-300" />
      {children}
    </div>
  );
}

function TemplateHero({
  content,
  locale,
}: {
  content: HomeContent;
  locale: Locale;
}) {
  return (
    <section className="relative overflow-hidden bg-gray-950 text-white">
      <div className="absolute inset-0">
        <video
          src="/bg.mp4"
          className="size-full object-cover opacity-35"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(2,6,23,0.96),rgba(15,23,42,0.82)_48%,rgba(17,24,39,0.5))]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 md:px-8 md:py-14 lg:min-h-[560px] lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:py-10">
        <div className="max-w-3xl">
          <Eyebrow>{content.hero.eyebrow}</Eyebrow>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight text-white md:text-5xl lg:text-[50px]">
            {content.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
            {content.hero.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={getLocalizedHref(locale, '#templates')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-gray-950 transition hover:bg-white/90"
            >
              {content.hero.primaryAction}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href={getLocalizedHref(locale, '/templates?type=image')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {content.hero.secondaryAction}
            </Link>
          </div>

          <div className="mt-8 hidden max-w-2xl gap-3 sm:grid sm:grid-cols-3">
            {content.hero.stats.map((stat) => (
              <div key={stat.label} className="border-l border-white/15 pl-4">
                <div className="text-2xl font-bold text-white">{stat.stat}</div>
                <div className="mt-1 text-xs font-medium uppercase text-white/45">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden gap-4 lg:grid lg:grid-cols-[0.78fr_1fr] lg:items-center">
          <div className="hidden gap-4 lg:grid">
            {content.hero.previewItems.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/[0.07] p-4 text-sm leading-6 text-white/72 backdrop-blur"
              >
                <CheckCircle2 className="mb-3 size-4 text-emerald-300" />
                {item}
              </div>
            ))}
          </div>
          <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-lg border border-white/15 bg-gray-950 shadow-2xl">
            <video
              src="/aivideo.mp4"
              className="size-full object-cover"
              loop
              autoPlay
              muted
              playsInline
            />
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.9))] p-5">
              <p className="text-xs font-medium uppercase text-emerald-200">
                {content.hero.previewTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/78">
                {content.hero.previewText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TemplateMedia({ item }: { item: TemplateItem }) {
  if (item.mediaType === 'video') {
    return (
      <video
        src={item.asset}
        className="size-full object-cover transition duration-700 group-hover:scale-105"
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return (
    <img
      src={item.asset}
      alt=""
      className="size-full object-cover transition duration-700 group-hover:scale-105"
    />
  );
}

function TemplateCard({
  item,
  actionLabel,
  locale,
}: {
  item: TemplateItem;
  actionLabel: string;
  locale: Locale;
}) {
  return (
    <article className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <TemplateMedia item={item} />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur">
          {item.mediaType === 'video' ? (
            <Video className="size-3.5 text-rose-500" />
          ) : (
            <ImageIcon className="size-3.5 text-emerald-600" />
          )}
          {item.category}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-950">{item.title}</h3>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {item.cost}
          </span>
        </div>
        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm font-medium leading-6 text-gray-800">
          "{item.hook}"
        </p>
        <p className="mt-3 min-h-12 text-sm leading-6 text-gray-600">
          {item.useCase}
        </p>
        <Link
          href={getLocalizedHref(locale, '/login')}
          className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          {actionLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

function TemplateGallery({
  content,
  locale,
}: {
  content: HomeContent['templates'];
  locale: Locale;
}) {
  const [items, setItems] = useState<TemplateItem[]>(
    content.items.map(mapStaticTemplateItem)
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadTemplates() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          locale,
          page: String(page),
          pageSize: '6',
          sort: 'featured',
        });
        const response = await fetch(`/api/templates?${params.toString()}`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as TemplatesApiResponse;
        const remoteItems = (data.list ?? []).map(mapCatalogTemplateItem);

        if (!ignore) {
          setItems((current) => {
            if (page === 1) {
              return remoteItems.length > 0
                ? remoteItems
                : content.items.map(mapStaticTemplateItem);
            }

            return uniqueHomeItems([...current, ...remoteItems]);
          });
          setHasMore(Boolean(data.hasMore));
        }
      } catch {
        if (!ignore && page === 1) {
          setItems(content.items.map(mapStaticTemplateItem));
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
  }, [content.items, locale, page]);

  return (
    <section id="templates" className="scroll-mt-24 bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Eyebrow className="border-gray-200 bg-white text-gray-600">
              {content.eyebrow}
            </Eyebrow>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-gray-950 md:text-5xl">
              {content.title}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-gray-600 md:text-base">
            {content.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <TemplateCard
              key={item.slug}
              item={item}
              actionLabel={content.actionLabel}
              locale={locale}
            />
          ))}
        </div>
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
  );
}

function mapStaticTemplateItem(item: StaticTemplateItem): TemplateItem {
  return {
    slug: item.title,
    title: item.title,
    asset: item.asset,
    mediaType: item.mediaType,
    category: item.category,
    cost: item.cost,
    hook: item.hook,
    useCase: item.useCase,
  };
}

function mapCatalogTemplateItem(template: TemplateCatalogItem): TemplateItem {
  return {
    slug: template.slug,
    title: template.title,
    asset: template.asset,
    mediaType: template.mediaType,
    category: template.type === 'image_to_video' ? 'Image to video' : template.type,
    cost: `${template.costCredits} ${template.costCredits === 1 ? 'credit' : 'credits'}`,
    hook: template.hook,
    useCase: template.description,
  };
}

function uniqueHomeItems(items: TemplateItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) {
      return false;
    }
    seen.add(item.slug);
    return true;
  });
}

function WorkflowSection({ content }: { content: HomeContent['workflow'] }) {
  const icons = [ImageIcon, WandSparkles, Video];

  return (
    <section className="bg-white py-20 text-gray-950 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-3xl">
          <Eyebrow className="border-gray-200 bg-slate-50 text-gray-600">
            {content.eyebrow}
          </Eyebrow>
          <h2 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
            {content.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-base">
            {content.description}
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {content.steps.map((step, index) => {
            const Icon = icons[index] ?? Layers;

            return (
              <article
                key={step.title}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-gray-950 text-white">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold text-gray-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{step.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ content }: { content: HomeContent['faq'] }) {
  return (
    <section className="border-y border-white/10 bg-gray-950 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            {content.title}
          </h2>
        </div>
        <div className="grid gap-3">
          {content.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-white/10 bg-white/[0.055] px-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-white">
                {item.question}
                <span className="text-white/35 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm leading-7 text-white/55">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({
  content,
  locale,
}: {
  content: HomeContent['cta'];
  locale: Locale;
}) {
  return (
    <section className="bg-gray-950 py-20 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-200">
            <Rocket className="size-4" />
            <span>{content.action}</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight md:text-4xl">
            {content.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
            {content.description}
          </p>
        </div>
        <Link
          href={getLocalizedHref(locale, '/login')}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-gray-950 transition hover:bg-white/90"
        >
          <BadgeCheck className="size-4" />
          {content.action}
        </Link>
      </div>
    </section>
  );
}

export function MarketingHomePage({ locale }: { locale: Locale }) {
  const content = getMarketingContent(locale).home;

  return (
    <main className="bg-white">
      <TemplateHero content={content} locale={locale} />
      <TemplateGallery content={content.templates} locale={locale} />
      <WorkflowSection content={content.workflow} />
      <FaqSection content={content.faq} />
      <CtaSection content={content.cta} locale={locale} />
    </main>
  );
}
