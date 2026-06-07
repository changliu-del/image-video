import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readFirstExistingSource(paths: string[]) {
  const existing = paths.find((path) => existsSync(join(process.cwd(), path)));
  expect(
    typeof existing,
    `expected one source file from: ${paths.join(', ')}`
  ).toBe('string');
  return readSource(existing as string);
}

function queriesImageToVideoType(source: string) {
  return (
    source.includes("type: 'image_to_video'") ||
    source.includes("params.set('type', 'image_to_video')") ||
    source.includes('type=image_to_video')
  );
}

describe('template catalog routing contract', () => {
  it('queries image-to-video templates by type across public and workbench surfaces', () => {
    const home = readSource('components/marketing/home-page.tsx');
    const templatesPage = readFirstExistingSource([
      'components/marketing/templates-page.tsx',
      'app/[locale]/templates/page.tsx',
    ]);
    const workbench = readSource('components/create/image-video-workbench.tsx');

    for (const [label, source] of [
      ['home', home],
      ['templates page', templatesPage],
      ['image-video workbench', workbench],
    ] as const) {
      expect(queriesImageToVideoType(source), label).toBe(true);
    }
    expect(home).not.toContain("sort: 'featured'");
    expect(home).toContain("viewAll: 'View all templates'");
    expect(home).toContain(
      "href={getLocalizedHref(locale, '/templates?type=image_to_video')}"
    );
    expect(home).not.toContain('setPage((value) => value + 1)');
    expect(workbench).not.toContain("category: 'image_to_video'");
  });

  it('uses category only as a business filter, with no tag or sort semantics', () => {
    const route = readSource('app/api/templates/route.ts');
    const query = readSource('lib/templates/query.ts');
    const publicClient = readSource('lib/templates/public-client.ts');
    const templatesPage = readFirstExistingSource([
      'components/marketing/templates-page.tsx',
      'app/[locale]/templates/page.tsx',
    ]);
    const categoryConfig = readSource('lib/templates/category-config.ts');

    expect(route).toContain("searchParams.get('category')");
    expect(query).toContain('eq(templates.category');
    expect(query).toContain('categories: string[]');
    expect(query).toContain('listTemplateCategoriesForType');
    expect(publicClient).toContain('normalizePublicTemplateCategories');
    expect(templatesPage).toContain('normalizePublicTemplateCategories');
    expect(templatesPage).not.toContain('label={content.allCategories}');
    expect(templatesPage).not.toContain("setActiveCategory('')");
    expect(categoryConfig).toContain('return category;');
    expect(route).not.toContain("getAll('tag')");
    expect(route).not.toContain("get('tags')");
    expect(route).not.toContain("get('sort')");
    expect(query).not.toContain('tagsJson');
    expect(query).not.toContain('sortWeight');
  });

  it('keeps public template list and detail data cacheable but split', () => {
    const listRoute = readSource('app/api/templates/route.ts');
    const detailRoute = readFirstExistingSource([
      'app/api/templates/[id]/route.ts',
    ]);
    const cacheControl = readSource('lib/http/cache-control.ts');
    const publicClient = readSource('lib/templates/public-client.ts');

    expect(cacheControl).toContain('TEMPLATE_CATALOG_CACHE_CONTROL');
    expect(cacheControl).toContain('s-maxage=86400');
    expect(cacheControl).toContain('stale-while-revalidate=604800');
    expect(listRoute).toContain('templateCatalogReadHeaders');
    expect(detailRoute).toContain('templateCatalogReadHeaders');
    expect(listRoute).not.toContain("searchParams.get('id')");
    expect(listRoute).not.toContain('getTemplateDetail');
    expect(detailRoute).toContain('getTemplateDetail');
    expect(listRoute).not.toContain('no-store');
    expect(detailRoute).not.toContain('no-store');
    expect(publicClient).toContain('PublicTemplateListItem');
    expect(publicClient).toContain('PublicTemplateDetailItem');
  });

  it('streams template media through the app route with range support', () => {
    const mediaRoute = readSource('app/api/template-media/[assetId]/route.ts');

    expect(mediaRoute).toContain('getTemplateMediaCacheEntry');
    expect(mediaRoute).toContain('createCachedTemplateMediaResponse');
    expect(mediaRoute).toContain('getObjectFromR2');
    expect(mediaRoute).toContain("request.headers.get('range')");
    expect(mediaRoute).toContain("'Accept-Ranges'");
    expect(mediaRoute).toContain('Content-Range');
    expect(mediaRoute).not.toContain('NextResponse.redirect');
    expect(mediaRoute).not.toContain('createSignedGetUrl');
    expect(mediaRoute).not.toContain('refreshTemplateMediaCache');
    expect(mediaRoute).not.toContain('deleteTemplateMediaCacheEntries');
  });

  it('preloads template media memory cache on startup and updates it through admin template writes', () => {
    const instrumentation = readSource('instrumentation.ts');
    const mediaCache = readSource('lib/templates/media-cache.ts');
    const adminTemplates = readSource('lib/admin/services/templates.ts');
    const publicTemplateList = readSource('app/api/templates/route.ts');
    const publicTemplateDetail = readFirstExistingSource([
      'app/api/templates/[id]/route.ts',
    ]);

    expect(instrumentation).toContain('startTemplateMediaCachePreload');
    expect(mediaCache).toContain('getTemplateMediaCacheEntry');
    expect(mediaCache).toContain('getAllTemplateMediaAssetIds');
    expect(mediaCache).toContain('refreshTemplateMediaCache');
    expect(mediaCache).toContain('preloadPromise');
    expect(mediaCache).toContain('deleteTemplateMediaCacheEntries');
    expect(adminTemplates).toContain('refreshTemplateMediaCacheAfterAdminWrite');
    expect(adminTemplates).toContain(
      'refreshSingleTemplateMediaCacheAfterAdminWrite'
    );
    expect(adminTemplates).toContain('deleteTemplateMediaCacheEntries');
    expect(publicTemplateList).not.toContain('refreshTemplateMediaCache');
    expect(publicTemplateDetail).not.toContain('refreshTemplateMediaCache');
  });

  it('passes real template ids through image-to-video generation requests', () => {
    const source = readSource('components/create/image-video-workbench.tsx');

    expect(source).toContain('selectedTemplateId');
    expect(source).toContain('templateId: selectedTemplateId');
    expect(source).toContain('setSelectedTemplate');
  });

  it('does not auto-bind the first template when a workbench has no requested template', () => {
    const apparel = readSource('components/create/apparel-workbench.tsx');
    const tryOn = readSource('components/create/try-on-workbench.tsx');

    expect(apparel).not.toContain(
      'current ?? requestedTemplate ?? nextTemplates[0] ?? null'
    );
    expect(tryOn).not.toContain(
      'current ?? requestedTemplate ?? nextTemplates[0] ?? nextAssets[0] ?? null'
    );
  });
});
