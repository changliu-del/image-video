import { describe, expect, it } from 'vitest';

import { buildWanxiangTemplateLocalization } from '../scripts/wanxiang-template-localization';

function expectLocalizedText(value: string) {
  expect(value.trim().length).toBeGreaterThan(3);
  expect(value).not.toMatch(/[\u3400-\u9fff]/);
}

describe('Wanxiang template localization', () => {
  it('creates English and Brazilian Portuguese text for product-image templates', () => {
    const localization = buildWanxiangTemplateLocalization({
      category: 'goods_display_window',
      prompt: '白色平台，红橙渐变背景',
      sourceCategory: '展台橱窗',
      title: '红橙渐变',
      type: 'image_to_image',
    });

    expectLocalizedText(localization.titleTranslations.en);
    expectLocalizedText(localization.titleTranslations.pt);
    expectLocalizedText(localization.promptTranslations.en);
    expectLocalizedText(localization.promptTranslations.pt);
    expect(localization.promptTranslations.en).toContain(
      'Commercial product image template'
    );
    expect(localization.promptTranslations.pt).toContain(
      'Template de imagem comercial'
    );
  });

  it('falls back to localized category titles for unmapped short titles', () => {
    const localization = buildWanxiangTemplateLocalization({
      category: 'goods_nature',
      prompt: '水面上的冰台，冰雪景观',
      sourceCategory: '自然景观',
      title: '冰冰凉凉',
      type: 'image_to_image',
    });

    expect(localization.titleTranslations.en).not.toBe('undefined');
    expect(localization.titleTranslations.pt).not.toBe('undefined');
    expect(localization.titleTranslations.en).toContain('Natural Landscape');
    expect(localization.titleTranslations.pt).toContain('Paisagem Natural');
  });

  it('creates English and Brazilian Portuguese text for try-on templates', () => {
    const localization = buildWanxiangTemplateLocalization({
      category: 'tryon_solid_background',
      prompt:
        '中景镜头。模特站立，背景为简洁的中性灰色，光线明亮均匀。',
      sourceCategory: '纯色背景',
      title: '素净灰白',
      type: 'try_on',
    });

    expectLocalizedText(localization.titleTranslations.en);
    expectLocalizedText(localization.titleTranslations.pt);
    expectLocalizedText(localization.promptTranslations.en);
    expectLocalizedText(localization.promptTranslations.pt);
    expect(localization.promptTranslations.en).toContain(
      'Virtual try-on template'
    );
    expect(localization.promptTranslations.pt).toContain(
      'Template de prova virtual'
    );
  });
});
