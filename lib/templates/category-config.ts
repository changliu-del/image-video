import type { TemplateType } from '@/lib/templates/catalog';

const categoryPattern = /^[a-z0-9][a-z0-9_-]*$/;
const maxModelCategoryLength = 120;

export const imageToVideoTemplateCategories = [
  'beauty',
  'fashion',
  'home',
  'sports',
  'electronics',
  'appliances',
  'common',
] as const;

export const imageToImageTemplateCategories = [
  'goods_display_window',
  'goods_nature',
  'goods_festival',
  'goods_architecture',
  'goods_abstract',
  'goods_interior',
] as const;

export const tryOnTemplateCategories = [
  'tryon_solid_background',
  'tryon_outdoor_commercial',
  'tryon_indoor_commercial',
  'tryon_outdoor_casual',
  'tryon_indoor_casual',
] as const;

export const modelTemplateCategories = [] as const;

const templateCategoryOptionsByType: Partial<
  Record<TemplateType, readonly string[]>
> = {
  image_to_video: imageToVideoTemplateCategories,
  image_to_image: imageToImageTemplateCategories,
  model: modelTemplateCategories,
  try_on: tryOnTemplateCategories,
};

const templateCategoryAliasesByType: Partial<
  Record<TemplateType, Record<string, string>>
> = {
  image_to_video: {
    general: 'common',
  },
  image_to_image: {
    display_window: 'goods_display_window',
    nature: 'goods_nature',
    festival: 'goods_festival',
    architecture: 'goods_architecture',
    abstract: 'goods_abstract',
    interior: 'goods_interior',
  },
  try_on: {
    solid_background: 'tryon_solid_background',
    outdoor_commercial: 'tryon_outdoor_commercial',
    indoor_commercial: 'tryon_indoor_commercial',
    outdoor_casual: 'tryon_outdoor_casual',
    indoor_casual: 'tryon_indoor_casual',
  },
};

export function normalizeTemplateCategoryValue(value: string | null | undefined) {
  const category = value?.trim().toLowerCase();
  if (!category) return null;

  return categoryPattern.test(category) ? category : null;
}

export function normalizeModelTemplateCategoryValue(
  value: string | null | undefined
) {
  const category = value?.trim();
  if (!category || category.length > maxModelCategoryLength) return null;

  return category;
}

export function getTemplateCategoriesForType(type: TemplateType) {
  return templateCategoryOptionsByType[type] ?? [];
}

export function normalizeTemplateCategoryForType(
  type: TemplateType,
  value: string | null | undefined
) {
  if (type === 'model') {
    return normalizeModelTemplateCategoryValue(value);
  }

  const category = normalizeTemplateCategoryValue(value);
  if (!category) return null;

  return templateCategoryAliasesByType[type]?.[category] ?? category;
}
