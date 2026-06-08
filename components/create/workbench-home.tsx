'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ImageIcon,
  Loader2,
  PlayCircle,
  Shirt,
  Sparkles,
  Video,
} from 'lucide-react';

import type { DashboardLocale } from '@/lib/dashboard/content';
import { withDashboardLocale } from '@/lib/dashboard/locale-url';
import {
  workbenchHomeFallbackImages,
  workbenchHomeMedia,
} from '@/lib/marketing/homepage-materials';
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

type WorkbenchHomeCopy = {
  eyebrow: string;
  heroAction: string;
  loading: string;
  error: string;
  empty: string;
  retry: string;
  total: string;
  inspirationTitle: string;
  inspirationSubtitle: string;
  all: string;
  useTemplate: string;
  typeCount: (count: number) => string;
  hero: Record<
    TemplateType,
    {
      tab: string;
      title: string;
      bullets: string[];
      href: string;
      media: string;
      floatingLabel: string;
      floatingText: string;
    }
  >;
};

type TemplateBucket = {
  items: PublicTemplateItem[];
  total: number;
};

type GalleryStatus = 'idle' | 'loading' | 'ready' | 'error';
type GalleryType = TemplateType | 'all';

const templateTypes: TemplateType[] = [
  'image_to_video',
  'image_to_image',
  'try_on',
];

const workbenchHomeCopy: Record<DashboardLocale, WorkbenchHomeCopy> = {
  pt: {
    eyebrow: 'AI criativo',
    heroAction: 'Comecar agora',
    loading: 'Carregando inspiracoes',
    error: 'Nao foi possivel carregar as inspiracoes.',
    empty: 'Nenhum template disponivel ainda.',
    retry: 'Tentar novamente',
    total: 'Total',
    inspirationTitle: 'Praca de inspiracao',
    inspirationSubtitle:
      'Escolha um tipo e use templates reais para entrar direto no fluxo certo.',
    all: 'Todos',
    useTemplate: 'Usar template',
    typeCount: (count) => `${count} templates`,
    hero: {
      image_to_video: {
        tab: 'Imagem para video',
        title: 'Transforme a foto do produto em video de prova real',
        bullets: [
          'Use referencias de movimento para criar videos curtos de venda',
          'Preserve o produto enquanto a cena ganha ritmo e contexto',
          'Ideal para social commerce, PDP e campanhas de lancamento',
        ],
        href: '/create/video',
        media: workbenchHomeMedia.imageToVideo.asset,
        floatingLabel: 'Video de prova',
        floatingText: 'Lente em modelo real',
      },
      image_to_image: {
        tab: 'Imagem de produto',
        title: 'Conecte cenas ricas e crie imagens de produto premium',
        bullets: [
          'Templates de cena para vitrine, natureza, datas e interiores',
          'Gere imagens comerciais sem ajustar parametros complexos',
          'Transforme fotos simples em materiais de campanha',
        ],
        href: '/create/apparel',
        media: workbenchHomeMedia.productImage.asset,
        floatingLabel: 'Cena de produto',
        floatingText: 'Imagem comercial pronta',
      },
      try_on: {
        tab: 'Provador virtual',
        title: 'Veja roupas no corpo sem organizar uma sessao de fotos',
        bullets: [
          'Combine peca e modelo com pose, fundo e caimento controlados',
          'Use templates de fundo para resultados consistentes',
          'Crie imagens de moda para catalogo, loja e social',
        ],
        href: '/create/try-on',
        media: workbenchHomeMedia.tryOn.asset,
        floatingLabel: 'Look em movimento',
        floatingText: 'Moda com modelo',
      },
    },
  },
  en: {
    eyebrow: 'AI creation',
    heroAction: 'Start now',
    loading: 'Loading inspiration',
    error: 'Could not load inspiration.',
    empty: 'No templates are available yet.',
    retry: 'Try again',
    total: 'Total',
    inspirationTitle: 'Inspiration Gallery',
    inspirationSubtitle:
      'Pick a type and start from real templates wired to the right workspace.',
    all: 'All',
    useTemplate: 'Use template',
    typeCount: (count) => `${count} templates`,
    hero: {
      image_to_video: {
        tab: 'Image to video',
        title: 'Turn product photos into realistic try-on videos',
        bullets: [
          'Use motion references to create short product videos',
          'Keep the product faithful while the scene gains rhythm',
          'Built for social commerce, PDPs, and launch campaigns',
        ],
        href: '/create/video',
        media: workbenchHomeMedia.imageToVideo.asset,
        floatingLabel: 'Try-on video',
        floatingText: 'Lens on a real model',
      },
      image_to_image: {
        tab: 'Product image',
        title: 'Connect rich scenes and create premium product images',
        bullets: [
          'Scene templates for showcases, nature, festivals, and interiors',
          'Create commercial images without complex setup',
          'Turn plain product photos into campaign-ready material',
        ],
        href: '/create/apparel',
        media: workbenchHomeMedia.productImage.asset,
        floatingLabel: 'Product scene',
        floatingText: 'Commercial image ready',
      },
      try_on: {
        tab: 'Virtual try-on',
        title: 'Show apparel on a model without a photoshoot',
        bullets: [
          'Combine garments and models with controlled pose, scene, and fit',
          'Use background templates for consistent results',
          'Create fashion images for catalogs, stores, and social',
        ],
        href: '/create/try-on',
        media: workbenchHomeMedia.tryOn.asset,
        floatingLabel: 'Fashion motion',
        floatingText: 'Model-led apparel',
      },
    },
  },
  zh: {
    eyebrow: 'AI创作',
    heroAction: '开始试用',
    loading: '正在加载灵感',
    error: '灵感加载失败。',
    empty: '暂无可用模板。',
    retry: '重试',
    total: 'Total',
    inspirationTitle: '灵感广场',
    inspirationSubtitle: '按类型浏览真实模板数据，选中后直接进入对应工作台。',
    all: '全部精选',
    useTemplate: '使用模板',
    typeCount: (count) => `${count} 个模板`,
    hero: {
      image_to_video: {
        tab: '图生视频',
        title: '美瞳真人试戴，一张图片秒变种草视频',
        bullets: [
          '上传商品图，快速生成真人试戴和商品展示短片',
          '保留商品颜色与质感，让画面更像真实拍摄',
          '适合上新、详情页、社媒投放和达人素材',
        ],
        href: '/create/video',
        media: workbenchHomeMedia.imageToVideo.asset,
        floatingLabel: '视频示例',
        floatingText: '美瞳真人试戴',
      },
      image_to_image: {
        tab: '商品图',
        title: '一键连接丰富场景，创造大片级商品图',
        bullets: [
          '智能匹配商品场景模板，无需复杂设置',
          '多种生成方式，创意表达丰富，轻松展现产品魅力',
          '告别平凡商品图，打造电影级视觉盛宴',
        ],
        href: '/create/apparel',
        media: workbenchHomeMedia.productImage.asset,
        floatingLabel: '商品图示例',
        floatingText: '实景商品展示',
      },
      try_on: {
        tab: '智能试衣',
        title: '一键将平铺服饰图，转换成上身效果',
        bullets: [
          '无需模特拍摄，轻松呈现服饰上身效果',
          '套装上身，在线搭配，节省时间与精力',
          '还原服饰色彩与质感，让每一件衣服都能惊艳呈现',
        ],
        href: '/create/try-on',
        media: workbenchHomeMedia.tryOn.asset,
        floatingLabel: '服饰图示例',
        floatingText: '动态时尚 Lookbook',
      },
    },
  },
};

const heroIcons: Record<TemplateType, typeof Video> = {
  image_to_video: Video,
  image_to_image: ImageIcon,
  try_on: Shirt,
};

const fallbackItems: PublicTemplateItem[] = workbenchHomeFallbackImages.map(
  (image, index) => {
    const type = templateTypes[index % templateTypes.length];
    return {
      id: `fallback-${index}`,
      title: '',
      type,
      category: '',
      thumbnailUrl: image,
      previewUrl: image,
      createdAt: null,
      updatedAt: null,
    };
  }
);

function emptyBucket(): TemplateBucket {
  return { items: [], total: 0 };
}

function GalleryMedia({ item }: { item: PublicTemplateItem }) {
  return (
    <img
      src={item.thumbnailUrl}
      alt=""
      className="size-full object-cover transition duration-700 group-hover:scale-105"
      loading="lazy"
      decoding="async"
    />
  );
}

function templateHref(item: PublicTemplateItem, locale: DashboardLocale) {
  if (item.type === 'image_to_video') {
    return withDashboardLocale(`/create/video?templateId=${item.id}`, locale);
  }

  if (item.type === 'image_to_image') {
    return withDashboardLocale('/create/apparel', locale);
  }

  return withDashboardLocale('/create/try-on', locale);
}

function interleaveTemplateItems(buckets: Record<TemplateType, TemplateBucket>) {
  const maxLength = Math.max(
    ...templateTypes.map((type) => buckets[type].items.length)
  );
  const items: PublicTemplateItem[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    for (const type of templateTypes) {
      const item = buckets[type].items[index];
      if (item) items.push(item);
    }
  }

  return items;
}

function useTemplateGallery(locale: DashboardLocale) {
  const [status, setStatus] = useState<GalleryStatus>('idle');
  const [reloadKey, setReloadKey] = useState(0);
  const [buckets, setBuckets] = useState<Record<TemplateType, TemplateBucket>>({
    image_to_video: emptyBucket(),
    image_to_image: emptyBucket(),
    try_on: emptyBucket(),
  });

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function loadTemplates() {
      setStatus('loading');
      try {
        const responses = await Promise.all(
          templateTypes.map(async (type) => {
            const params = new URLSearchParams({
              page: '1',
              pageSize: '12',
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
            return [
              type,
              {
                items: normalizePublicTemplateItems(data),
                total: typeof data.total === 'number' ? data.total : 0,
              },
            ] as const;
          })
        );

        if (!ignore) {
          setBuckets(Object.fromEntries(responses) as Record<TemplateType, TemplateBucket>);
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

  return {
    buckets,
    reload: () => setReloadKey((value) => value + 1),
    status,
  };
}

function HeroTabs({
  activeType,
  copy,
  onChange,
}: {
  activeType: TemplateType;
  copy: WorkbenchHomeCopy;
  onChange: (type: TemplateType) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-7 text-lg font-bold text-gray-500 md:text-xl">
      {templateTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'relative pb-2 transition hover:text-gray-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-4',
            activeType === type && 'text-gray-950'
          )}
        >
          {copy.hero[type].tab}
          {activeType === type ? (
            <span className="absolute inset-x-0 bottom-0 h-px bg-gray-950" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

function HeroVisual({
  activeType,
  copy,
}: {
  activeType: TemplateType;
  copy: WorkbenchHomeCopy;
}) {
  const hero = copy.hero[activeType];
  const Icon = heroIcons[activeType];

  return (
    <div className="relative">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[28px] bg-gray-100 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <video
          key={hero.media}
          src={hero.media}
          className="size-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_58%,rgba(15,23,42,0.16))]" />
      </div>

      <div className="absolute -right-3 top-5 w-[34%] min-w-28 overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:-right-8 sm:top-8">
        <div className="aspect-[4/5] overflow-hidden rounded-[18px] bg-gray-100">
          <video
            key={`${hero.media}-mini`}
            src={hero.media}
            className="size-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        </div>
        <div className="flex items-center gap-2 px-1 py-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Icon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-gray-950">
              {hero.floatingLabel}
            </p>
            <p className="truncate text-[10px] font-semibold text-gray-400">
              {hero.floatingText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection({
  activeType,
  copy,
  locale,
  onTypeChange,
}: {
  activeType: TemplateType;
  copy: WorkbenchHomeCopy;
  locale: DashboardLocale;
  onTypeChange: (type: TemplateType) => void;
}) {
  const hero = copy.hero[activeType];

  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:px-8 lg:min-h-[560px] lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-16">
        <div className="max-w-[560px]">
          <p className="text-3xl font-black tracking-tight text-indigo-600">
            {copy.eyebrow}
          </p>
          <div className="mt-8">
            <HeroTabs
              activeType={activeType}
              copy={copy}
              onChange={onTypeChange}
            />
          </div>
          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-gray-950 md:text-5xl">
            {hero.title}
          </h1>
          <div className="mt-6 grid gap-3">
            {hero.bullets.map((bullet) => (
              <div
                key={bullet}
                className="flex items-start gap-3 text-base font-semibold leading-7 text-gray-600"
              >
                <Check className="mt-1 size-5 shrink-0 text-gray-950" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
          <Link
            href={withDashboardLocale(hero.href, locale)}
            className="mt-8 inline-flex h-14 min-w-56 items-center justify-center gap-2 rounded-full border border-indigo-500 bg-white px-7 text-base font-bold text-indigo-600 transition hover:bg-indigo-50"
          >
            {copy.heroAction}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <HeroVisual activeType={activeType} copy={copy} />
      </div>
    </section>
  );
}

function GalleryTabs({
  active,
  buckets,
  copy,
  onChange,
}: {
  active: GalleryType;
  buckets: Record<TemplateType, TemplateBucket>;
  copy: WorkbenchHomeCopy;
  onChange: (type: GalleryType) => void;
}) {
  const total = templateTypes.reduce(
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
      {templateTypes.map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            'rounded-full px-4 py-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2',
            active === type && 'bg-gray-100 text-gray-950'
          )}
        >
          {copy.hero[type].tab}
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
        <GalleryMedia item={item} />
        <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.72))] px-4 pb-4 pt-12 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-1 text-sm font-bold text-white">
            {item.title || categoryLabel}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/75">
            {categoryLabel}
          </p>
        </div>
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

function GallerySection({
  active,
  buckets,
  copy,
  locale,
  onTypeChange,
  onRetry,
  status,
}: {
  active: GalleryType;
  buckets: Record<TemplateType, TemplateBucket>;
  copy: WorkbenchHomeCopy;
  locale: DashboardLocale;
  onTypeChange: (type: GalleryType) => void;
  onRetry: () => void;
  status: GalleryStatus;
}) {
  const total = templateTypes.reduce(
    (sum, type) => sum + buckets[type].total,
    0
  );
  const remoteItems = useMemo(() => {
    if (active === 'all') return interleaveTemplateItems(buckets);
    return buckets[active].items;
  }, [active, buckets]);
  const items = remoteItems.length > 0 ? remoteItems : fallbackItems;
  const visibleItems = items.slice(0, 18);
  const totalCountLabel = status === 'ready' ? total : fallbackItems.length;

  return (
    <section className="bg-white px-5 pb-20 pt-8 md:px-8 md:pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="relative inline-flex text-4xl font-black tracking-tight text-gray-950 md:text-5xl">
            {copy.inspirationTitle}
            <span className="absolute -bottom-2 left-1/2 h-2 w-24 -translate-x-1/2 rounded-full bg-sky-300/80" />
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-semibold leading-7 text-gray-500 md:text-base">
            {copy.inspirationSubtitle}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-black text-gray-700">
            <Sparkles className="size-4 text-indigo-500" />
            {copy.total}
            <span className="text-indigo-600">{totalCountLabel}</span>
          </div>
        </div>

        <div className="mt-8">
          <GalleryTabs
            active={active}
            buckets={buckets}
            copy={copy}
            onChange={onTypeChange}
          />
        </div>

        {status === 'error' ? (
          <div className="mx-auto mt-8 flex max-w-md flex-col items-center rounded-lg border border-gray-200 bg-gray-50 px-5 py-6 text-center">
            <p className="text-sm font-bold text-gray-700">{copy.error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-sm font-bold text-gray-800 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              {copy.retry}
            </button>
          </div>
        ) : null}

        {status === 'loading' ? (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-gray-400">
            <Loader2 className="size-4 animate-spin" />
            {copy.loading}
          </div>
        ) : null}

        {status === 'ready' && remoteItems.length === 0 ? (
          <p className="mt-8 text-center text-sm font-bold text-gray-500">
            {copy.empty}
          </p>
        ) : null}

        <div className="mt-10 columns-1 gap-5 sm:columns-2 lg:columns-4 xl:columns-5">
          {visibleItems.map((item, index) => (
            <GalleryCard
              key={`${item.id}-${active}-${index}`}
              index={index}
              item={item}
              locale={locale}
              useTemplate={copy.useTemplate}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function WorkbenchHome({ locale }: { locale: DashboardLocale }) {
  const copy = workbenchHomeCopy[locale];
  const [activeHeroType, setActiveHeroType] =
    useState<TemplateType>('image_to_video');
  const [activeGalleryType, setActiveGalleryType] =
    useState<GalleryType>('all');
  const { buckets, reload, status } = useTemplateGallery(locale);

  return (
    <main className="min-h-[calc(100dvh-58px)] bg-white text-gray-950">
      <HeroSection
        activeType={activeHeroType}
        copy={copy}
        locale={locale}
        onTypeChange={(type) => {
          setActiveHeroType(type);
          setActiveGalleryType(type);
        }}
      />
      <GallerySection
        active={activeGalleryType}
        buckets={buckets}
        copy={copy}
        locale={locale}
        onRetry={reload}
        onTypeChange={(type) => {
          setActiveGalleryType(type);
          if (type !== 'all') setActiveHeroType(type);
        }}
        status={status}
      />
    </main>
  );
}
