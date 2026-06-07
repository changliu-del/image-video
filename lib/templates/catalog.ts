import type { Locale } from '@/lib/marketing/content';

export type TemplateType = 'image_to_image' | 'image_to_video';

export type TemplateCatalogListItem = {
  id: string;
  title: string;
  type: TemplateType;
  category: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TemplateCatalogDetailItem = TemplateCatalogListItem & {
  previewUrl: string;
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

export const templateTypes: TemplateType[] = [
  'image_to_video',
  'image_to_image',
];

export const templateTypeLabels: Record<TemplateType, LocalizedText> = {
  image_to_video: {
    pt: 'Imagem para video',
    en: 'Image to video',
    zh: '图生视频',
  },
  image_to_image: {
    pt: 'Imagem',
    en: 'Image',
    zh: '生图',
  },
};

export const templateCategoryLabels: Record<string, LocalizedText> = {
  product: { pt: 'Produto', en: 'Product', zh: '商品' },
  fashion: { pt: 'Moda', en: 'Fashion', zh: '服饰' },
  food: { pt: 'Alimentos', en: 'Food', zh: '食品' },
  beauty: { pt: 'Beleza', en: 'Beauty', zh: '美妆' },
  electronics: { pt: 'Eletronicos', en: 'Electronics', zh: '电子' },
  appliances: { pt: 'Eletrodomesticos', en: 'Appliances', zh: '家用电器' },
  home: { pt: 'Casa', en: 'Home', zh: '家居' },
  sports: { pt: 'Esportes', en: 'Sports', zh: '运动' },
  social: { pt: 'Social', en: 'Social', zh: '社媒' },
  marketplace: { pt: 'Marketplace', en: 'Marketplace', zh: '平台电商' },
  general: { pt: 'Geral', en: 'General', zh: '通用' },
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
      title: 'Templates de video para e-commerce com IA',
      description:
        'Explore templates de imagem para video com prompts prontos para produtos, moda, alimentos e campanhas.',
    },
    eyebrow: 'Biblioteca de templates',
    title: 'Escolha um ponto de partida para transformar produto em video.',
    description:
      'A biblioteca usa os mesmos templates do fluxo de imagem para video. Escolha uma categoria, abra o workbench e edite o prompt livremente.',
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
      'The library reuses the same templates as the image-to-video workflow. Pick a category, open the workbench, and freely edit the prompt.',
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

const resource = (name: string) => `/resources/${name}`;

export const starterTemplateSeeds: StarterTemplateSeed[] = [
  {
    seedKey: 'product-soft-motion',
    title: 'Produto com movimento suave',
    titleTranslations: {
      en: 'Soft product motion',
      zh: '商品柔和运镜',
    },
    type: 'image_to_video',
    category: 'product',
    thumbnailAssetSeedKey: 'product-soft-motion-thumbnail',
    previewAssetSeedKey: 'product-soft-motion-preview',
    thumbnailUrl: resource('example1.png'),
    previewUrl: resource('example1.mp4'),
    prompt:
      'Transforme a foto do produto em um video curto de ecommerce com movimento suave de camera, luz limpa, produto centralizado e acabamento premium.',
    promptTranslations: {
      en: 'Turn the product photo into a short ecommerce video with smooth camera motion, clean lighting, centered product framing, and a premium finish.',
      zh: '把商品照片转换成短电商视频，使用柔和运镜、干净光线、商品居中构图和高级质感。',
    },
  },
  {
    seedKey: 'fashion-model-motion',
    title: 'Lookbook de moda em movimento',
    titleTranslations: {
      en: 'Fashion lookbook in motion',
      zh: '动态服饰 Lookbook',
    },
    type: 'image_to_video',
    category: 'fashion',
    thumbnailAssetSeedKey: 'fashion-model-motion-thumbnail',
    previewAssetSeedKey: 'fashion-model-motion-preview',
    thumbnailUrl: resource('example2.png'),
    previewUrl: resource('example2.mp4'),
    prompt:
      'Crie um video vertical de moda a partir da imagem, com movimento natural, tecido em destaque, fundo de estudio moderno e ritmo social.',
    promptTranslations: {
      en: 'Create a vertical fashion video from the image with natural movement, highlighted fabric texture, a modern studio background, and social rhythm.',
      zh: '基于图片生成竖版服饰视频，动作自然，突出面料质感，现代影棚背景，节奏适合社媒。',
    },
  },
  {
    seedKey: 'food-fresh-closeup',
    title: 'Close-up fresco de alimento',
    titleTranslations: {
      en: 'Fresh food close-up',
      zh: '食物新鲜特写',
    },
    type: 'image_to_video',
    category: 'food',
    thumbnailAssetSeedKey: 'food-fresh-closeup-thumbnail',
    previewAssetSeedKey: 'food-fresh-closeup-preview',
    thumbnailUrl: resource('example3.png'),
    previewUrl: resource('example3.mp4'),
    prompt:
      'Transforme a foto do alimento em um video apetitoso com brilho natural, movimento lento, textura em destaque e sensacao fresca.',
    promptTranslations: {
      en: 'Turn the food photo into an appetizing video with natural gloss, slow motion, highlighted texture, and a fresh feeling.',
      zh: '把食物照片转换成诱人的视频，保留自然光泽、慢动作、突出纹理和新鲜感。',
    },
  },
  {
    seedKey: 'beauty-premium-detail',
    title: 'Detalhe premium de beleza',
    titleTranslations: {
      en: 'Premium beauty detail',
      zh: '美妆高级细节',
    },
    type: 'image_to_video',
    category: 'beauty',
    thumbnailAssetSeedKey: 'beauty-premium-detail-thumbnail',
    previewAssetSeedKey: 'beauty-premium-detail-preview',
    thumbnailUrl: resource('example4.png'),
    previewUrl: resource('example4.mp4'),
    prompt:
      'Crie um video premium de beleza com close-up elegante, reflexos suaves, embalagem em foco e movimento de camera delicado.',
    promptTranslations: {
      en: 'Create a premium beauty video with an elegant close-up, soft reflections, focused packaging, and delicate camera movement.',
      zh: '生成高级美妆视频，使用优雅特写、柔和反光、包装聚焦和细腻运镜。',
    },
  },
  {
    seedKey: 'electronics-launch',
    title: 'Lancamento de eletronico',
    titleTranslations: {
      en: 'Electronics launch',
      zh: '数码新品发布',
    },
    type: 'image_to_video',
    category: 'electronics',
    thumbnailAssetSeedKey: 'electronics-launch-thumbnail',
    previewAssetSeedKey: 'electronics-launch-preview',
    thumbnailUrl: resource('example5.png'),
    previewUrl: resource('example5.mp4'),
    prompt:
      'Gere um video de lancamento para produto eletronico com luz tecnica, movimento preciso, detalhes de material e atmosfera moderna.',
    promptTranslations: {
      en: 'Generate a launch video for an electronics product with technical lighting, precise motion, material detail, and a modern atmosphere.',
      zh: '生成数码产品发布视频，使用科技感灯光、精准运动、材质细节和现代氛围。',
    },
  },
  {
    seedKey: 'home-lifestyle-scene',
    title: 'Cena de casa e decoracao',
    titleTranslations: {
      en: 'Home lifestyle scene',
      zh: '家居生活场景',
    },
    type: 'image_to_video',
    category: 'home',
    thumbnailAssetSeedKey: 'home-lifestyle-scene-thumbnail',
    previewAssetSeedKey: 'home-lifestyle-scene-preview',
    thumbnailUrl: resource('example6.png'),
    previewUrl: resource('example6.mp4'),
    prompt:
      'Transforme a imagem em um video de casa e decoracao com cena realista, luz natural, movimento calmo e uso cotidiano do produto.',
    promptTranslations: {
      en: 'Turn the image into a home and decor video with a realistic scene, natural light, calm movement, and everyday product usage.',
      zh: '把图片转换成家居装饰视频，场景真实、自然光、运动平稳，并展示产品日常使用感。',
    },
  },
];
