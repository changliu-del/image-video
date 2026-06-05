import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseLibraryAssetCategoryParam } from '../lib/library-assets/categories';
import { inferLibraryAssetCategoryFromFile } from '../lib/library-assets/category-inference';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('library asset category parsing', () => {
  it('accepts supported categories and rejects unknown values', () => {
    expect(parseLibraryAssetCategoryParam(null)).toEqual({
      ok: true,
      category: undefined,
    });
    expect(parseLibraryAssetCategoryParam('apparel_image')).toEqual({
      ok: true,
      category: 'apparel_image',
    });
    expect(parseLibraryAssetCategoryParam('bogus')).toEqual({
      ok: false,
      category: undefined,
    });
  });
});

describe('library asset Admin category inference', () => {
  it('infers video and try-on categories from the selected file', () => {
    expect(
      inferLibraryAssetCategoryFromFile({ name: 'campaign.mp4', type: 'video/mp4' })
    ).toBe('image_to_video');
    expect(
      inferLibraryAssetCategoryFromFile({ name: 'model-look.webp', type: 'image/webp' })
    ).toBe('try_on');
    expect(
      inferLibraryAssetCategoryFromFile({ name: 'product-hero.webp', type: 'image/webp' })
    ).toBe('apparel_image');
  });
});

describe('library asset category migration', () => {
  it('preserves multi-use-case assets with one row per asset/category', () => {
    const migration = readSource(
      'lib/db/migrations/0013_simplify_library_assets.sql'
    );
    const followup = readSource(
      'lib/db/migrations/0014_library_assets_category_unique.sql'
    );

    expect(migration).toContain('insert into library_assets');
    expect(migration).toContain('la.use_cases_json ? categories.category');
    expect(migration).toContain('categories.category <> la.category');
    expect(migration).toContain('drop index if exists library_assets_asset_id_unique');
    expect(migration).toContain('library_assets_asset_category_unique');
    expect(followup).toContain('drop index if exists library_assets_asset_id_unique');
    expect(followup).toContain('on library_assets (asset_id, category)');
  });
});
