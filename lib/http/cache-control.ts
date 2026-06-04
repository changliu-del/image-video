export const PUBLIC_CATALOG_CACHE_CONTROL =
  'public, max-age=60, s-maxage=300, stale-while-revalidate=600';

export const publicCatalogReadHeaders = {
  'Cache-Control': PUBLIC_CATALOG_CACHE_CONTROL,
} as const;
