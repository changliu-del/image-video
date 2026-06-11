import { describe, expect, it } from 'vitest';

import {
  buildModelTemplateLocalization,
  localizeModelCategoryTags,
  resolveModelPrompt,
  resolveModelTitle,
  stripModelAgePrefix,
} from '../lib/model-assets/localization';

function expectNonChinese(value: string) {
  expect(value.trim().length).toBeGreaterThan(3);
  expect(value).not.toMatch(/[\u3400-\u9fff]/);
}

describe('Wanxiang model localization', () => {
  it('removes child age prefixes from model names', () => {
    expect(stripModelAgePrefix('大童 | 海伦')).toBe('海伦');
    expect(stripModelAgePrefix('小童｜伊恩')).toBe('伊恩');
    expect(stripModelAgePrefix('中童 - 科迪')).toBe('科迪');
  });

  it('builds multilingual model title and prompt translations', () => {
    const localization = buildModelTemplateLocalization({
      category: '女/儿童/冷酷',
      prompt: '风格：清纯\n特征：冷酷/双麻花辫/欧美',
      title: '大童 | 海伦',
    });

    expect(localization.titleTranslations.zh).toBe('海伦');
    expect(localization.titleTranslations.en).toBe('Helen');
    expect(localization.titleTranslations.pt).toBe('Helen');
    expectNonChinese(localization.promptTranslations.en);
    expectNonChinese(localization.promptTranslations.pt);
    expect(localization.promptTranslations.en).toContain('Virtual try-on model');
    expect(localization.promptTranslations.pt).toContain(
      'Modelo para prova virtual'
    );
  });

  it('falls back from stale Chinese translations at read time', () => {
    const staleTranslations = {
      en: '大童 | 海伦',
      pt: '大童 | 海伦',
      zh: '大童 | 海伦',
    };

    expect(
      resolveModelTitle({
        category: '女/儿童/冷酷',
        locale: 'en',
        title: '大童 | 海伦',
        translations: staleTranslations,
      })
    ).toBe('Helen');
    expect(
      resolveModelTitle({
        category: '女/儿童/冷酷',
        locale: 'zh',
        title: '大童 | 海伦',
        translations: staleTranslations,
      })
    ).toBe('海伦');

    const prompt = resolveModelPrompt({
      category: '女/儿童/冷酷',
      locale: 'pt',
      prompt: '风格：清纯\n特征：冷酷/双麻花辫/欧美',
      title: '大童 | 海伦',
      translations: { pt: '风格：清纯' },
    });

    expectNonChinese(prompt);
  });

  it('localizes display tags while preserving canonical categories elsewhere', () => {
    expect(localizeModelCategoryTags('女/儿童/冷酷', 'en')).toEqual([
      'Female',
      'Child',
      'Cool',
    ]);
    expect(localizeModelCategoryTags('女/儿童/冷酷', 'zh')).toEqual([
      '女',
      '儿童',
      '冷酷',
    ]);
  });
});
