import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  ImageIcon,
  Library,
  PlayCircle,
  Shirt,
  Sparkles,
  Video,
} from 'lucide-react';

import { getUser } from '@/lib/db/queries';
import {
  normalizeDashboardLocale,
  type DashboardLocale,
} from '@/lib/dashboard/content';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type DashboardPageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

type FeatureKey = 'video' | 'product' | 'tryOn' | 'library';

type FeatureCopy = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  action: string;
  href: string;
};

type DashboardCopy = {
  hubEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroAnnouncement: string;
  heroAnnouncementAction: string;
  overviewCards: Array<{
    title: string;
    text: string;
  }>;
  featureLabels: Record<FeatureKey, string>;
  features: Record<FeatureKey, FeatureCopy>;
  libraryTabs: string[];
};

const dashboardCopy: Record<DashboardLocale, DashboardCopy> = {
  pt: {
    hubEyebrow: 'Hub criativo',
    heroTitle: 'O que você quer criar hoje?',
    heroDescription:
      'Escolha um fluxo, use materiais da biblioteca e comece a produzir imagens ou vídeos de produto sem sair do estúdio.',
    heroAnnouncement: 'Novo provador virtual: suporte a modelos digitais para moda',
    heroAnnouncementAction: 'Explorar agora',
    overviewCards: [
      { title: 'Vídeo', text: 'Movimento curto para vitrines, PDP e social.' },
      { title: 'Imagem', text: 'Composição comercial com textura de campanha.' },
      { title: 'Provador', text: 'Modelo e peça combinados com aparência natural.' },
      { title: 'Materiais', text: 'Referências e imagens reutilizáveis para acelerar.' },
    ],
    featureLabels: {
      video: 'Imagem para vídeo',
      product: 'Imagem de produto',
      tryOn: 'Provador virtual',
      library: 'Biblioteca de materiais',
    },
    features: {
      video: {
        eyebrow: 'Imagem para vídeo',
        title: 'Faça a foto do produto ganhar movimento',
        description:
          'Envie a foto principal, escolha proporção e duração, e gere um vídeo curto com ritmo de campanha.',
        bullets: ['Prévia com foco no produto', 'Presets de roteiro e câmera', 'Formato pronto para social'],
        action: 'Abrir criação',
        href: '/create/video',
      },
      product: {
        eyebrow: 'Imagem de produto',
        title: 'Gere imagens comerciais com cara de campanha',
        description:
          'Crie banners, catálogo e imagens de venda com estilos consistentes para diferentes categorias.',
        bullets: ['Cenas localizadas', 'Estilos comerciais', 'Entrada por biblioteca ou upload'],
        action: 'Criar imagem',
        href: '/create/apparel',
      },
      tryOn: {
        eyebrow: 'Provador virtual',
        title: 'Mostre roupa no corpo sem ensaio fotográfico',
        description:
          'Combine modelo e peça, controle pose e cenário, e gere uma prova visual natural para moda.',
        bullets: ['Modelos próprios ou biblioteca', 'Uma ou várias peças', 'Controle de pose e fundo'],
        action: 'Experimentar',
        href: '/create/try-on',
      },
      library: {
        eyebrow: 'Biblioteca',
        title: 'Reaproveite materiais e referências vencedoras',
        description:
          'Organize exemplos, produtos e inspirações para transformar boas ideias em novas criações.',
        bullets: ['Referências por categoria', 'Materiais usados recentemente', 'Atalhos para criação'],
        action: 'Ver templates',
        href: '/templates',
      },
    },
    libraryTabs: ['Selecionados', 'Produto', 'Moda', 'Vídeo', 'Campanha'],
  },
  en: {
    hubEyebrow: 'Creative hub',
    heroTitle: 'What do you want to create today?',
    heroDescription:
      'Pick a flow, reuse library materials, and start producing product images or videos from one calm workspace.',
    heroAnnouncement: 'New virtual try-on: digital model support for fashion content',
    heroAnnouncementAction: 'Explore now',
    overviewCards: [
      { title: 'Video', text: 'Short motion for storefronts, PDPs, and social.' },
      { title: 'Image', text: 'Commercial compositions with campaign texture.' },
      { title: 'Try-on', text: 'Natural model and garment combinations.' },
      { title: 'Library', text: 'Reusable references and images for speed.' },
    ],
    featureLabels: {
      video: 'Image to video',
      product: 'Product image',
      tryOn: 'Virtual try-on',
      library: 'Material library',
    },
    features: {
      video: {
        eyebrow: 'Image to video',
        title: 'Make product photos move',
        description:
          'Upload a hero product image, choose ratio and duration, and generate a short campaign video.',
        bullets: ['Product-first preview', 'Camera and script presets', 'Social-ready output'],
        action: 'Open creator',
        href: '/create/video',
      },
      product: {
        eyebrow: 'Product image',
        title: 'Generate campaign-ready commercial images',
        description:
          'Create banners, catalog visuals, and sales images with consistent styles across categories.',
        bullets: ['Localized scenes', 'Commercial style presets', 'Library or upload input'],
        action: 'Create image',
        href: '/create/apparel',
      },
      tryOn: {
        eyebrow: 'Virtual try-on',
        title: 'Show apparel on models without a photoshoot',
        description:
          'Combine model and garment inputs, control pose and scene, and produce natural fashion visuals.',
        bullets: ['Custom or library models', 'Single or multi-garment', 'Pose and background control'],
        action: 'Try now',
        href: '/create/try-on',
      },
      library: {
        eyebrow: 'Library',
        title: 'Reuse winning materials and references',
        description:
          'Collect examples, products, and inspiration so good ideas can become new creations faster.',
        bullets: ['Category references', 'Recent materials', 'Creation shortcuts'],
        action: 'Browse templates',
        href: '/templates',
      },
    },
    libraryTabs: ['Featured', 'Product', 'Fashion', 'Video', 'Campaign'],
  },
  zh: {
    hubEyebrow: '创作枢纽',
    heroTitle: '今天要创作什么？',
    heroDescription:
      '选择一个创作流程，复用素材库里的商品、模特和参考图，快速开始生成商品内容。',
    heroAnnouncement: '【智能试衣】新增智能试衣功能，支持数字模特',
    heroAnnouncementAction: '立即探索',
    overviewCards: [
      { title: '图生视频', text: '商品图片秒变投放短视频。' },
      { title: '商品图', text: '生成活动、详情和目录图。' },
      { title: '智能试衣', text: '模特与服饰自然合成展示。' },
      { title: '素材库', text: '沉淀参考图和优质创意。' },
    ],
    featureLabels: {
      video: '图生视频',
      product: '商品图',
      tryOn: '智能试衣',
      library: '素材库',
    },
    features: {
      video: {
        eyebrow: '图生视频',
        title: '上传图片秒变视频，让你的商品动起来',
        description:
          '上传商品主图，选择比例和时长，即可生成适合上新、投放和社媒传播的商品短视频。',
        bullets: ['商品始终作为画面主体', '支持镜头与创意预设', '适配短视频和详情页场景'],
        action: '开始生成',
        href: '/create/video',
      },
      product: {
        eyebrow: '商品图',
        title: '一张商品图，延展出一组商业素材',
        description:
          '为不同品类生成本地化商品图、活动图和目录图，让商品展示更有 campaign 感。',
        bullets: ['支持上传或选择素材', '风格、场景、比例可控', '适合目录、广告和活动页'],
        action: '创作商品图',
        href: '/create/apparel',
      },
      tryOn: {
        eyebrow: '智能试衣',
        title: '无需重新拍摄，也能看见上身效果',
        description:
          '选择模特和服饰素材，控制姿态与背景，快速生成自然可信的服饰试穿图。',
        bullets: ['支持自定义模特素材', '单件/多件服饰组合', '姿势和背景可调整'],
        action: '打开试衣',
        href: '/create/try-on',
      },
      library: {
        eyebrow: '素材库',
        title: '把好素材沉淀下来，下次创作更快',
        description:
          '用素材库承载示例商品、模特、参考图和优质创意，减少每次从零开始的成本。',
        bullets: ['按类型浏览灵感', '复用最近素材', '一键进入对应创作流程'],
        action: '查看模板',
        href: '/templates',
      },
    },
    libraryTabs: ['全部精选', '商品图', '服饰图', '图生视频', '营销图'],
  },
};

const showcaseImages = [
  '/resources/example1.png',
  '/resources/example2.png',
  '/resources/example3.png',
  '/resources/example4.png',
  '/resources/example5.png',
  '/resources/example6.png',
];

function withDashboardLocale(href: string, locale: DashboardLocale) {
  if (href.startsWith('/templates')) {
    return `/${locale}${href}`;
  }

  const [pathname, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('locale', locale);
  return `${pathname}?${params.toString()}`;
}

function SectionIntro({
  feature,
  locale,
}: {
  feature: FeatureCopy;
  locale: DashboardLocale;
}) {
  return (
    <div>
      <p className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
        {feature.eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-black leading-tight text-gray-950 md:text-4xl">
        {feature.title}
      </h2>
      <p className="mt-4 text-base leading-8 text-gray-500">
        {feature.description}
      </p>
      <div className="mt-5 grid gap-3">
        {feature.bullets.map((bullet) => (
          <div key={bullet} className="flex items-start gap-3 text-sm font-semibold text-gray-700">
            <span className="mt-1.5 size-2 rounded-full bg-indigo-500" />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
      <Link
        href={withDashboardLocale(feature.href, locale)}
        className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-500"
      >
        {feature.action}
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function HeroShowcase({
  copy,
  locale,
}: {
  copy: DashboardCopy;
  locale: DashboardLocale;
}) {
  const cardLinks = ['/create/video', '/create/apparel', '/create/try-on', '/templates'];
  const icons = [Video, ImageIcon, Shirt, Library];
  const actions = [
    copy.features.video.action,
    copy.features.product.action,
    copy.features.tryOn.action,
    copy.features.library.action,
  ];
  const cardImages = [
    '/resources/example1.png',
    '/resources/example2.png',
    '/resources/example3.png',
    '/resources/example4.png',
  ];

  return (
    <section className="bg-[#f5f7fb]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-[22px] bg-[#eaf3ff] px-5 py-4 text-center text-sm font-bold text-gray-800 shadow-sm md:flex-row">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>{copy.heroAnnouncement}</span>
            <Link
              href={withDashboardLocale('/create/try-on', locale)}
              className="inline-flex items-center gap-1 whitespace-nowrap text-indigo-600 transition hover:text-indigo-700"
            >
              {copy.heroAnnouncementAction}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="py-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold text-indigo-600">{copy.hubEyebrow}</p>
              <h1 className="mt-3 text-4xl font-black leading-tight text-gray-950 md:text-5xl">
                {copy.heroTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-gray-500">
                {copy.heroDescription}
              </p>
            </div>
            <Link
              href={withDashboardLocale('/templates', locale)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-bold text-gray-800 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600"
            >
              {copy.features.library.action}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {copy.overviewCards.map((card, index) => {
              const Icon = icons[index] ?? Sparkles;
              return (
                <Link
                  key={card.title}
                  href={withDashboardLocale(cardLinks[index] ?? '/create/video', locale)}
                  className={cn(
                    'group flex min-h-[310px] flex-col overflow-hidden rounded-[20px] border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(79,70,229,0.13)]',
                    index === 2 ? 'border-indigo-200 ring-2 ring-indigo-100' : 'border-gray-200'
                  )}
                >
                  <div className="relative h-40 overflow-hidden bg-gray-50">
                    <img
                      src={cardImages[index] ?? showcaseImages[0]}
                      alt=""
                      className="size-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    {index === 2 ? (
                      <span className="absolute left-3 top-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                        NEW
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="size-5" />
                    </span>
                    <h2 className="mt-4 text-xl font-black text-gray-950">{card.title}</h2>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">{card.text}</p>
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-indigo-600">
                      {actions[index]}
                      <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Sparkles className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-black text-gray-950">
                    {copy.features.video.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {copy.features.video.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Library className="size-5" />
                </span>
                <div>
                  <h2 className="text-base font-black text-gray-950">
                    {copy.features.library.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {copy.features.library.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VideoDemo() {
  return (
    <div className="grid gap-4 sm:grid-cols-[0.8fr_1fr]">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg bg-gray-50">
          <img src="/resources/example4.png" alt="" className="size-full object-cover" />
        </div>
        <p className="mt-3 text-center text-sm font-bold text-gray-500">商品主图</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative aspect-[9/12] overflow-hidden rounded-lg bg-gray-950">
          <video
            src="/resources/example2.mp4"
            className="size-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
            <PlayCircle className="size-9" />
            <p className="mt-2 text-sm font-bold">Video preview</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductImageDemo() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {showcaseImages.slice(2, 6).map((image, index) => (
        <div
          key={image}
          className={cn(
            'overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm',
            index === 0 && 'row-span-2'
          )}
        >
          <img src={image} alt="" className="size-full min-h-48 object-cover" />
        </div>
      ))}
    </div>
  );
}

function TryOnDemo() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-indigo-50">
          <img src="/resources/example2.png" alt="" className="aspect-[4/5] size-full object-cover" />
        </div>
        <div className="overflow-hidden rounded-lg bg-amber-50">
          <img src="/resources/example6.png" alt="" className="aspect-[4/5] size-full object-cover" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600">
        <span>Model</span>
        <ArrowRight className="size-4 text-indigo-500" />
        <span>Try-on output</span>
      </div>
    </div>
  );
}

function LibraryDemo({ tabs }: { tabs: string[] }) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap justify-center gap-3">
        {tabs.map((tab, index) => (
          <span
            key={tab}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold',
              index === 0 ? 'bg-gray-950 text-white' : 'bg-white text-gray-700 shadow-sm'
            )}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {showcaseImages.map((image, index) => (
          <div
            key={image}
            className={cn(
              'overflow-hidden rounded-lg bg-white shadow-sm',
              index === 0 && 'row-span-2',
              index === 3 && 'row-span-2'
            )}
          >
            <img src={image} alt="" className="size-full min-h-44 object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureSection({
  children,
  feature,
  locale,
  reverse,
  band = 'white',
}: {
  children: ReactNode;
  feature: FeatureCopy;
  locale: DashboardLocale;
  reverse?: boolean;
  band?: 'white' | 'soft';
}) {
  return (
    <section className={cn(band === 'white' ? 'bg-white' : 'bg-[#f5f7fb]')}>
      <div
        className={cn(
          'mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8',
          reverse && 'lg:[&>*:first-child]:order-2'
        )}
      >
        <SectionIntro feature={feature} locale={locale} />
        <div>{children}</div>
      </div>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const locale = normalizeDashboardLocale(
    Array.isArray(params?.locale) ? params?.locale[0] : params?.locale
  );
  const copy = dashboardCopy[locale];
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <main className="min-h-[calc(100dvh-58px)] bg-[#f5f7fb] text-gray-950">
      <HeroShowcase copy={copy} locale={locale} />

      <FeatureSection feature={copy.features.video} locale={locale} band="soft">
        <VideoDemo />
      </FeatureSection>

      <FeatureSection feature={copy.features.product} locale={locale} reverse>
        <ProductImageDemo />
      </FeatureSection>

      <FeatureSection feature={copy.features.tryOn} locale={locale} band="soft">
        <TryOnDemo />
      </FeatureSection>

      <FeatureSection feature={copy.features.library} locale={locale} reverse>
        <LibraryDemo tabs={copy.libraryTabs} />
      </FeatureSection>
    </main>
  );
}
