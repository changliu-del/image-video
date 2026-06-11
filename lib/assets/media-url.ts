export function buildAssetMediaUrl(assetId: string) {
  return `/api/asset-media/${assetId}`;
}

export function buildAbsoluteAssetMediaUrl(assetId: string) {
  const baseUrl = process.env.BASE_URL?.trim().replace(/\/+$/, '');

  if (!baseUrl) {
    throw new Error('BASE_URL environment variable is required for asset media URLs');
  }

  return `${baseUrl}${buildAssetMediaUrl(assetId)}`;
}
