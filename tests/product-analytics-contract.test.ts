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
    const catalog = readSource('lib/product-analytics/catalog.ts');

    expect(appShell).toContain('content.nav.dataAnalysis');
    expect(appShell).toContain("href: '/analytics/sales'");
    expect(appShell).toContain("href: '/analytics/new'");
    expect(appShell).toContain("href: '/analytics/promoted'");
    expect(appShell).toContain("href: '/analytics/video-products'");
    expect(route).toContain("searchParams.get('rankType')");
    expect(route).toContain("searchParams.get('category')");
    expect(route).toContain('listActiveProductAnalyticsItems');
    expect(page).toContain('fastmossProductUrl');
    expect(page).toContain('tiktokProductUrl');
    expect(page).toContain('videoUrl');
    expect(page).toContain('selectedCategory');
    expect(page).toContain('allCategories');
    expect(page).not.toContain('Search product');
    expect(page).not.toContain("params.set('search'");
    expect(catalog).toContain("'video-products'");
  });
});
