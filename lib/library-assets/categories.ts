import {
  LIBRARY_ASSET_CATEGORIES,
  type LibraryAssetCategory,
} from '../db/schema';

const libraryAssetCategorySet = new Set<string>(LIBRARY_ASSET_CATEGORIES);

export function parseLibraryAssetCategoryParam(value: string | null) {
  if (!value) {
    return { ok: true, category: undefined } as const;
  }

  if (!libraryAssetCategorySet.has(value)) {
    return { ok: false, category: undefined } as const;
  }

  return { ok: true, category: value as LibraryAssetCategory } as const;
}
