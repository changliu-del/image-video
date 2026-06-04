import { describe, expect, it } from 'vitest';

import {
  PUBLIC_CATALOG_CACHE_CONTROL,
  publicCatalogReadHeaders,
} from '../lib/http/cache-control';

describe('public catalog cache headers', () => {
  it('allows browser and shared caches for non-user-specific catalog data', () => {
    expect(PUBLIC_CATALOG_CACHE_CONTROL).toBe(
      'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
    );
    expect(publicCatalogReadHeaders).toEqual({
      'Cache-Control': PUBLIC_CATALOG_CACHE_CONTROL,
    });
  });
});
