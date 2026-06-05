import { describe, expect, it } from 'vitest';

import {
  getLibraryItemAssetId,
  getLibraryItemImage,
  getLibraryItemLabel,
  libraryItemKey,
  normalizeLibraryItems,
} from '../components/create/library-item-utils';

describe('library item utilities', () => {
  it('uses assetUrl for image library assets', () => {
    expect(
      getLibraryItemImage({
        title: 'Product',
        assetUrl: 'https://cdn.example.com/product.webp',
        mimeType: 'image/webp',
      })
    ).toBe('https://cdn.example.com/product.webp');
  });

  it('does not return a video URL for image-only workbench grids', () => {
    expect(
      getLibraryItemImage({
        title: 'Video example',
        assetUrl: 'https://cdn.example.com/example.mp4',
        publicUrl: 'https://cdn.example.com/example.mp4',
        videoUrl: 'https://cdn.example.com/example.mp4',
        mimeType: 'video/mp4',
      })
    ).toBe('');
  });

  it('uses a real thumbnail for video items when one is available', () => {
    expect(
      getLibraryItemImage({
        title: 'Video example',
        thumbnailUrl: 'https://cdn.example.com/example-poster.jpg',
        videoUrl: 'https://cdn.example.com/example.mp4',
        mimeType: 'video/mp4',
      })
    ).toBe('https://cdn.example.com/example-poster.jpg');
  });

  it('normalizes common API envelope shapes', () => {
    const item = { id: 'asset-1', title: 'Asset 1' };

    expect(normalizeLibraryItems({ items: [item] })).toEqual([item]);
    expect(normalizeLibraryItems({ list: [item] })).toEqual([item]);
    expect(normalizeLibraryItems(null)).toEqual([]);
  });

  it('builds stable labels and keys', () => {
    const item = { id: 'asset-1', title: 'Hero product' };

    expect(getLibraryItemLabel(item)).toBe('Hero product');
    expect(libraryItemKey(item)).toBe('asset-1');
  });

  it('normalizes the underlying asset id for generation inputs', () => {
    expect(getLibraryItemAssetId({ assetId: 123, title: 'Asset' })).toBe('123');
    expect(getLibraryItemAssetId({ id: 'template-1', title: 'Template' })).toBe('');
  });

  it('supports user media items as generation-ready library items', () => {
    const [item] = normalizeLibraryItems({
      items: [
        {
          id: 'media-1',
          assetId: 'asset-1',
          title: 'Past result',
          generationType: 'apparel_image',
          imageUrl: 'https://cdn.example.com/history.webp',
          source: 'history',
          isFavorite: true,
          usedCount: 2,
        },
      ],
    });

    expect(getLibraryItemAssetId(item)).toBe('asset-1');
    expect(getLibraryItemImage(item)).toBe('https://cdn.example.com/history.webp');
    expect(getLibraryItemLabel(item)).toBe('Past result');
  });
});
