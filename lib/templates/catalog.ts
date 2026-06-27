import type { Locale } from '@/lib/marketing/content';

export type TemplateType = 'image_to_image' | 'image_to_video' | 'model' | 'try_on';

export type TemplateCatalogListItem = {
  id: string;
  title: string;
  type: TemplateType;
  category: string;
  thumbnailUrl: string;
  previewUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TemplateCatalogDetailItem = TemplateCatalogListItem & {
  prompt: string;
  promptTranslations?: Partial<LocalizedText>;
};

export type TemplateCatalogItem = TemplateCatalogDetailItem;
export type TemplateListItem = TemplateCatalogListItem;
export type TemplateDetailItem = TemplateCatalogDetailItem;

type LocalizedText = Record<Locale, string>;

export type StarterTemplateSeed = {
  seedKey: string;
  title: string;
  titleTranslations?: Partial<LocalizedText>;
  type: TemplateType;
  category: string;
  thumbnailAssetSeedKey: string;
  previewAssetSeedKey: string;
  thumbnailUrl: string;
  previewUrl: string;
  prompt: string;
  promptTranslations?: Partial<LocalizedText>;
};

export const retiredStarterTemplateSeedKeys = [
  'product-soft-motion',
  'fashion-model-motion',
  'food-fresh-closeup',
  'beauty-premium-detail',
  'electronics-launch',
  'home-lifestyle-scene',
] as const;

export const templateTypes: TemplateType[] = [
  'image_to_video',
  'image_to_image',
  'model',
  'try_on',
];

export const templateTypeLabels: Record<TemplateType, LocalizedText> = {
  image_to_video: {
    pt: 'Imagem para vídeo',
    en: 'Image to video',
    zh: '图生视频',
  },
  image_to_image: {
    pt: 'Imagem',
    en: 'Image',
    zh: '商品图',
  },
  model: {
    pt: 'Modelos',
    en: 'Models',
    zh: '模特',
  },
  try_on: {
    pt: 'Provador virtual',
    en: 'Try-on',
    zh: '智能试衣',
  },
};

export const templateCategoryLabels: Record<string, LocalizedText> = {
  product: { pt: 'Produto', en: 'Product', zh: '商品' },
  fashion: { pt: 'Moda', en: 'Fashion', zh: '服饰时尚' },
  food: { pt: 'Alimentos', en: 'Food', zh: '食品' },
  beauty: { pt: 'Beleza e cuidados', en: 'Beauty and personal care', zh: '美妆个护' },
  electronics: { pt: 'Eletrônicos', en: 'Electronics', zh: '3C数码' },
  appliances: { pt: 'Eletrodomésticos', en: 'Appliances', zh: '家用电器' },
  home: { pt: 'Casa', en: 'Home', zh: '家居家装' },
  sports: { pt: 'Esportes', en: 'Sports', zh: '运动户外' },
  social: { pt: 'Social', en: 'Social', zh: '社媒' },
  marketplace: { pt: 'Marketplace', en: 'Marketplace', zh: '平台电商' },
  common: { pt: 'Geral', en: 'Common', zh: '通用' },
  general: { pt: 'Geral', en: 'Common', zh: '通用' },
  goods_display_window: { pt: 'Vitrine de produto', en: 'Product display', zh: '展台橱窗' },
  goods_nature: { pt: 'Natureza', en: 'Nature', zh: '自然景观' },
  goods_festival: { pt: 'Datas comemorativas', en: 'Festive', zh: '节日氛围' },
  goods_architecture: { pt: 'Arquitetura', en: 'Architecture', zh: '人文建筑' },
  goods_abstract: { pt: 'Conceito abstrato', en: 'Abstract concept', zh: '抽象概念' },
  goods_interior: { pt: 'Interior', en: 'Indoor space', zh: '室内空间' },
  tryon_solid_background: { pt: 'Fundo sólido', en: 'Solid background', zh: '纯色背景' },
  tryon_outdoor_commercial: { pt: 'Comercial externo', en: 'Outdoor commercial', zh: '户外商拍' },
  tryon_indoor_commercial: { pt: 'Comercial interno', en: 'Indoor commercial', zh: '室内商拍' },
  tryon_outdoor_casual: { pt: 'Externo casual', en: 'Outdoor casual', zh: '户外随拍' },
  tryon_indoor_casual: { pt: 'Interno casual', en: 'Indoor casual', zh: '室内随拍' },
};

export function getTemplateCategoryLabel(category: string, locale: Locale) {
  const label = templateCategoryLabels[category]?.[locale];
  if (label) return label;

  return category
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

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
    categoryFilterLabel: string;
  }
> = {
  pt: {
    metadata: {
      title: 'Templates de vídeo para e-commerce com IA',
      description:
        'Explore templates de imagem para vídeo com prompts prontos para produtos, moda, alimentos e campanhas.',
    },
    eyebrow: 'Biblioteca de templates',
    title: 'Escolha um ponto de partida para transformar produto em vídeo.',
    description:
      'A biblioteca usa os mesmos templates do fluxo de imagem para vídeo. Escolha uma categoria, abra o editor e edite o prompt livremente.',
    searchPlaceholder: 'Buscar por produto, moda, alimento...',
    clearFilters: 'Limpar filtros',
    all: 'Todos',
    results: 'templates encontrados',
    useTemplate: 'Usar template',
    loginHint: 'Entre para editar prompt, produto e detalhes.',
    emptyTitle: 'Nenhum template encontrado',
    emptyText: 'Remova a categoria ou busque por outro tipo de produto.',
    categoryFilterLabel: 'Categoria',
  },
  en: {
    metadata: {
      title: 'AI video templates for ecommerce',
      description:
        'Browse image-to-video templates with ready prompts for products, fashion, food, and campaigns.',
    },
    eyebrow: 'Template library',
    title: 'Choose a starting point for turning product images into video.',
    description:
      'The library reuses the same templates as the image-to-video workflow. Pick a category, open the editor, and freely edit the prompt.',
    searchPlaceholder: 'Search product, fashion, food...',
    clearFilters: 'Clear filters',
    all: 'All',
    results: 'templates found',
    useTemplate: 'Use template',
    loginHint: 'Sign in to edit prompt, product, and details.',
    emptyTitle: 'No templates found',
    emptyText: 'Remove the category or search for another product type.',
    categoryFilterLabel: 'Category',
  },
  zh: {
    metadata: {
      title: '面向电商的 AI 视频模板库',
      description:
        '浏览图生视频模板，使用商品、服饰、食品和活动场景的现成提示词。',
    },
    eyebrow: '模板库',
    title: '选择一个起点，把商品图变成视频。',
    description:
      '首页模板库复用图生视频模板。选择类目后进入工作台，提示词仍然可以自由编辑。',
    searchPlaceholder: '搜索商品、服饰、食品...',
    clearFilters: '清除筛选',
    all: '全部',
    results: '个模板',
    useTemplate: '使用模板',
    loginHint: '登录后可编辑提示词、商品和细节。',
    emptyTitle: '没有找到模板',
    emptyText: '移除类目，或换一个商品类型搜索。',
    categoryFilterLabel: '类目',
  },
};

export const starterTemplateSeeds: StarterTemplateSeed[] = [];
