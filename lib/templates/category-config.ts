import type { TemplateType } from '@/lib/templates/catalog';

const categoryPattern = /^[a-z0-9][a-z0-9_-]*$/;

export const imageToVideoTemplateCategories = [
  'fashion',
  'beauty',
  'electronics',
  'appliances',
  'home',
  'sports',
  'general',
] as const;

const templateCategoryOptionsByType: Partial<
  Record<TemplateType, readonly string[]>
> = {
  image_to_video: imageToVideoTemplateCategories,
};

export function normalizeTemplateCategoryValue(value: string | null | undefined) {
  const category = value?.trim().toLowerCase();
  if (!category) return null;

  return categoryPattern.test(category) ? category : null;
}

export function getTemplateCategoriesForType(type: TemplateType) {
  return templateCategoryOptionsByType[type] ?? [];
}

export function normalizeTemplateCategoryForType(
  _type: TemplateType,
  value: string | null | undefined
) {
  const category = normalizeTemplateCategoryValue(value);
  if (!category) return null;

  return category;
}
