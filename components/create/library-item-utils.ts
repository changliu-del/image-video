export type WorkbenchLibraryItem = {
  id?: string | number;
  assetId?: string | number | null;
  name?: string;
  title?: string;
  description?: string | null;
  prompt?: string | null;
  source?: string | null;
  generationType?: string | null;
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  assetUrl?: string | null;
  publicUrl?: string | null;
  asset?: string | null;
  videoUrl?: string | null;
  mimeType?: string | null;
  type?: string | null;
  isFavorite?: boolean | null;
  usedCount?: number | null;
};

function isVideoUrl(value: string | null | undefined) {
  return /\.(mp4|webm)(?:[?#].*)?$/i.test(value ?? '');
}

function isVideoItem(item: WorkbenchLibraryItem) {
  return (
    item.mimeType?.startsWith('video/') ||
    item.type === 'video' ||
    Boolean(item.videoUrl) ||
    isVideoUrl(item.assetUrl) ||
    isVideoUrl(item.publicUrl) ||
    isVideoUrl(item.asset)
  );
}

export function getLibraryItemImage(item: WorkbenchLibraryItem | null | undefined) {
  if (!item) return '';

  const directImage =
    item.thumbnailUrl ?? item.previewUrl ?? item.imageUrl ?? null;

  if (directImage && !isVideoUrl(directImage)) {
    return directImage;
  }

  if (isVideoItem(item)) {
    return '';
  }

  return item.assetUrl ?? item.publicUrl ?? item.asset ?? '';
}

export function getLibraryItemLabel(item: WorkbenchLibraryItem) {
  return item.title ?? item.name ?? String(item.id ?? 'Asset');
}

export function getLibraryItemAssetId(
  item: WorkbenchLibraryItem | null | undefined
) {
  return item?.assetId == null ? '' : String(item.assetId);
}

export function normalizeLibraryItems(value: unknown): WorkbenchLibraryItem[] {
  if (Array.isArray(value)) return value as WorkbenchLibraryItem[];
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  for (const key of ['items', 'templates', 'assets', 'data', 'results', 'list']) {
    if (Array.isArray(record[key])) {
      return record[key] as WorkbenchLibraryItem[];
    }
  }

  return [];
}

export function libraryItemKey(item: WorkbenchLibraryItem) {
  return String(item.id ?? getLibraryItemLabel(item));
}
