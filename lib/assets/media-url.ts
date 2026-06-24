export function buildAssetMediaUrl(assetId: string | number) {
  return `/api/asset-media/${assetId}`;
}

export function buildAbsoluteAssetMediaUrl(assetId: string | number) {
  const baseUrl = process.env.BASE_URL?.trim().replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error('BASE_URL environment variable is required for asset media URLs');
  }

  return `${baseUrl}${buildAssetMediaUrl(assetId)}`;
}
