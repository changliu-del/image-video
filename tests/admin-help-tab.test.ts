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
  'users',
  'assets',
  'generation-jobs',
  'credit-ledger',
  'help',
] as const;

const EXISTING_ADMIN_TAB_KEYS = [
  'overview',
  'templates',
  'library-assets',
  'users',
  'assets',
  'generation-jobs',
  'credit-ledger',
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
});
