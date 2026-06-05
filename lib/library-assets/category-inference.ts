import type { LibraryAssetCategory } from '../db/schema';

export function inferLibraryAssetCategoryFromFile(input: {
  name: string;
  type: string;
}): LibraryAssetCategory {
  const name = input.name.toLowerCase();
  const tryOnNamePattern =
    /(model|modelo|mannequin|person|模特|garment|cloth|dress|shirt|pants|服装|衣服|试衣)/;

  if (input.type.startsWith('video/')) {
    return 'image_to_video';
  }

  if (tryOnNamePattern.test(name)) {
    return 'try_on';
  }

  if (/(video|motion|clip|short|视频)/.test(name)) {
    return 'image_to_video';
  }

  return 'apparel_image';
}
