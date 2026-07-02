import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('product analytics import and workspace contract', () => {
  it('stores ranking imports as batch-switched datasets', () => {
    const schema = readSource('lib/db/schema.ts');
    const migration = readSource(
      'lib/db/migrations/0032_product_analytics_imports.sql'
    );
    const service = readSource('lib/admin/services/product-analytics.ts');
    const parser = readSource('lib/product-analytics/xlsx.ts');

    expect(schema).toContain('productAnalyticsBatches');
    expect(schema).toContain('productAnalyticsActiveBatches');
    expect(schema).toContain('productAnalyticsItems');
    expect(migration).toContain('product_analytics_active_batches');
    expect(migration).toContain('ON DELETE CASCADE');
    expect(service).toContain('parseProductAnalyticsWorkbook');
    expect(parser).toContain("import * as XLSX from 'xlsx'");
    expect(parser).toContain('isVisibleWorkbookHeader');
    expect(parser).toContain('__EMPTY');
    expect(service).toContain('.onConflictDoUpdate');
    expect(service).toContain('productAnalyticsActiveBatches.rankType');
    expect(service).toContain('ne(productAnalyticsBatches.id, batch.id)');
  });

  it('wires Admin xlsx import without exposing generic DB row edits', () => {
    const route = readSource('app/api/admin/product-analytics/route.ts');
    const panel = readSource('components/admin/product-analytics-panel.tsx');
    const shell = readSource('app/(dashboard)/admin/components/admin-shell.tsx');
    const content = readSource('lib/admin/content.ts');

    expect(route).toContain('request.formData()');
    expect(route).toContain("endsWith('.xlsx')");
    expect(route).toContain('importProductAnalyticsWorkbook');
    expect(route).toContain('listProductAnalyticsImportSummaries');
    expect(panel).toContain("accept=\".xlsx");
    expect(panel).toContain('copy.importAction');
    expect(shell).toContain("key: 'product-analytics'");
    expect(shell).toContain('<ProductAnalyticsPanel');
    expect(content).toContain('Rows');
    expect(content).toContain('Source file');
    expect(content).toContain('Imported by');
  });

  it('adds the workspace Data analysis dropdown and ranking pages', () => {
    const appShell = readSource('app/(dashboard)/app-shell.tsx');
    const route = readSource('app/api/product-analytics/route.ts');
    const page = readSource(
      'components/product-analytics/product-analytics-page.tsx'
    );
    const query = readSource('lib/product-analytics/query.ts');
    const catalog = readSource('lib/product-analytics/catalog.ts');

    expect(appShell).toContain('content.nav.dataAnalysis');
    expect(appShell).toContain("href: '/analytics/sales'");
    expect(appShell).toContain("href: '/analytics/new'");
    expect(appShell).toContain("href: '/analytics/promoted'");
    expect(appShell).toContain("href: '/analytics/video-products'");
    expect(route).toContain("searchParams.get('rankType')");
    expect(route).toContain("searchParams.get('category')");
    expect(route).toContain('listActiveProductAnalyticsItems');
    expect(query).toContain('rawJson');
    expect(page).toContain('productImageUrl');
    expect(page).toContain('fastmossProductUrl');
    expect(page).toContain('tiktokProductUrl');
    expect(page).toContain('workbookColumnsByRank');
    expect(page).toContain('columnLabels');
    expect(page).toContain('sourceHeader');
    expect(page).toContain('buildWorkbookColumns');
    expect(page).toContain("promoted: [");
    expect(page).toContain("'关联达人数'");
    expect(page).toContain("'商品封面链接'");
    expect(page).toContain("'视频播放量'");
    expect(page).toContain("en: 'Linked creators'");
    expect(page).toContain("pt: 'Criadores vinculados'");
    expect(page).toContain("en: 'Video'");
    expect(page).toContain("pt: 'Vídeo'");
    expect(page).toContain('VideoPreviewCell');
    expect(page).toContain('PlayCircle');
    expect(page).toContain("return 'video'");
    expect(page).not.toContain("en: 'Listed at'");
    expect(page).not.toContain("column('预估商品上架时间'");
    expect(page).toContain('column.label[localeKey]');
    expect(page).not.toContain('data?.headers');
    expect(page).toContain('selectedCategory');
    expect(page).toContain('allCategories');
    expect(page).not.toContain('Search product');
    expect(page).not.toContain("params.set('search'");
    expect(page).not.toContain('productAnalyticsRankTypes.map');
    expect(page).not.toContain('activeConfig.description');
    expect(page).not.toContain('sourceFileName');
    expect(page).not.toContain('labels.source');
    expect(page).not.toContain('labels.views');
    expect(page).not.toContain('labels.likes');
    expect(page).not.toContain('labels.actions');
    expect(page).not.toContain('#{item.rank}');
    expect(catalog).toContain("'video-products'");
  });
});
