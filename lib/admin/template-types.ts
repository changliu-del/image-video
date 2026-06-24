import {
  templateTypeLabels,
  type TemplateType,
} from '@/lib/templates/catalog';

type AdminTemplateLocale = 'pt' | 'en' | 'zh';

export const adminTemplateTypes = [
  'image_to_video',
  'model',
  'image_to_image',
  'try_on',
] as const satisfies readonly TemplateType[];

const adminTemplateTypeLabels: Record<
  TemplateType,
  Partial<Record<AdminTemplateLocale, string>>
> = {
  image_to_video: {
    zh: '图生视频页',
    en: 'Image to video',
    pt: 'Imagem para vídeo',
  },
  model: {
    zh: '模特页',
    en: 'Models',
    pt: 'Modelos',
  },
  image_to_image: {
    zh: '生图页',
    en: 'Image generation',
    pt: 'Imagem IA',
  },
  try_on: {
    zh: '智能穿衣页',
    en: 'Smart try-on',
    pt: 'Provador virtual',
  },
};

export function getAdminTemplateTypeLabel(
  type: TemplateType,
  locale: AdminTemplateLocale
) {
  return (
    adminTemplateTypeLabels[type]?.[locale] ?? templateTypeLabels[type][locale]
  );
}

export function normalizeAdminTemplateType(value: string | null | undefined) {
  return adminTemplateTypes.includes(value as TemplateType)
    ? (value as TemplateType)
    : adminTemplateTypes[0];
}
