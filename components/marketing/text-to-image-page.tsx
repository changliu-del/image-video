import Link from 'next/link';
import {
  Copy,
  ImageIcon,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  getMarketingContent,
  getLocalizedHref,
  type Locale,
} from '@/lib/marketing/content';

type MarketingContent = ReturnType<typeof getMarketingContent>;
type TextToImageContent = MarketingContent['textToImage'];
type ExampleItem = TextToImageContent['examples']['items'][number];

function ExampleCard({
  example,
  labels,
}: {
  example: ExampleItem;
  labels: Pick<TextToImageContent['examples'], 'imageLabel' | 'promptLabel'>;
}) {
  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.06] shadow-sm transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(135deg,#f8fafc,#eef2ff_45%,#fff7ed)]">
        {example.asset ? (
          <img
            src={example.asset}
            alt=""
            className="size-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center p-6">
            <div className="w-full rounded-lg bg-white/85 p-5 shadow-sm">
              <div className="mb-5 h-20 rounded-lg bg-gray-900" />
              <div className="h-3 w-4/5 rounded-full bg-gray-900" />
              <div className="mt-2 h-3 w-1/2 rounded-full bg-gray-400" />
            </div>
          </div>
        )}
        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800 shadow-sm backdrop-blur">
          <ImageIcon className="size-3.5 text-emerald-600" />
          {labels.imageLabel}
        </div>
      </div>
      <div className="p-5">
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

function TextImageHero({
  content,
  locale,
}: {
  content: TextToImageContent;
  locale: Locale;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-gray-950">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617,#111827_55%,#030712)]" />
      <div className="relative grid w-full gap-6 p-4 md:grid-cols-[1.05fr_0.95fr] md:p-8 lg:p-10 xl:p-12">
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
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/45">
            {content.hero.promptLabel}
          </label>
          <textarea
            placeholder={content.hero.promptPlaceholder}
            aria-label={content.hero.promptLabel}
            className="min-h-[220px] w-full resize-none rounded-lg border border-white/10 bg-white/[0.07] px-5 py-5 text-base leading-7 text-white outline-none transition placeholder:text-white/35 hover:border-white/25 focus:border-white/60 focus:ring-2 focus:ring-white/10 md:min-h-[250px]"
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
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex flex-wrap gap-2 text-xs">
              {content.hero.chips.map((chip) => (
                <span key={chip} className="rounded-full bg-white/10 px-3 py-1 text-white/58">
                  {chip}
                </span>
              ))}
            </div>
            <Link
              href={getLocalizedHref(locale, '/login')}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-sm font-semibold text-gray-950 transition hover:bg-white/90"
            >
              {content.hero.generate}
              <span className="ml-2 text-gray-500">{content.hero.credit}</span>
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.07] p-4 shadow-xl backdrop-blur">
          <div className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-white/15 bg-gray-950/60">
            <img
              src="/resources/showcase.png"
              alt=""
              className="max-h-[560px] max-w-full rounded-lg object-contain p-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Examples({ content }: { content: TextToImageContent['examples'] }) {
  return (
    <section className="bg-gray-950 py-20 text-white md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/65">
              <Sparkles className="size-3.5 text-amber-300" />
              {content.eyebrow}
            </div>
            <h2 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight md:text-4xl">
              {content.title}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/55">
            {content.description}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.items.map((example) => (
            <ExampleCard key={example.title} example={example} labels={content} />
          ))}
        </div>
      </div>
    </section>
  );
}

function System({ content }: { content: TextToImageContent['system'] }) {
  const icons = [ImageIcon, Palette, Sparkles, ShieldCheck];

  return (
    <section className="border-t border-white/10 bg-gray-950 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/65">
            <Sparkles className="size-3.5 text-amber-300" />
            {content.eyebrow}
          </div>
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
          {content.steps.map((step, index) => {
            const Icon = icons[index] ?? ImageIcon;

            return (
              <div
                key={step.title}
                className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.055] p-5 sm:grid-cols-[56px_1fr]"
              >
                <Icon className="size-6 text-cyan-200" />
                <div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">{step.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MarketingTextToImagePage({ locale }: { locale: Locale }) {
  const content = getMarketingContent(locale).textToImage;

  return (
    <main className="bg-gray-950">
      <TextImageHero content={content} locale={locale} />
      <Examples content={content.examples} />
      <System content={content.system} />
    </main>
  );
}
