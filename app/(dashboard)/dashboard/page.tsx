import {
  normalizeDashboardLocale,
  type DashboardLocale,
} from '@/lib/dashboard/content';
import { DashboardInspirationGallery } from '@/components/dashboard/dashboard-inspiration-gallery';
import { DashboardWorkbenchCard } from '@/components/dashboard/dashboard-workbench-card';

type DashboardPageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

type WorkbenchCardKey = 'video' | 'product' | 'tryOn';

type WorkbenchCard = {
  key: WorkbenchCardKey;
  title: string;
  description: string;
  action: string;
  href: string;
};

type DashboardCopy = {
  hubEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  cards: WorkbenchCard[];
};

const dashboardCopy: Record<DashboardLocale, DashboardCopy> = {
  pt: {
    hubEyebrow: 'Hub criativo',
    heroTitle: 'O que você quer criar hoje?',
    heroDescription:
      'Escolha um fluxo, use os templates e materiais do estúdio, e comece a gerar conteúdo de produto rapidamente.',
    cards: [
      {
        key: 'video',
        title: 'Imagem para vídeo',
        description: 'Transforme imagens de produto em vídeos curtos.',
        action: 'Começar',
        href: '/create/video',
      },
      {
        key: 'product',
        title: 'Imagem de produto',
        description: 'Gere imagens para campanhas, PDPs e catálogos.',
        action: 'Criar imagem',
        href: '/create/apparel',
      },
      {
        key: 'tryOn',
        title: 'Provador virtual',
        description: 'Mostre modelos e roupas com composição natural.',
        action: 'Experimentar',
        href: '/create/try-on',
      },
    ],
  },
  en: {
    hubEyebrow: 'Creative hub',
    heroTitle: 'What do you want to create today?',
    heroDescription:
      'Choose a creation flow, reuse studio templates and materials, and start producing product content quickly.',
    cards: [
      {
        key: 'video',
        title: 'Image to video',
        description: 'Turn product images into short videos.',
        action: 'Start',
        href: '/create/video',
      },
      {
        key: 'product',
        title: 'Product image',
        description: 'Generate campaign, PDP, and catalog images.',
        action: 'Create image',
        href: '/create/apparel',
      },
      {
        key: 'tryOn',
        title: 'Virtual try-on',
        description: 'Present models and apparel with natural composition.',
        action: 'Try now',
        href: '/create/try-on',
      },
    ],
  },
  zh: {
    hubEyebrow: '创作中心',
    heroTitle: '今天要创作什么？',
    heroDescription:
      '选择一个创作流程，复用模板、模特库和自己的历史素材，快速开始生成商品内容。',
    cards: [
      {
        key: 'video',
        title: '图生视频',
        description: '商品图片秒变投放短视频。',
        action: '开始生成',
        href: '/create/video',
      },
      {
        key: 'product',
        title: '商品图',
        description: '生成活动、详情和目录图。',
        action: '创作商品图',
        href: '/create/apparel',
      },
      {
        key: 'tryOn',
        title: '智能试衣',
        description: '模特与服饰自然合成展示。',
        action: '打开试衣',
        href: '/create/try-on',
      },
    ],
  },
};

function firstParam(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function withDashboardLocale(href: string, locale: DashboardLocale) {
  const [pathname, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  params.set('locale', locale);
  return `${pathname}?${params.toString()}`;
}

function DashboardHero({ copy, locale }: { copy: DashboardCopy; locale: DashboardLocale }) {
  return (
    <section className="bg-[#f5f7fb]">
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="py-10">
          <p className="text-sm font-bold text-indigo-600">
            {copy.hubEyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-gray-950 md:text-5xl">
            {copy.heroTitle}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-gray-500">
            {copy.heroDescription}
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {copy.cards.map((card) => (
              <DashboardWorkbenchCard
                key={card.key}
                card={{
                  ...card,
                  href: withDashboardLocale(card.href, locale),
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const locale = normalizeDashboardLocale(firstParam(params?.locale));
  const copy = dashboardCopy[locale];

  return (
    <main className="min-h-[calc(100dvh-58px)] bg-[#f5f7fb] text-gray-950">
      <DashboardHero copy={copy} locale={locale} />
      <DashboardInspirationGallery locale={locale} />
    </main>
  );
}
