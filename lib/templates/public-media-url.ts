export type PublicTemplateMediaAssetSnapshot = {
  status: string | null;
  storageKey: string | null;
};

function getPublicR2BaseUrl() {
  return process.env.R2_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') ?? '';
}

export function resolvePublicTemplateMediaUrl(
  fallbackUrl: string,
  asset: PublicTemplateMediaAssetSnapshot
) {
  const storageKey = asset.storageKey?.trim();
  if (asset.status !== 'uploaded' || !storageKey?.startsWith('templates/')) {
    return fallbackUrl;
  }

  const publicBaseUrl = getPublicR2BaseUrl();
  if (!publicBaseUrl) {
    return fallbackUrl;
  }

  return `${publicBaseUrl}/${storageKey}`;
}
