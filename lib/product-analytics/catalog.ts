export const productAnalyticsRankTypes = [
  'sales',
  'new',
  'promoted',
  'video-products',
] as const;

export type ProductAnalyticsRankType =
  (typeof productAnalyticsRankTypes)[number];

export const productAnalyticsRankSet = new Set<string>(
  productAnalyticsRankTypes
);

export const productAnalyticsRankConfig: Record<
  ProductAnalyticsRankType,
  {
    path: string;
    title: { en: string; pt: string };
    shortLabel: { en: string; pt: string };
    description: { en: string; pt: string };
  }
> = {
  sales: {
    path: '/analytics/sales',
    title: { en: 'Sales ranking', pt: 'Ranking de vendas' },
    shortLabel: { en: 'Sales ranking', pt: 'Vendas' },
    description: {
      en: 'Imported TikTok Shop products ranked by recent sales.',
      pt: 'Produtos do TikTok Shop importados por vendas recentes.',
    },
  },
  new: {
    path: '/analytics/new',
    title: { en: 'New product ranking', pt: 'Novos produtos' },
    shortLabel: { en: 'New products', pt: 'Novos' },
    description: {
      en: 'Imported newly listed products with early traction signals.',
      pt: 'Produtos recém-listados importados com sinais iniciais de tração.',
    },
  },
  promoted: {
    path: '/analytics/promoted',
    title: { en: 'Promoted ranking', pt: 'Ranking em promoção' },
    shortLabel: { en: 'Promoted ranking', pt: 'Promoção' },
    description: {
      en: 'Imported products with strong affiliate and creator promotion.',
      pt: 'Produtos importados com forte promoção por afiliados e criadores.',
    },
  },
  'video-products': {
    path: '/analytics/video-products',
    title: { en: 'Video product ranking', pt: 'Produtos em vídeo' },
    shortLabel: { en: 'Video products', pt: 'Vídeo' },
    description: {
      en: 'Imported products ranked through selling video performance.',
      pt: 'Produtos importados ranqueados por performance de vídeos vendedores.',
    },
  },
};

export function normalizeProductAnalyticsRank(
  value: string | null | undefined
): ProductAnalyticsRankType {
  return productAnalyticsRankSet.has(value ?? '')
    ? (value as ProductAnalyticsRankType)
    : 'sales';
}

export function isProductAnalyticsRank(
  value: string | null | undefined
): value is ProductAnalyticsRankType {
  return productAnalyticsRankSet.has(value ?? '');
}
