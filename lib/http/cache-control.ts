export const PUBLIC_CATALOG_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

export const TEMPLATE_CATALOG_CACHE_CONTROL =
  'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';

export const publicCatalogReadHeaders = {
  'Cache-Control': PUBLIC_CATALOG_CACHE_CONTROL,
} as const;

export const templateCatalogReadHeaders = {
  'Cache-Control': TEMPLATE_CATALOG_CACHE_CONTROL,
} as const;
