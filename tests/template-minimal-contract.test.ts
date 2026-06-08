import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { templates } from '../lib/db/schema';

const EXPECTED_TEMPLATE_MODEL_FIELDS = [
  'id',
  'type',
  'title',
  'titleTranslations',
  'category',
  'thumbnailAssetId',
  'previewAssetId',
  'prompt',
  'promptTranslations',
  'sortOrder',
  'createdAt',
  'updatedAt',
] as const;

const EXPECTED_TEMPLATE_SQL_COLUMNS = [
  'id',
  'type',
  'title',
  'title_translations_json',
  'category',
  'thumbnail_asset_id',
  'preview_asset_id',
  'prompt',
  'prompt_translations_json',
  'sort_order',
  'created_at',
  'updated_at',
] as const;

const REMOVED_TEMPLATE_TABLE_FIELDS = [
  'name',
  'description',
  'slug',
  'status',
  'negativePrompt',
  'reversePrompt',
  'thumbnailUrl',
  'previewUrl',
  'tagsJson',
  'tagSlugs',
  'costCredits',
  'aspectRatios',
  'aspectRatiosJson',
  'durationSeconds',
  'sortWeight',
  'usageCount',
  'createdBy',
  'updatedBy',
] as const;

const REMOVED_PUBLIC_TEMPLATE_FIELDS = [
  'name',
  'description',
  'slug',
  'status',
  'titleTranslations',
  'promptTranslations',
  'negativePrompt',
  'reversePrompt',
  'thumbnailAssetId',
  'previewAssetId',
  'tagsJson',
  'tagSlugs',
  'costCredits',
  'aspectRatios',
  'aspectRatiosJson',
  'durationSeconds',
  'sortWeight',
  'sortOrder',
  'usageCount',
  'createdBy',
  'updatedBy',
] as const;

const EXPECTED_PUBLIC_TEMPLATE_LIST_FIELDS = [
  'id',
  'title',
  'type',
  'category',
  'thumbnailUrl',
  'previewUrl',
] as const;

const EXPECTED_PUBLIC_TEMPLATE_DETAIL_FIELDS = [
  'prompt',
] as const;

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function extractExportedObjectType(source: string, typeName: string) {
  const match = source.match(
    new RegExp(`export type ${typeName} = [^\\{;]*\\{([\\s\\S]*?)\\n\\};`)
  );
  expect(match, `${typeName} should be an exported object type`).not.toBeNull();
  return match?.[1] ?? '';
}

function expectObjectTypeField(block: string, typeName: string, field: string) {
  expect(block, `${field} should be in ${typeName}`).toMatch(
    new RegExp(`\\b${field}\\??:`)
  );
}

describe('minimal template catalog contract', () => {
  it('keeps the templates table limited to the minimal model fields', () => {
    const columns = getTableColumns(templates);
    const modelFields = Object.keys(columns);
    const sqlColumns = Object.values(columns).map((column) => column.name);

    expect(modelFields).toEqual([...EXPECTED_TEMPLATE_MODEL_FIELDS]);
    expect(sqlColumns).toEqual([...EXPECTED_TEMPLATE_SQL_COLUMNS]);
    expect(modelFields).not.toEqual(
      expect.arrayContaining([...REMOVED_TEMPLATE_TABLE_FIELDS])
    );
  });

  it('keeps public template list and detail shapes separated from DB asset ids', () => {
    const source = readSource('lib/templates/public-client.ts');
    const listItem = extractExportedObjectType(source, 'PublicTemplateListItem');
    const detailItem = extractExportedObjectType(
      source,
      'PublicTemplateDetailItem'
    );

    for (const field of EXPECTED_PUBLIC_TEMPLATE_LIST_FIELDS) {
      expectObjectTypeField(listItem, 'PublicTemplateListItem', field);
    }
    expect(listItem, 'list items should not expose prompt').not.toMatch(
      /\bprompt\??:/
    );

    expect(source).toContain(
      'normalizePublicTemplateItems(value: unknown): PublicTemplateListItem[]'
    );
    expect(source).toContain('normalizePublicTemplateDetail');
    expect(source).toContain(
      'export type PublicTemplateDetailItem = PublicTemplateListItem & {'
    );

    for (const field of EXPECTED_PUBLIC_TEMPLATE_DETAIL_FIELDS) {
      expectObjectTypeField(detailItem, 'PublicTemplateDetailItem', field);
    }

    for (const block of [listItem, detailItem]) {
      expect(block).not.toMatch(/\bthumbnailAssetId\??:/);
      expect(block).not.toMatch(/\bpreviewAssetId\??:/);
      expect(block).not.toMatch(/\btags\??:/);
      expect(block).not.toMatch(/\bmediaType\??:/);
      expect(block).not.toMatch(/\bsource\??:/);
    }

    for (const field of REMOVED_PUBLIC_TEMPLATE_FIELDS) {
      expect(source, `${field} should not be public template output`).not.toMatch(
        new RegExp(`\\b${field}\\??:`)
      );
    }
  });

  it('keeps public template list and detail endpoints driven by type without legacy browse controls', () => {
    const listRoute = readSource('app/api/templates/route.ts');
    const detailRoutePath = 'app/api/templates/[id]/route.ts';

    expect(existsSync(join(process.cwd(), detailRoutePath))).toBe(true);
    const detailRoute = readSource(detailRoutePath);

    expect(listRoute).toContain("searchParams.get('type')");
    expect(listRoute).toContain('templateCatalogListReadHeaders');
    expect(detailRoute).toContain('templateCatalogReadHeaders');
    expect(listRoute).not.toContain("searchParams.get('id')");
    expect(listRoute).not.toContain('getTemplateDetail');
    expect(detailRoute).toContain('getTemplateDetail');
    expect(listRoute).not.toContain("getAll('tag')");
    expect(listRoute).not.toContain("get('tags')");
    expect(listRoute).not.toContain("get('sort')");
    expect(listRoute).not.toContain('PublishedTemplateSort');
  });
});
