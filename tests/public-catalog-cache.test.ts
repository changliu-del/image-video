import { describe, expect, it } from 'vitest';

import {
  MODEL_ASSETS_CACHE_CONTROL,
  PUBLIC_CATALOG_CACHE_CONTROL,
  TEMPLATE_CATALOG_DETAIL_CACHE_CONTROL,
  TEMPLATE_CATALOG_LIST_CACHE_CONTROL,
  modelAssetsReadHeaders,
  publicCatalogReadHeaders,
  templateCatalogListReadHeaders,
  templateCatalogReadHeaders,
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

  it('keeps template list and detail caches short enough for Admin edits', () => {
    expect(TEMPLATE_CATALOG_LIST_CACHE_CONTROL).toBe(
      'public, max-age=30, s-maxage=60, stale-while-revalidate=300'
    );
    expect(TEMPLATE_CATALOG_DETAIL_CACHE_CONTROL).toBe(
      TEMPLATE_CATALOG_LIST_CACHE_CONTROL
    );
    expect(templateCatalogListReadHeaders).toEqual({
      'Cache-Control': TEMPLATE_CATALOG_LIST_CACHE_CONTROL,
    });
    expect(templateCatalogReadHeaders).toEqual({
      'Cache-Control': TEMPLATE_CATALOG_DETAIL_CACHE_CONTROL,
    });
  });

  it('keeps model assets uncached so Admin template edits are visible immediately', () => {
    expect(MODEL_ASSETS_CACHE_CONTROL).toBe('no-store');
    expect(modelAssetsReadHeaders).toEqual({
      'Cache-Control': MODEL_ASSETS_CACHE_CONTROL,
    });
  });
});
