import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import {
  adminContent,
  type AdminContent,
} from '../lib/admin/content';

vi.mock('@/lib/dashboard/content', () => ({
  normalizeDashboardLocale: (locale: string | null | undefined) => {
    if (locale === 'pt' || locale === 'en') return locale;
    return 'en';
  },
}));

const EXPECTED_ADMIN_TAB_KEYS = [
  'overview',
  'templates',
  'user-media',
  'users',
  'generation-jobs',
  'credit-ledger',
  'help',
] as const;

const EXISTING_ADMIN_TAB_KEYS = [
  'overview',
  'templates',
  'user-media',
  'users',
  'generation-jobs',
  'credit-ledger',
] as const;
const ENGLISH_ADMIN_HELP_KEYS = [
  'overview',
  'templates',
  'user-media',
  'users',
  'generation-jobs',
  'credit-ledger',
] as const;
const ENGLISH_HELP_SCREENSHOTS: Record<
  (typeof ENGLISH_ADMIN_HELP_KEYS)[number],
  readonly string[]
> = {
  overview: ['/admin-help/placements/admin-overview.png'],
  templates: [
    '/admin-help/placements/template-admin-list.png',
    '/admin-help/placements/template-admin-form.png',
    '/admin-help/placements/template-admin-order.png',
    '/admin-help/placements/templates-page.png',
    '/admin-help/placements/video-workbench.png',
  ],
  'user-media': ['/admin-help/placements/user-history.png'],
  users: ['/admin-help/placements/users.png'],
  'generation-jobs': ['/admin-help/placements/generation-jobs.png'],
  'credit-ledger': ['/admin-help/placements/credit-ledger.png'],
};
const TEMPLATE_HELP_EXPECTED_TERMS = [
  'Image to video',
  'Models',
  'Image generation',
  'Smart try-on',
  'Title',
  'Brazilian Portuguese title',
  'Category',
  'Gender',
  'Age',
  'Style',
  'Thumbnail asset ID',
  'Preview asset ID',
  'Prompt',
  'Brazilian Portuguese prompt',
  'Reorder',
  'thumbnailUrl',
  'previewUrl',
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

function expectPublicAssetExists(assetPath: string) {
  expect(
    existsSync(join(process.cwd(), 'public', assetPath.replace(/^\//, ''))),
    `${assetPath} should exist`
  ).toBe(true);
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

  it('keeps English Help pages backed by current screenshots', () => {
    for (const key of ENGLISH_ADMIN_HELP_KEYS) {
      const item = adminContent.en.help.items.find(
        (candidate) => candidate.key === key
      );

      expectNonEmptyString(item?.markdown, `en.help.${key}.markdown`);
      for (const screenshot of ENGLISH_HELP_SCREENSHOTS[key]) {
        expect(item?.markdown, `en.help.${key}.markdown`).toContain(screenshot);
        expectPublicAssetExists(screenshot);
      }
    }
  });

  it('keeps Template Help focused on the current template workflow', () => {
    const templates = adminContent.en.help.items.find(
      (item) => item.key === 'templates'
    );

    for (const screenshot of ENGLISH_HELP_SCREENSHOTS.templates) {
      expect(templates?.markdown, 'en.templates.markdown').toContain(
        screenshot
      );
    }
    expect(templates?.markdown, 'en.templates.markdown').not.toContain('/api/');
    expect(templates?.markdown, 'en.templates.markdown').not.toContain(
      'numbered screenshots'
    );
    expect(templates?.markdown, 'en.templates.markdown').not.toContain(
      'numeros das imagens'
    );
    for (const term of TEMPLATE_HELP_EXPECTED_TERMS) {
      expectTextIncludes(templates?.markdown, 'en.templates.markdown', term);
    }
    for (const term of REMOVED_TEMPLATE_HELP_TERMS) {
      expectTextExcludes(templates?.markdown, 'en.templates.markdown', term);
    }

    expect(
      adminContent.en.help.items.some(
        (item) => (item as { key: string }).key === 'library-assets'
      ),
      'en.library-assets removed'
    ).toBe(false);
  });
});
