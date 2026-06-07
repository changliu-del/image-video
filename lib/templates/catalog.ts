import type { Locale } from '@/lib/marketing/content';

export type TemplateCategory =
  | 'image_to_video'
  | 'image_to_image'
  | 'try_on';

export type TemplateTagGroup =
  | 'goal'
  | 'type'
  | 'industry'
  | 'channel'
  | 'funnel'
  | 'cost'
  | 'aspect_ratio';

export type TemplateMediaType = 'image' | 'video';

export type TemplateCatalogItem = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  prompt: string;
  costCredits: number;
  aspectRatios: string[];
  durationSeconds?: number | null;
  asset: string;
  mediaType: TemplateMediaType;
  tags: string[];
  source?: 'starter' | 'admin';
};

type LocalizedText = Record<Locale, string>;

export type TemplateTagOption = {
  slug: string;
  group: TemplateTagGroup;
  labels: LocalizedText;
};

export type StarterTemplateSeed = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  prompt: string;
  costCredits: number;
  aspectRatios: string[];
  durationSeconds?: number | null;
  asset: string;
  mediaType: TemplateMediaType;
  tags: string[];
};

export const templateTagGroups: Array<{
  group: TemplateTagGroup;
  labels: LocalizedText;
}> = [
  {
    group: 'goal',
    labels: { pt: 'Objetivo', en: 'Goal', zh: '目标' },
  },
  {
    group: 'type',
    labels: { pt: 'Formato', en: 'Format', zh: '类型' },
  },
  {
    group: 'industry',
    labels: { pt: 'Categoria', en: 'Category', zh: '行业' },
  },
  {
    group: 'channel',
    labels: { pt: 'Canal', en: 'Channel', zh: '渠道' },
  },
  {
    group: 'funnel',
    labels: { pt: 'Funil', en: 'Funnel', zh: '漏斗' },
  },
  {
    group: 'cost',
    labels: { pt: 'Custo', en: 'Cost', zh: '成本' },
  },
  {
    group: 'aspect_ratio',
    labels: { pt: 'Proporcao', en: 'Ratio', zh: '比例' },
  },
];

export const templateTagOptions: TemplateTagOption[] = [
  {
    slug: 'promotion',
    group: 'goal',
    labels: { pt: 'Promocao', en: 'Promotion', zh: '促销' },
  },
  {
    slug: 'customer-review',
    group: 'goal',
    labels: { pt: 'Review de cliente', en: 'Customer review', zh: '客户评价' },
  },
  {
    slug: 'before-after',
    group: 'goal',
    labels: { pt: 'Antes e depois', en: 'Before and after', zh: '前后对比' },
  },
  {
    slug: 'new-arrival',
    group: 'goal',
    labels: { pt: 'Lancamento', en: 'New arrival', zh: '上新' },
  },
  {
    slug: 'pdp-detail',
    group: 'goal',
    labels: { pt: 'Detalhe PDP', en: 'PDP detail', zh: '详情页' },
  },
  {
    slug: 'image',
    group: 'type',
    labels: { pt: 'Imagem', en: 'Image', zh: '图片' },
  },
  {
    slug: 'image-to-video',
    group: 'type',
    labels: { pt: 'Imagem para video', en: 'Image to video', zh: '图生视频' },
  },
  {
    slug: 'video',
    group: 'type',
    labels: { pt: 'Video', en: 'Video', zh: '视频' },
  },
  {
    slug: 'beauty',
    group: 'industry',
    labels: { pt: 'Beleza', en: 'Beauty', zh: '美妆' },
  },
  {
    slug: 'fashion',
    group: 'industry',
    labels: { pt: 'Moda', en: 'Fashion', zh: '服饰' },
  },
  {
    slug: 'home',
    group: 'industry',
    labels: { pt: 'Casa', en: 'Home', zh: '家居' },
  },
  {
    slug: 'electronics',
    group: 'industry',
    labels: { pt: 'Eletronicos', en: 'Electronics', zh: '电子' },
  },
  {
    slug: 'food',
    group: 'industry',
    labels: { pt: 'Alimentos', en: 'Food', zh: '食品' },
  },
  {
    slug: 'tiktok',
    group: 'channel',
    labels: { pt: 'TikTok', en: 'TikTok', zh: 'TikTok' },
  },
  {
    slug: 'reels',
    group: 'channel',
    labels: { pt: 'Reels', en: 'Reels', zh: 'Reels' },
  },
  {
    slug: 'whatsapp',
    group: 'channel',
    labels: { pt: 'WhatsApp', en: 'WhatsApp', zh: 'WhatsApp' },
  },
  {
    slug: 'marketplace',
    group: 'channel',
    labels: { pt: 'Marketplace', en: 'Marketplace', zh: 'Marketplace' },
  },
  {
    slug: 'traffic',
    group: 'funnel',
    labels: { pt: 'Atracao', en: 'Traffic', zh: '引流' },
  },
  {
    slug: 'consideration',
    group: 'funnel',
    labels: { pt: 'Consideracao', en: 'Consideration', zh: '种草' },
  },
  {
    slug: 'conversion',
    group: 'funnel',
    labels: { pt: 'Conversao', en: 'Conversion', zh: '转化' },
  },
  {
    slug: 'retention',
    group: 'funnel',
    labels: { pt: 'Recompra', en: 'Retention', zh: '复购' },
  },
  {
    slug: 'low-cost',
    group: 'cost',
    labels: { pt: 'Baixo custo', en: 'Low cost', zh: '低成本' },
  },
  {
    slug: 'standard-video',
    group: 'cost',
    labels: { pt: 'Video padrao', en: 'Standard video', zh: '标准视频' },
  },
  {
    slug: 'ratio-9-16',
    group: 'aspect_ratio',
    labels: { pt: '9:16', en: '9:16', zh: '9:16' },
  },
  {
    slug: 'ratio-1-1',
    group: 'aspect_ratio',
    labels: { pt: '1:1', en: '1:1', zh: '1:1' },
  },
  {
    slug: 'ratio-16-9',
    group: 'aspect_ratio',
    labels: { pt: '16:9', en: '16:9', zh: '16:9' },
  },
];

export const templatesPageContent: Record<
  Locale,
  {
    metadata: { title: string; description: string };
    eyebrow: string;
    title: string;
    description: string;
    searchPlaceholder: string;
    clearFilters: string;
    all: string;
    results: string;
    useTemplate: string;
    loginHint: string;
    emptyTitle: string;
    emptyText: string;
    costSuffix: string;
    sortLabel: string;
    sortOptions: Record<'featured' | 'newest' | 'lowCost', string>;
    categoryFilterLabel: string;
    categoryLabels: Record<TemplateCategory, string>;
  }
> = {
  pt: {
    metadata: {
      title: 'Templates de e-commerce com IA para vender no Brasil',
      description:
        'Explore templates de imagem e video para promocao, reviews, PDP, WhatsApp e marketplaces no Brasil.',
    },
    eyebrow: 'Biblioteca de templates',
    title: 'Encontre o modelo certo para cada produto, canal e campanha.',
    description:
      'Filtre por objetivo, formato, categoria, canal, funil e custo. Comece barato com imagem e suba para video quando fizer sentido.',
    searchPlaceholder: 'Buscar por Pix, review, PDP, WhatsApp...',
    clearFilters: 'Limpar filtros',
    all: 'Todos',
    results: 'templates encontrados',
    useTemplate: 'Usar modelo',
    loginHint: 'Entre para editar prompt, produto e detalhes.',
    emptyTitle: 'Nenhum template encontrado',
    emptyText: 'Remova alguns filtros ou busque por outro objetivo de venda.',
    costSuffix: 'credito',
    sortLabel: 'Ordenar',
    sortOptions: {
      featured: 'Destaques',
      newest: 'Mais recentes',
      lowCost: 'Menor custo',
    },
    categoryFilterLabel: 'Workbench',
    categoryLabels: {
      image_to_image: 'Imagem',
      image_to_video: 'Imagem -> video',
      try_on: 'Provador',
    },
  },
  en: {
    metadata: {
      title: 'AI ecommerce templates for Brazil',
      description:
        'Browse image and video templates for promotions, reviews, PDP, WhatsApp, and marketplaces in Brazil.',
    },
    eyebrow: 'Template library',
    title: 'Find the right template for each product, channel, and campaign.',
    description:
      'Filter by goal, format, category, channel, funnel, and cost. Start with low-cost images and move to video when it makes sense.',
    searchPlaceholder: 'Search Pix, review, PDP, WhatsApp...',
    clearFilters: 'Clear filters',
    all: 'All',
    results: 'templates found',
    useTemplate: 'Use template',
    loginHint: 'Sign in to edit prompt, product, and details.',
    emptyTitle: 'No templates found',
    emptyText: 'Remove some filters or search for another sales goal.',
    costSuffix: 'credit',
    sortLabel: 'Sort',
    sortOptions: {
      featured: 'Featured',
      newest: 'Newest',
      lowCost: 'Lowest cost',
    },
    categoryFilterLabel: 'Workbench',
    categoryLabels: {
      image_to_image: 'Image',
      image_to_video: 'Image -> video',
      try_on: 'Try-on',
    },
  },
  zh: {
    metadata: {
      title: '面向巴西电商的 AI 模板库',
      description:
        '浏览促销、评价、详情页、WhatsApp 和电商平台场景的图片与视频模板。',
    },
    eyebrow: '模板库',
    title: '按商品、渠道和活动目标，找到最合适的模板。',
    description:
      '支持按目标、类型、行业、渠道、漏斗和成本筛选。先用低成本图片测试，再在合适时升级视频。',
    searchPlaceholder: '搜索 Pix、评价、详情页、WhatsApp...',
    clearFilters: '清除筛选',
    all: '全部',
    results: '个模板',
    useTemplate: '使用模板',
    loginHint: '登录后可编辑提示词、商品和细节。',
    emptyTitle: '没有找到模板',
    emptyText: '减少筛选条件，或换一个卖货目标搜索。',
    costSuffix: '算力值',
    sortLabel: '排序',
    sortOptions: {
      featured: '推荐',
      newest: '最新',
      lowCost: '低成本优先',
    },
    categoryFilterLabel: '工作台',
    categoryLabels: {
      image_to_image: '图片',
      image_to_video: '图生视频',
      try_on: '智能试衣',
    },
  },
};

const assets = [
  '/resources/example4.png',
  '/resources/example2.mp4',
  '/resources/example3.png',
  '/resources/example1.mp4',
  '/resources/example1.png',
  '/resources/example5.png',
] as const;

export const starterTemplateSeeds: StarterTemplateSeed[] = [
  {
    id: 'promocao-pix-relampago',
    name: 'Promocao Pix Relampago',
    description: 'Oferta direta com preco forte, urgencia e chamada para Pix.',
    category: 'image_to_image',
    prompt:
      'Crie uma imagem promocional para ecommerce brasileiro com o produto em destaque, composicao limpa, preco em evidencia e chamada para Pix.',
    costCredits: 1,
    aspectRatios: ['1:1', '9:16'],
    asset: assets[0],
    mediaType: 'image',
    tags: [
      'promotion',
      'image',
      'marketplace',
      'conversion',
      'low-cost',
      'ratio-1-1',
    ],
  },
  {
    id: 'produto-em-uso-reels',
    name: 'Produto em Uso',
    description: 'Mostre o produto no contexto de uso com ritmo social.',
    category: 'image_to_video',
    prompt:
      'Transforme a imagem do produto em um video curto de ecommerce, com movimento suave, ambiente realista e foco nos beneficios de uso.',
    costCredits: 10,
    aspectRatios: ['9:16'],
    durationSeconds: 5,
    asset: assets[1],
    mediaType: 'video',
    tags: [
      'image-to-video',
      'reels',
      'consideration',
      'standard-video',
      'ratio-9-16',
      'fashion',
    ],
  },
  {
    id: 'antes-e-depois-beneficio',
    name: 'Antes e Depois',
    description: 'Estrutura visual para comparar problema, solucao e ganho.',
    category: 'image_to_image',
    prompt:
      'Crie um criativo antes e depois para ecommerce, com divisao clara da cena, produto como solucao e visual limpo para anuncio.',
    costCredits: 1,
    aspectRatios: ['1:1', '16:9'],
    asset: assets[2],
    mediaType: 'image',
    tags: [
      'before-after',
      'image',
      'beauty',
      'consideration',
      'low-cost',
      'ratio-1-1',
    ],
  },
  {
    id: 'review-cliente-whatsapp',
    name: 'Review de Cliente',
    description: 'Prova social com texto curto e visual de conversa.',
    category: 'image_to_video',
    prompt:
      'Crie um video curto com clima de review de cliente, produto em destaque, prova social visual e espaco para depoimento em PT-BR.',
    costCredits: 10,
    aspectRatios: ['9:16'],
    durationSeconds: 5,
    asset: assets[3],
    mediaType: 'video',
    tags: [
      'customer-review',
      'image-to-video',
      'whatsapp',
      'conversion',
      'standard-video',
      'ratio-9-16',
    ],
  },
  {
    id: 'detalhe-pdp-textura',
    name: 'Detalhe PDP',
    description: 'Destaque textura, embalagem, material e beneficio.',
    category: 'image_to_image',
    prompt:
      'Crie uma imagem PDP premium com close-up do produto, textura visivel, fundo limpo e espaco para beneficios curtos.',
    costCredits: 1,
    aspectRatios: ['1:1'],
    asset: assets[4],
    mediaType: 'image',
    tags: [
      'pdp-detail',
      'image',
      'marketplace',
      'conversion',
      'low-cost',
      'ratio-1-1',
      'electronics',
    ],
  },
  {
    id: 'banner-cupom-marketplace',
    name: 'Banner Promocional',
    description: 'Base visual para cupom, frete gratis e calendario comercial.',
    category: 'image_to_image',
    prompt:
      'Crie um banner promocional para marketplace brasileiro, com produto em destaque, area para cupom e visual comercial moderno.',
    costCredits: 1,
    aspectRatios: ['16:9', '1:1'],
    asset: assets[5],
    mediaType: 'image',
    tags: [
      'promotion',
      'image',
      'marketplace',
      'traffic',
      'low-cost',
      'ratio-16-9',
    ],
  },
  {
    id: 'lancamento-tiktok',
    name: 'Lancamento TikTok',
    description: 'Gancho rapido para apresentar novidade em video vertical.',
    category: 'image_to_video',
    prompt:
      'Crie um video vertical de lancamento para TikTok, com movimento dinamico, produto centralizado e visual moderno para ecommerce.',
    costCredits: 10,
    aspectRatios: ['9:16'],
    durationSeconds: 5,
    asset: assets[1],
    mediaType: 'video',
    tags: [
      'new-arrival',
      'image-to-video',
      'tiktok',
      'traffic',
      'standard-video',
      'ratio-9-16',
      'fashion',
    ],
  },
  {
    id: 'combo-kits-recompra',
    name: 'Combo para Recompra',
    description: 'Apresente kits, bundles e recompra com valor percebido.',
    category: 'image_to_image',
    prompt:
      'Crie um criativo de kit promocional para ecommerce, com composicao organizada, varios itens do produto e beneficio de economia.',
    costCredits: 1,
    aspectRatios: ['1:1'],
    asset: assets[0],
    mediaType: 'image',
    tags: [
      'promotion',
      'image',
      'retention',
      'marketplace',
      'low-cost',
      'ratio-1-1',
      'beauty',
    ],
  },
  {
    id: 'food-delivery-oferta',
    name: 'Oferta de Alimentos',
    description: 'Criativo apetitoso para preco, combo e urgencia.',
    category: 'image_to_image',
    prompt:
      'Crie uma imagem de oferta para produto alimenticio, com composicao apetitosa, luz natural e destaque para combo promocional.',
    costCredits: 1,
    aspectRatios: ['1:1', '9:16'],
    asset: assets[5],
    mediaType: 'image',
    tags: [
      'promotion',
      'image',
      'food',
      'whatsapp',
      'conversion',
      'low-cost',
      'ratio-9-16',
    ],
  },
  {
    id: 'eletronico-demo-curta',
    name: 'Demo Curta de Eletronico',
    description: 'Mostre funcao, detalhe e beneficio em poucos segundos.',
    category: 'image_to_video',
    prompt:
      'Transforme a imagem do eletronico em um video de produto com camera lenta, brilho controlado, close-up tecnico e fundo limpo.',
    costCredits: 10,
    aspectRatios: ['9:16', '16:9'],
    durationSeconds: 5,
    asset: assets[3],
    mediaType: 'video',
    tags: [
      'pdp-detail',
      'image-to-video',
      'electronics',
      'reels',
      'consideration',
      'standard-video',
      'ratio-16-9',
    ],
  },
  {
    id: 'moda-lookbook-marketplace',
    name: 'Lookbook Marketplace',
    description: 'Imagem comercial para look, variacao e catalogo.',
    category: 'image_to_image',
    prompt:
      'Crie uma imagem estilo lookbook para ecommerce de moda, com produto em composicao elegante, fundo neutro e foco em combinacoes.',
    costCredits: 1,
    aspectRatios: ['1:1'],
    asset: assets[2],
    mediaType: 'image',
    tags: [
      'pdp-detail',
      'image',
      'fashion',
      'marketplace',
      'consideration',
      'low-cost',
      'ratio-1-1',
    ],
  },
  {
    id: 'whatsapp-consulta-rapida',
    name: 'Consulta pelo WhatsApp',
    description: 'Criativo para levar compradores a uma conversa direta.',
    category: 'image_to_image',
    prompt:
      'Crie um criativo para ecommerce com chamada para WhatsApp, produto claro, visual confiavel e espaco para perguntas frequentes.',
    costCredits: 1,
    aspectRatios: ['9:16', '1:1'],
    asset: assets[4],
    mediaType: 'image',
    tags: [
      'customer-review',
      'image',
      'whatsapp',
      'conversion',
      'low-cost',
      'ratio-9-16',
      'home',
    ],
  },
];

const translations: Record<
  Exclude<Locale, 'pt'>,
  Record<
    string,
    Partial<Pick<StarterTemplateSeed, 'name' | 'description'>>
  >
> = {
  en: {
    'promocao-pix-relampago': {
      name: 'Pix Flash Promotion',
      description: 'Direct offer with strong price, urgency, and Pix action cue.',
    },
    'produto-em-uso-reels': {
      name: 'Product in Use',
      description: 'Show the product in context with social pacing.',
    },
    'antes-e-depois-beneficio': {
      name: 'Before and After',
      description: 'Visual structure to compare problem, solution, and gain.',
    },
    'review-cliente-whatsapp': {
      name: 'Customer Review',
      description: 'Social proof with short copy and conversation-style visual.',
    },
    'detalhe-pdp-textura': {
      name: 'PDP Detail',
      description: 'Highlight texture, packaging, material, and benefit.',
    },
    'banner-cupom-marketplace': {
      name: 'Promo Banner',
      description: 'Visual base for coupons, free shipping, and retail dates.',
    },
    'lancamento-tiktok': {
      name: 'TikTok Launch',
      description: 'Fast opening to introduce a new item in vertical video.',
    },
    'combo-kits-recompra': {
      name: 'Repurchase Bundle',
      description: 'Present kits, bundles, and repeat purchase value.',
    },
    'food-delivery-oferta': {
      name: 'Food Offer',
      description: 'Appetizing creative for price, combo, and urgency.',
    },
    'eletronico-demo-curta': {
      name: 'Short Electronics Demo',
      description: 'Show function, detail, and benefit in seconds.',
    },
    'moda-lookbook-marketplace': {
      name: 'Marketplace Lookbook',
      description: 'Commercial image for looks, variants, and catalog.',
    },
    'whatsapp-consulta-rapida': {
      name: 'WhatsApp Consultation',
      description: 'Creative to move shoppers into a direct conversation.',
    },
  },
  zh: {
    'promocao-pix-relampago': {
      name: 'Pix 限时促销',
      description: '突出价格、紧迫感和 Pix 行动提示的转化模板。',
    },
    'produto-em-uso-reels': {
      name: '商品使用场景',
      description: '用社媒节奏展示商品真实使用场景。',
    },
    'antes-e-depois-beneficio': {
      name: '前后对比',
      description: '对比问题、解决方案和收益的视觉结构。',
    },
    'review-cliente-whatsapp': {
      name: '客户评价',
      description: '适合短评价和聊天截图风格的用户口碑模板。',
    },
    'detalhe-pdp-textura': {
      name: '详情页细节',
      description: '突出纹理、包装、材质和核心利益点。',
    },
    'banner-cupom-marketplace': {
      name: '促销横幅',
      description: '适合优惠券、免运和大促节点的视觉基础。',
    },
    'lancamento-tiktok': {
      name: 'TikTok 上新',
      description: '用竖版短视频快速介绍新品。',
    },
    'combo-kits-recompra': {
      name: '复购组合装',
      description: '展示套装、组合和复购价值。',
    },
    'food-delivery-oferta': {
      name: '食品优惠',
      description: '适合价格、套餐和限时活动的食品促销素材。',
    },
    'eletronico-demo-curta': {
      name: '电子产品短演示',
      description: '几秒内展示功能、细节和利益点。',
    },
    'moda-lookbook-marketplace': {
      name: '电商平台穿搭图',
      description: '适合穿搭、变体和商品目录的商业图片。',
    },
    'whatsapp-consulta-rapida': {
      name: 'WhatsApp 快速咨询',
      description: '把买家引导到一对一咨询的图片模板。',
    },
  },
};

export function getStarterTemplates(locale: Locale): TemplateCatalogItem[] {
  return starterTemplateSeeds.map((template) => {
    const translated =
      translations[locale as Exclude<Locale, 'pt'>]?.[template.id] ?? {};
    return {
      id: template.id,
      name: translated.name ?? template.name,
      description: translated.description ?? template.description,
      category: template.category,
      prompt: template.prompt,
      costCredits: template.costCredits,
      aspectRatios: template.aspectRatios,
      durationSeconds: template.durationSeconds,
      asset: template.asset,
      mediaType: template.mediaType,
      tags: template.tags,
      source: 'starter',
    };
  });
}

export function getTemplateTagLabel(slug: string, locale: Locale) {
  return (
    templateTagOptions.find((tag) => tag.slug === slug)?.labels[locale] ?? slug
  );
}

export function getTemplateTagGroupLabel(
  group: TemplateTagGroup,
  locale: Locale
) {
  return (
    templateTagGroups.find((item) => item.group === group)?.labels[locale] ??
    group
  );
}
