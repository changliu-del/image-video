export type PublicTemplateType = 'image_to_video' | 'image_to_image' | 'try_on';

export type PublicTemplateListItem = {
  id: string;
  title: string;
  type: PublicTemplateType;
  category: string;
  thumbnailUrl: string;
  previewUrl: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PublicTemplateDetailItem = PublicTemplateListItem & {
  prompt: string;
};

export type PublicTemplateItem = PublicTemplateListItem;

export type PublicTemplatesApiResponse = {
  list?: unknown[];
  items?: unknown[];
  categories?: unknown[];
  total?: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
};

const templateTypes = new Set<PublicTemplateType>([
  'image_to_video',
  'image_to_image',
  'try_on',
]);

function isPublicTemplateType(value: string): value is PublicTemplateType {
  return templateTypes.has(value as PublicTemplateType);
}

function readString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }

  return '';
}

function nullableString(record: Record<string, unknown>, ...keys: string[]) {
  return readString(record, ...keys) || null;
}

function inferTemplateType(record: Record<string, unknown>) {
  const explicitType = readString(record, 'type');
  if (isPublicTemplateType(explicitType)) return explicitType;

  const legacyCategory = readString(record, 'category');
  return isPublicTemplateType(legacyCategory) ? legacyCategory : '';
}

function normalizeTemplateItem(
  value: unknown
): PublicTemplateListItem | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const type = inferTemplateType(record);
  if (!type) return null;

  const id = readString(record, 'id');
  const thumbnailUrl = readString(record, 'thumbnailUrl', 'imageUrl');
  const previewUrl = readString(record, 'previewUrl', 'videoUrl');

  if (!id || !thumbnailUrl || !previewUrl) return null;

  const rawCategory = readString(record, 'category');
  const category = isPublicTemplateType(rawCategory) ? '' : rawCategory;
  const title = readString(record, 'title', 'name') || category || id;

  return {
    id,
    title,
    type,
    category,
    thumbnailUrl,
    previewUrl,
    createdAt: nullableString(record, 'createdAt', 'created_at'),
    updatedAt: nullableString(record, 'updatedAt', 'updated_at'),
  };
}

export function normalizePublicTemplateDetail(
  value: unknown
): PublicTemplateDetailItem | null {
  const item = normalizeTemplateItem(value);
  if (!item || !value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const prompt = readString(record, 'prompt');

  if (!prompt) return null;

  return {
    ...item,
    prompt,
  };
}

export function normalizePublicTemplateItems(value: unknown): PublicTemplateListItem[] {
  const source = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? ((value as PublicTemplatesApiResponse).list ??
        (value as PublicTemplatesApiResponse).items ??
        [])
      : [];

  return source
    .map(normalizeTemplateItem)
    .filter((item): item is PublicTemplateListItem => Boolean(item));
}

export function normalizePublicTemplateCategories(value: unknown) {
  const source =
    value && typeof value === 'object'
      ? (value as PublicTemplatesApiResponse).categories
      : [];

  if (!Array.isArray(source)) return [];

  return source
    .filter((category): category is string => typeof category === 'string')
    .map((category) => category.trim())
    .filter(Boolean);
}

export function getPublicTemplateMediaUrl(template: PublicTemplateItem) {
  return template.thumbnailUrl;
}

export function isPublicTemplateVideo(template: PublicTemplateItem) {
  return /\.(mp4|webm|mov)(?:[?#].*)?$/i.test(
    getPublicTemplateMediaUrl(template)
  );
}

export function uniquePublicTemplates(items: PublicTemplateItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
