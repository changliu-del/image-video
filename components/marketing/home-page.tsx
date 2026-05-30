import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Copy,
  ImageIcon,
  Layers,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Video,
  WandSparkles,
} from 'lucide-react';
import {
  getLocalizedHref,
  getMarketingContent,
  type Locale,
} from '@/lib/marketing/content';
import { cn } from '@/lib/utils';

type MarketingContent = ReturnType<typeof getMarketingContent>;
type HomeContent = MarketingContent['home'];
type ExampleItem = HomeContent['examples']['items'][number];

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
        'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/65',
        className
      )}
    >
      <Sparkles className="size-3.5 text-amber-300" />
      {children}
    </div>
  );
}

function MediaTile({
  example,
  labels,
}: {
  example: ExampleItem;
  labels: Pick<HomeContent['examples'], 'imageLabel' | 'promptLabel' | 'videoLabel'>;
}) {
  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.06] shadow-sm transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09]">
      <div
        className={cn(
          'relative aspect-[9/16] overflow-hidden',
          example.asset
            ? 'bg-gray-900'
            : 'bg-[linear-gradient(135deg,#f8fafc,#eef2ff_45%,#fff7ed)]'
        )}
      >
        {example.asset && example.mediaType === 'video' ? (
          <video
            src={example.asset}
            className="size-full object-cover transition duration-700 group-hover:scale-105"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : example.asset ? (
          <img
            src={example.asset}
            alt=""
            className="size-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-end p-5">
            <div className="w-full rounded-lg bg-white/85 p-4 shadow-sm">
              <div className="mb-4 size-16 rounded-lg bg-gray-900" />
              <div className="h-3 w-3/4 rounded-full bg-gray-900" />
              <div className="mt-2 h-3 w-1/2 rounded-full bg-gray-400" />
            </div>
          </div>
        )}
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800 shadow-sm backdrop-blur">
          {example.mediaType === 'video' ? (
            <Video className="size-3.5 text-rose-500" />
          ) : (
            <ImageIcon className="size-3.5 text-emerald-600" />
          )}
          {example.mediaType === 'video' ? labels.videoLabel : labels.imageLabel}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-white">{example.title}</h3>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/35">
          {example.category}
        </p>
        <p className="mt-4 min-h-16 text-sm leading-6 text-white/58">
          {example.text}
        </p>
        <button
          type="button"
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white"
        >
          <Copy className="size-3.5" />
          {labels.promptLabel}
        </button>
      </div>
    </article>
  );
}

function GeneratorHero({
  content,
}: {
  content: HomeContent;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gray-950">
      <div className="absolute inset-0">
        <video
          src="/bg.mp4"
          className="size-full object-cover opacity-35"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.94),rgba(17,24,39,0.78)_55%,rgba(0,0,0,0.92))]" />
      </div>
      <div className="relative grid w-full gap-6 p-4 md:grid-cols-[1.08fr_0.92fr] md:p-8 lg:p-10 xl:p-12">
        <div className="rounded-lg border border-white/10 bg-gray-900/88 p-5 text-white shadow-2xl backdrop-blur md:p-7">
          <div className="mb-6 max-w-3xl">
            <div className="mb-3 inline-flex rounded-full bg-gray-950 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white">
              {content.hero.eyebrow}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
              {content.hero.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
              {content.hero.description}
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <label className="relative flex min-h-[310px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/20 bg-white/[0.06] transition hover:bg-white/[0.09]">
              <div className="flex flex-col items-center gap-3 p-5 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-white text-gray-950">
                  <Upload className="size-5" />
                </div>
                <span className="text-sm font-medium text-white">
                  {content.hero.uploadTitle}
                </span>
                <span className="text-xs leading-5 text-white/45">
                  {content.hero.uploadHint}
                </span>
              </div>
              <input type="file" className="hidden" accept="image/*" />
            </label>
            <div className="flex min-h-[310px] flex-col">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/45">
                {content.hero.promptLabel}
              </label>
              <textarea
                className="min-h-[170px] flex-1 resize-none rounded-lg border border-white/10 bg-white/[0.07] px-4 py-4 text-sm leading-6 text-white outline-none transition placeholder:text-white/35 hover:border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/10"
                placeholder={content.hero.promptPlaceholder}
              />
              <button
                type="button"
                className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.045] px-4 py-3 text-left transition hover:bg-white/[0.07]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <SlidersHorizontal className="size-4 text-cyan-200" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">
                      {content.hero.settingsTitle}
                    </span>
                    <span className="block truncate text-xs text-white/45">
                      {content.hero.settingsMeta}
                    </span>
                  </span>
                </span>
                <span className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/65">
                  {content.hero.settingsAction}
                </span>
              </button>
              <Link
                href="/sign-in"
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-gray-950 transition hover:bg-white/90"
              >
                {content.hero.generate}
                <span className="ml-2 text-gray-500">{content.hero.credit}</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex min-h-[560px] items-center justify-center rounded-lg border border-white/15 bg-white/[0.07] p-5 backdrop-blur-md">
          <div className="relative mx-auto aspect-[9/16] h-full max-h-[560px] overflow-hidden rounded-[28px] border-[10px] border-gray-950 bg-gray-950 shadow-2xl">
            <video
              src="/aivideo.mp4"
              className="size-full object-cover"
              loop
              autoPlay
              muted
              playsInline
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExampleLibrary({ content }: { content: HomeContent['examples'] }) {
  return (
    <section className="bg-gray-950 py-20 text-white md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Eyebrow>{content.eyebrow}</Eyebrow>
            <h2 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">
              {content.title}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/55">
            {content.description}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((example) => (
            <MediaTile key={example.title} example={example} labels={content} />
          ))}
        </div>
      </div>
    </section>
  );
}

function SystemSection({ content }: { content: HomeContent['system'] }) {
  return (
    <section className="border-y border-white/10 bg-gray-950 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>{content.eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/58 md:text-base">
            {content.description}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10">
            {content.stats.map((stat) => (
              <div key={stat.label} className="bg-white/[0.06] p-5">
                <div className="text-3xl font-bold text-white">{stat.stat}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/45">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          {content.steps.map((step, index) => (
            <div
              key={step.title}
              className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-5 sm:grid-cols-[56px_1fr]"
            >
              <div className="text-3xl font-bold text-white/25">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhatSection({ content }: { content: HomeContent['what'] }) {
  const icons = [Rocket, WandSparkles, BadgeCheck];

  return (
    <section className="bg-gray-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-cyan-200">{content.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 text-sm leading-7 text-white/58 md:text-base">
            {content.description}
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {content.items.map((item, index) => {
            const Icon = icons[index] ?? CheckCircle2;

            return (
              <div
                key={item.title}
                className="rounded-lg border border-white/10 bg-white/[0.055] p-5"
              >
                <Icon className="size-6 text-cyan-200" />
                <h3 className="mt-5 font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowSection({ content }: { content: HomeContent['how'] }) {
  return (
    <section className="border-y border-white/10 bg-gray-900 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {content.title}
          </h2>
          <p className="mt-3 text-sm text-white/55">{content.description}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {content.steps.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-white/10 bg-white/[0.055] p-5"
            >
              <div className="flex items-center justify-between">
                <Layers className="size-6 text-amber-300" />
                <span className="text-sm font-semibold text-white/35">
                  {index + 1}
                </span>
              </div>
              <p className="mt-5 text-sm leading-6 text-white/62">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ content }: { content: HomeContent['features'] }) {
  const icons = [Video, Sparkles, Rocket, WandSparkles, Copy, ShieldCheck];

  return (
    <section className="bg-gray-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {content.title}
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/58">
            {content.description}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, index) => {
            const Icon = icons[index] ?? CheckCircle2;

            return (
              <div
                key={item.title}
                className="rounded-lg border border-white/10 bg-white/[0.055] p-5"
              >
                <Icon className="size-6 text-emerald-300" />
                <h3 className="mt-5 font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ content }: { content: HomeContent['faq'] }) {
  return (
    <section className="border-y border-white/10 bg-gray-900 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-[0.7fr_1.3fr]">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          {content.title}
        </h2>
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
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {content.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
            {content.description}
          </p>
        </div>
        <Link
          href={getLocalizedHref(locale, '/pricing')}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-semibold text-gray-950 transition hover:bg-white/90"
        >
          {content.action}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export function MarketingHomePage({ locale }: { locale: Locale }) {
  const content = getMarketingContent(locale).home;

  return (
    <main className="bg-gray-950">
      <GeneratorHero content={content} />
      <ExampleLibrary content={content.examples} />
      <SystemSection content={content.system} />
      <WhatSection content={content.what} />
      <HowSection content={content.how} />
      <FeaturesSection content={content.features} />
      <FaqSection content={content.faq} />
      <CtaSection content={content.cta} locale={locale} />
    </main>
  );
}
