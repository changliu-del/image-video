export const PUBLIC_CATALOG_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

export const TEMPLATE_CATALOG_LIST_CACHE_CONTROL =
  'public, max-age=30, s-maxage=60, stale-while-revalidate=300';

export const TEMPLATE_CATALOG_DETAIL_CACHE_CONTROL =
  'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';

export const publicCatalogReadHeaders = {
  'Cache-Control': PUBLIC_CATALOG_CACHE_CONTROL,
} as const;

export const templateCatalogListReadHeaders = {
  'Cache-Control': TEMPLATE_CATALOG_LIST_CACHE_CONTROL,
} as const;

export const templateCatalogReadHeaders = {
  'Cache-Control': TEMPLATE_CATALOG_DETAIL_CACHE_CONTROL,
} as const;
