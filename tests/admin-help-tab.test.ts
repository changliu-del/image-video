import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  adminContent,
  type AdminContent,
} from '../lib/admin/content';

vi.mock('@/lib/dashboard/content', () => ({
  normalizeDashboardLocale: (locale: string | null | undefined) => {
    if (locale === 'pt' || locale === 'en' || locale === 'zh') return locale;
    return 'en';
  },
}));

const EXPECTED_ADMIN_TAB_KEYS = [
  'overview',
  'templates',
  'library-assets',
  'user-media',
  'users',
  'generation-jobs',
  'credit-ledger',
  'help',
] as const;

const EXISTING_ADMIN_TAB_KEYS = [
  'overview',
  'templates',
  'library-assets',
  'user-media',
  'users',
  'generation-jobs',
  'credit-ledger',
] as const;
const MINIMAL_TEMPLATE_HELP_FIELDS = [
  'id',
  'type',
  'category',
  'thumbnail_asset_id',
  'preview_asset_id',
  'prompt',
  'created_at',
  'updated_at',
] as const;
const REMOVED_TEMPLATE_HELP_TERMS = [
  'negativePrompt',
  'negative prompt',
  'Prompt negativo',
  '负向提示词',
  '反向提示词',
  'reverse prompt',
  'thumbnail_url',
  'preview_url',
  'tagsJson',
  'tagSlugs',
  'tags',
  'slug',
  'sortWeight',
  '排序权重',
  'costCredits',
  'aspectRatios',
  'durationSeconds',
  '提示词 JSON',
  '草稿和归档',
] as const;

type ExpectedAdminTabKey = (typeof EXPECTED_ADMIN_TAB_KEYS)[number];
type Assert<T extends true> = T;
type IsExactUnion<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;

type _AdminContentTabsUseExactKnownKeys = Assert<
  IsExactUnion<keyof AdminContent['tabs'], ExpectedAdminTabKey>
>;
type _AdminHelpItemsUseExactKnownKeys = Assert<
  IsExactUnion<AdminContent['help']['items'][number]['key'], ExpectedAdminTabKey>
>;

type AdminTableEntry = {
  key: string;
  adminOnly: boolean;
};

function readAdminShellSource() {
  return readFileSync(
    join(process.cwd(), 'app/(dashboard)/admin/components/admin-shell.tsx'),
    'utf8'
  );
}

function extractAdminTableEntries(source: string): AdminTableEntry[] {
  const registry = source.match(/const TABLES = \[([\s\S]*?)\] as const;/);
  expect(registry).not.toBeNull();

  const body = registry?.[1] ?? '';
  const entries: AdminTableEntry[] = [];
  const entryPattern =
    /\{\s*key:\s*'([^']+)'[\s\S]*?adminOnly:\s*(true|false)[\s\S]*?\}/g;

  for (const match of body.matchAll(entryPattern)) {
    entries.push({
      key: match[1],
      adminOnly: match[2] === 'true',
    });
  }

  return entries;
}

function expectCompleteKeySet(
  actualKeys: readonly string[],
  expectedKeys: readonly string[],
  label?: string
) {
  expect(new Set(actualKeys), label).toEqual(new Set(expectedKeys));
  expect(new Set(actualKeys).size, label).toBe(actualKeys.length);
}

function expectNonEmptyString(value: unknown, label: string) {
  expect(value, label).toEqual(expect.any(String));
  expect((value as string).trim(), label).not.toBe('');
}

function expectTextIncludes(
  value: string | undefined,
  label: string,
  expected: string
) {
  expect(value?.includes(expected), `${label} should include ${expected}`).toBe(
    true
  );
}

function expectTextExcludes(
  value: string | undefined,
  label: string,
  forbidden: string
) {
  expect(value?.includes(forbidden), `${label} should exclude ${forbidden}`).toBe(
    false
  );
}

describe('Admin Help tab coverage', () => {
  it('keeps the Admin tab registry complete without duplicate or missing keys', () => {
    const entries = extractAdminTableEntries(readAdminShellSource());
    const keys = entries.map((entry) => entry.key);

    expectCompleteKeySet(keys, EXPECTED_ADMIN_TAB_KEYS);
  });

  it('keeps existing Admin tabs in their current relative order', () => {
    const keys = extractAdminTableEntries(readAdminShellSource()).map(
      (entry) => entry.key
    );
    const existingKeys = keys.filter((key) =>
      (EXISTING_ADMIN_TAB_KEYS as readonly string[]).includes(key)
    );

    expect(existingKeys).toEqual(EXISTING_ADMIN_TAB_KEYS);
  });

  it('keeps every declared Admin tab reachable through the tab query parameter', () => {
    const source = readAdminShellSource();
    const keys = extractAdminTableEntries(source).map((entry) => entry.key);

    expect(source).toContain("searchParams.get('tab')");
    expect(source).toContain('visibleTables.some');
    expect(source).toContain("tab === 'overview'");
    expect(source).toContain('`/admin?tab=${tab}`');
    expectCompleteKeySet(
      keys.filter((key) => key !== 'overview'),
      EXPECTED_ADMIN_TAB_KEYS.filter((key) => key !== 'overview')
    );
  });

  it('keeps tab copy aligned for every Admin locale', () => {
    for (const [locale, content] of Object.entries(adminContent)) {
      const tabLabels = content.tabs as Record<string, string>;

      expectCompleteKeySet(
        Object.keys(tabLabels),
        EXPECTED_ADMIN_TAB_KEYS,
        locale
      );
      for (const key of EXPECTED_ADMIN_TAB_KEYS) {
        expectNonEmptyString(tabLabels[key], `${locale}.${key}`);
      }
    }
  });

  it('keeps Help content covering every Admin tab for every locale', () => {
    for (const [locale, content] of Object.entries(adminContent)) {
      const itemKeys = content.help.items.map((item) => item.key);

      expectCompleteKeySet(itemKeys, EXPECTED_ADMIN_TAB_KEYS, locale);
      expectNonEmptyString(content.help.title, `${locale}.help.title`);
      expectNonEmptyString(
        content.help.description,
        `${locale}.help.description`
      );
      expectNonEmptyString(
        content.help.principlesTitle,
        `${locale}.help.principlesTitle`
      );
      expect(
        content.help.principles.length,
        `${locale}.help.principles`
      ).toBeGreaterThan(0);
      for (const principle of content.help.principles) {
        expectNonEmptyString(principle, `${locale}.help.principles`);
      }
      expectNonEmptyString(
        content.help.rhythmTitle,
        `${locale}.help.rhythmTitle`
      );
      expect(
        content.help.rhythms.length,
        `${locale}.help.rhythms`
      ).toBeGreaterThan(0);
      for (const rhythm of content.help.rhythms) {
        expectNonEmptyString(rhythm.title, `${locale}.help.rhythms.title`);
        expect(
          rhythm.items.length,
          `${locale}.help.rhythms.items`
        ).toBeGreaterThan(0);
        for (const item of rhythm.items) {
          expectNonEmptyString(item, `${locale}.help.rhythms.items`);
        }
      }
      expectNonEmptyString(
        content.help.maintenanceTitle,
        `${locale}.help.maintenanceTitle`
      );
      expect(
        content.help.maintenance.length,
        `${locale}.help.maintenance`
      ).toBeGreaterThan(0);
      for (const item of content.help.maintenance) {
        expectNonEmptyString(item, `${locale}.help.maintenance`);
      }

      for (const [labelKey, label] of Object.entries(content.help.labels)) {
        expectNonEmptyString(label, `${locale}.help.labels.${labelKey}`);
      }

      for (const item of content.help.items) {
        expectNonEmptyString(item.title, `${locale}.help.${item.key}.title`);
        expectNonEmptyString(
          item.purpose,
          `${locale}.help.${item.key}.purpose`
        );
        for (const field of [
          'dailyActions',
          'keyFields',
          'riskSignals',
        ] as const) {
          expect(
            item[field].length,
            `${locale}.help.${item.key}.${field}`
          ).toBeGreaterThan(0);
          for (const value of item[field]) {
            expectNonEmptyString(
              value,
              `${locale}.help.${item.key}.${field}`
            );
          }
        }
      }
    }
  });

  it('covers every Admin tab with Chinese copy', () => {
    const zhTabs = adminContent.zh.tabs as Record<string, string>;

    expectCompleteKeySet(Object.keys(zhTabs), EXPECTED_ADMIN_TAB_KEYS);
    for (const key of EXPECTED_ADMIN_TAB_KEYS) {
      expect(zhTabs[key], `zh.${key}`).toMatch(/[\u3400-\u9fff]/);
    }
  });

  it('covers every Help entry with Chinese copy', () => {
    const zhHelp = adminContent.zh.help;

    expect(zhHelp.title).toMatch(/[\u3400-\u9fff]/);
    expect(zhHelp.description).toMatch(/[\u3400-\u9fff]/);
    for (const label of Object.values(zhHelp.labels)) {
      expect(label).toMatch(/[\u3400-\u9fff]/);
    }
    expect(zhHelp.principlesTitle).toMatch(/[\u3400-\u9fff]/);
    for (const principle of zhHelp.principles) {
      expect(principle).toMatch(/[\u3400-\u9fff]/);
    }
    expect(zhHelp.rhythmTitle).toMatch(/[\u3400-\u9fff]/);
    for (const rhythm of zhHelp.rhythms) {
      expect(rhythm.title).toMatch(/[\u3400-\u9fff]/);
      for (const item of rhythm.items) {
        expect(item).toMatch(/[\u3400-\u9fff]/);
      }
    }
    expect(zhHelp.maintenanceTitle).toMatch(/[\u3400-\u9fff]/);
    for (const item of zhHelp.maintenance) {
      expect(item).toMatch(/[\u3400-\u9fff]/);
    }
    for (const item of zhHelp.items) {
      expect(item.title, `zh.help.${item.key}.title`).toMatch(
        /[\u3400-\u9fff]/
      );
      expect(item.purpose, `zh.help.${item.key}.purpose`).toMatch(
        /[\u3400-\u9fff]/
      );
      for (const field of [
        'dailyActions',
        'keyFields',
        'riskSignals',
      ] as const) {
        for (const value of item[field]) {
          expect(value, `zh.help.${item.key}.${field}`).toMatch(
            /[\u3400-\u9fff]/
          );
        }
      }
    }
  });

  it('keeps Template and Library Asset Help as separate Markdown documents', () => {
    for (const [locale, content] of Object.entries(adminContent)) {
      const templates = content.help.items.find(
        (item) => item.key === 'templates'
      );
      const libraryAssets = content.help.items.find(
        (item) => item.key === 'library-assets'
      );

      expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
        '/admin-help/placements/template-admin-list.png'
      );
      expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
        '/admin-help/placements/template-admin-form.png'
      );
      expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
        '/admin-help/placements/templates-page.png'
      );
      expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
        '/admin-help/placements/video-workbench.png'
      );
      expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
        '/api/'
      );
      expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
        'numbered screenshots'
      );
      expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
        'numeros das imagens'
      );
      for (const field of MINIMAL_TEMPLATE_HELP_FIELDS) {
        expectTextIncludes(templates?.markdown, `${locale}.templates.markdown`, field);
      }
      for (const term of REMOVED_TEMPLATE_HELP_TERMS) {
        expectTextExcludes(templates?.markdown, `${locale}.templates.markdown`, term);
      }
      if (locale === 'zh') {
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          '模板保存后要按用户路径检查'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          '### 字段说明'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          'type=image_to_video'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          'category 是业务分类'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          '模板管理列表页'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          '模板编辑表单'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
          '模板没有被拆成两份'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
          '模板不是素材'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
          '不再维护'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
          '同一条模板记录'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
          '模板库卡片参数对应'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
          '模板库卡片'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
          '创作工作台参数对应'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          '## 一、引言'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          '## 二、系统整体界面介绍'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          '## 三、功能介绍'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).toContain(
          '## 四、业务操作指引'
        );
        expect(templates?.markdown, `${locale}.templates.markdown`).not.toContain(
          '### #1'
        );
        expect(libraryAssets?.markdown, `${locale}.library-assets.markdown`).toContain(
          '## 一、引言'
        );
        expect(libraryAssets?.markdown, `${locale}.library-assets.markdown`).toContain(
          '## 二、系统整体界面介绍'
        );
        expect(libraryAssets?.markdown, `${locale}.library-assets.markdown`).toContain(
          '## 三、功能介绍'
        );
        expect(libraryAssets?.markdown, `${locale}.library-assets.markdown`).toContain(
          '## 四、业务操作指引'
        );
      }

      expect(
        libraryAssets?.markdown,
        `${locale}.library-assets.markdown`
      ).toContain('/admin-help/placements/library-apparel-key.png');
      expect(
        libraryAssets?.markdown,
        `${locale}.library-assets.markdown`
      ).toContain('/admin-help/placements/library-try-on-key.png');
      expect(
        libraryAssets?.markdown,
        `${locale}.library-assets.markdown`
      ).not.toContain('/api/');
      expect(
        libraryAssets?.markdown,
        `${locale}.library-assets.markdown`
      ).not.toContain('/admin-help/placements/apparel-workbench.png');
    }

    const zhTemplates = adminContent.zh.help.items.find(
      (item) => item.key === 'templates'
    );
    const zhLibraryAssets = adminContent.zh.help.items.find(
      (item) => item.key === 'library-assets'
    );

    expect(zhTemplates?.markdown).not.toContain(
      '/admin-help/placements/library-video-key.png'
    );
    expect(zhTemplates?.markdown).not.toContain('如何管理素材库');
    expect(zhTemplates?.markdown).not.toContain('新增素材');
    expect(zhLibraryAssets?.markdown).not.toContain(
      '/admin-help/placements/template-admin-list.png'
    );
    expect(zhLibraryAssets?.markdown).not.toContain('如何管理模板');
    expect(zhLibraryAssets?.markdown).not.toContain('模板没有被拆成两份');
  });
});
