import type { Locale } from '@/lib/marketing/content';

export const publicTemplatesPageContent: Record<
  Locale,
  {
    metadata: { title: string; description: string };
    eyebrow: string;
    title: string;
    description: string;
    searchPlaceholder: string;
    clearFilters: string;
    categoryFilterLabel: string;
    useTemplate: string;
    viewDetails: string;
    loginHint: string;
    promptLabel: string;
    emptyTitle: string;
    emptyText: string;
    loading: string;
    error: string;
    retry: string;
    loadMore: string;
    loadingMore: string;
    defaultCategory: string;
    idLabel: string;
  }
> = {
  pt: {
    metadata: {
      title: 'Templates de imagem para video com IA para vender no Brasil',
      description:
        'Explore templates de imagem para video para campanhas, produtos e conteudo de e-commerce no Brasil.',
    },
    eyebrow: 'Biblioteca de templates',
    title: 'Templates de imagem para video prontos para campanhas de produto.',
    description:
      'Escolha uma categoria de negocio, entre no workbench de video e ajuste o prompt com a imagem do seu produto.',
    searchPlaceholder: 'Buscar por categoria ou ID...',
    clearFilters: 'Limpar filtros',
    categoryFilterLabel: 'Categoria',
    useTemplate: 'Usar template',
    viewDetails: 'Ver detalhes',
    loginHint: 'Abra os detalhes para ver prompt e preview.',
    promptLabel: 'Prompt',
    emptyTitle: 'Nenhum template encontrado',
    emptyText: 'Remova filtros ou tente outra busca.',
    loading: 'Carregando templates...',
    error: 'Nao foi possivel carregar os templates.',
    retry: 'Tentar novamente',
    loadMore: 'Carregar mais',
    loadingMore: 'Carregando...',
    defaultCategory: 'Imagem para video',
    idLabel: 'ID',
  },
  en: {
    metadata: {
      title: 'AI image-to-video templates for ecommerce',
      description:
        'Browse image-to-video templates for product campaigns, ecommerce creative, and short-form content.',
    },
    eyebrow: 'Template library',
    title: 'Image-to-video templates ready for product campaigns.',
    description:
      'Pick a business category, open the video workbench, and adapt the prompt with your product image.',
    searchPlaceholder: 'Search by category or ID...',
    clearFilters: 'Clear filters',
    categoryFilterLabel: 'Category',
    useTemplate: 'Use template',
    viewDetails: 'View details',
    loginHint: 'Open details to see the prompt and preview.',
    promptLabel: 'Prompt',
    emptyTitle: 'No templates found',
    emptyText: 'Remove filters or try another search.',
    loading: 'Loading templates...',
    error: 'Could not load templates.',
    retry: 'Try again',
    loadMore: 'Load more',
    loadingMore: 'Loading...',
    defaultCategory: 'Image to video',
    idLabel: 'ID',
  },
  zh: {
    metadata: {
      title: '电商图生视频 AI 模板库',
      description: '浏览适合商品活动、电商创意和短视频内容的图生视频模板。',
    },
    eyebrow: '模板库',
    title: '面向商品营销的图生视频模板。',
    description:
      '选择业务分类，进入视频工作台，用你的商品图继续调整提示词。',
    searchPlaceholder: '按分类或 ID 搜索...',
    clearFilters: '清除筛选',
    categoryFilterLabel: '分类',
    useTemplate: '使用模板',
    viewDetails: '查看详情',
    loginHint: '打开详情后查看提示词和视频。',
    promptLabel: '提示词',
    emptyTitle: '没有找到模板',
    emptyText: '清除筛选，或换一个关键词搜索。',
    loading: '正在加载模板...',
    error: '模板加载失败。',
    retry: '重试',
    loadMore: '加载更多',
    loadingMore: '加载中...',
    defaultCategory: '图生视频',
    idLabel: 'ID',
  },
};
