import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normalizeTemplateCategoryForType } from '../lib/templates/category-config';

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

  it('uses category as a business filter and keeps order internal', () => {
    const route = readSource('app/api/templates/route.ts');
    const query = readSource('lib/templates/query.ts');
    const publicClient = readSource('lib/templates/public-client.ts');
    const templatesPage = readFirstExistingSource([
      'components/marketing/templates-page.tsx',
      'app/[locale]/templates/page.tsx',
    ]);
    const categoryConfig = readSource('lib/templates/category-config.ts');

    expect(route).toContain("searchParams.get('category')");
    expect(query).toContain('getCachedPublishedTemplateMetadataForType');
    expect(query).toContain('for (const row of metadata.rows)');
    expect(query).toContain('rowCategory !== category');
    expect(query).toContain('filteredRows.length');
    expect(query).toContain('categories: string[]');
    expect(query).toContain('categoriesFromTemplateRows');
    expect(publicClient).toContain('normalizePublicTemplateCategories');
    expect(templatesPage).toContain('normalizePublicTemplateCategories');
    expect(templatesPage).not.toContain('label={content.allCategories}');
    expect(templatesPage).not.toContain("setActiveCategory('')");
    expect(categoryConfig).toContain('?? category;');
    expect(route).not.toContain("getAll('tag')");
    expect(route).not.toContain("get('tags')");
    expect(route).not.toContain("get('sort')");
    expect(query).not.toContain('tagsJson');
    expect(query).not.toContain('sortWeight');
    expect(query).toContain('sortOrder');
    expect(query).not.toContain('count(*)::int');
  });

  it('preserves model template categories while keeping other categories normalized', () => {
    expect(normalizeTemplateCategoryForType('model', '男/青年/冷酷')).toBe(
      '男/青年/冷酷'
    );
    expect(normalizeTemplateCategoryForType('image_to_video', 'General')).toBe(
      'common'
    );
    expect(normalizeTemplateCategoryForType('image_to_video', '男/青年/冷酷')).toBeNull();
  });

  it('aligns public and image-to-video template categories', () => {
    const categoryConfig = readSource('lib/templates/category-config.ts');
    const catalog = readSource('lib/templates/catalog.ts');
    const query = readSource('lib/templates/query.ts');
    const importScript = readSource('scripts/import-template-catalog.ts');
    const adminTemplates = readSource('components/admin/templates-panel.tsx');
    const templatesPage = readFirstExistingSource([
      'components/marketing/templates-page.tsx',
      'app/[locale]/templates/page.tsx',
    ]);
    const workbench = readSource('components/create/image-video-workbench.tsx');

    const beautyIndex = categoryConfig.indexOf("'beauty'");
    const commonIndex = categoryConfig.indexOf("'common'");

    expect(beautyIndex).toBeGreaterThanOrEqual(0);
    expect(commonIndex).toBeGreaterThan(beautyIndex);
    expect(categoryConfig).not.toContain("'general',");
    expect(categoryConfig).toContain("general: 'common'");
    expect(catalog).toContain("common: { pt: 'Geral', en: 'Common', zh: '通用' }");
    expect(importScript).toContain("'通用': 'common'");
    expect(adminTemplates).toContain("category: 'common'");
    expect(query).toContain('return [...preferredCategories];');
    expect(query).toContain('normalizeTemplateCategoryForType(row.type, row.category)');
    expect(templatesPage).toContain('imageToVideoTemplateCategories');
    expect(workbench).toContain('imageToVideoTemplateCategories');
  });

  it('keeps the public template page free of search and technical identifiers', () => {
    const templatesPage = readFirstExistingSource([
      'components/marketing/templates-page.tsx',
      'app/[locale]/templates/page.tsx',
    ]);
    const publicContent = readSource('lib/templates/public-content.ts');

    expect(templatesPage).not.toContain('Search,');
    expect(templatesPage).not.toContain('setSearch');
    expect(templatesPage).not.toContain("params.set('search'");
    expect(templatesPage).not.toContain('content.searchPlaceholder');
    expect(templatesPage).not.toContain('content.idLabel');
    expect(templatesPage).not.toContain('{template.type}');
    expect(templatesPage).not.toContain('{detail.type}');
    expect(templatesPage).not.toContain('content.defaultCategory');
    expect(templatesPage).not.toContain('font-mono');
    expect(publicContent).not.toContain('searchPlaceholder');
    expect(publicContent).not.toContain('idLabel');
    expect(publicContent).not.toContain('defaultCategory');
  });

  it('clears stale template cards when a category reload starts', () => {
    const templatesPage = readFirstExistingSource([
      'components/marketing/templates-page.tsx',
      'app/[locale]/templates/page.tsx',
    ]);

    expect(templatesPage).toContain('if (page === 1) {');
    expect(templatesPage).toContain('setTemplates([]);');
    expect(templatesPage).toContain('setHasMore(false);');
  });

  it('keeps public template list and detail data cacheable but split', () => {
    const listRoute = readSource('app/api/templates/route.ts');
    const detailRoute = readFirstExistingSource([
      'app/api/templates/[id]/route.ts',
    ]);
    const cacheControl = readSource('lib/http/cache-control.ts');
    const publicClient = readSource('lib/templates/public-client.ts');
    const templatesPage = readFirstExistingSource([
      'components/marketing/templates-page.tsx',
      'app/[locale]/templates/page.tsx',
    ]);
    const query = readSource('lib/templates/query.ts');

    expect(cacheControl).toContain('TEMPLATE_CATALOG_LIST_CACHE_CONTROL');
    expect(cacheControl).toContain('max-age=30');
    expect(cacheControl).toContain('TEMPLATE_CATALOG_DETAIL_CACHE_CONTROL');
    expect(cacheControl).toContain('TEMPLATE_CATALOG_LIST_CACHE_CONTROL;');
    expect(cacheControl).not.toContain('s-maxage=86400');
    expect(cacheControl).not.toContain('stale-while-revalidate=604800');
    expect(listRoute).toContain('templateCatalogListReadHeaders');
    expect(detailRoute).toContain('templateCatalogReadHeaders');
    expect(listRoute).not.toContain("searchParams.get('id')");
    expect(listRoute).not.toContain('getTemplateDetail');
    expect(detailRoute).toContain('getTemplateDetail');
    expect(listRoute).not.toContain('no-store');
    expect(detailRoute).not.toContain('no-store');
    expect(publicClient).toContain('PublicTemplateListItem');
    expect(publicClient).toContain('PublicTemplateDetailItem');
    expect(query).toContain('unstable_cache');
    expect(query).toContain('templateCatalogDataCacheTag');
    expect(query).toContain('loadPublishedTemplateRowsForTypeFromNextCache');
    expect(query).toContain('revalidateTag(templateCatalogDataCacheTag, { expire: 0 })');
    expect(query).toContain('deserializeTemplateDetailRow');
    expect(query).toContain('previewUrl: row.previewUrl');
    expect(query).toContain('clearPublishedTemplateCatalogCache');
    expect(templatesPage).toContain("media: 'preview'");
    expect(templatesPage).toContain('src={template.previewUrl}');
    expect(templatesPage).not.toContain('template-preview-load-failed');
  });

  it('keeps template ordering as an Admin-only type/category operation', () => {
    const adminOrderRoute = readSource(
      'app/api/admin/templates/order/route.ts'
    );
    const adminTemplates = readSource('lib/admin/services/templates.ts');
    const adminPanel = readSource('components/admin/templates-panel.tsx');
    const publicRoute = readSource('app/api/templates/route.ts');
    const publicClient = readSource('lib/templates/public-client.ts');

    expect(adminOrderRoute).toContain('listAdminTemplateOrder');
    expect(adminOrderRoute).toContain('updateAdminTemplateOrder');
    expect(adminTemplates).toContain('templateOrderPayloadSchema');
    expect(adminTemplates).toContain('templateIds must include every template');
    expect(adminTemplates).toContain('clearPublishedTemplateCatalogCache');
    expect(adminPanel).toContain('/api/admin/templates/order');
    expect(adminPanel).toContain('moveOrderedTemplate');
    expect(publicRoute).not.toContain("searchParams.get('sort')");
    expect(publicClient).not.toContain('sortOrder');
  });

  it('routes Admin template sub-tabs through the template type field', () => {
    const adminShell = readSource(
      'app/(dashboard)/admin/components/admin-shell.tsx'
    );
    const adminPanel = readSource('components/admin/templates-panel.tsx');
    const adminRoute = readSource('app/api/admin/templates/route.ts');
    const adminTemplates = readSource('lib/admin/services/templates.ts');
    const adminTemplateTypes = readSource('lib/admin/template-types.ts');

    expect(adminTemplateTypes).toContain('adminTemplateTypes = [');
    expect(adminTemplateTypes).toContain("'image_to_video'");
    expect(adminTemplateTypes).toContain("'model'");
    expect(adminTemplateTypes).toContain("'image_to_image'");
    expect(adminTemplateTypes).toContain("'try_on'");
    expect(adminShell).toContain('AdminTemplatesDropdown');
    expect(adminShell).toContain("searchParams.get('type')");
    expect(adminShell).toContain('selectTemplateType');
    expect(adminShell).toContain('`/admin?tab=templates&type=${type}`');
    expect(adminPanel).toContain("type: activeType");
    expect(adminPanel).not.toContain('onTypeChange');
    expect(adminPanel).not.toContain('updateFormType');
    expect(adminPanel).not.toContain('updateOrderTypeFromSelect');
    expect(adminRoute).toContain(
      "normalizeTemplateType(searchParams.get('type'))"
    );
    expect(adminTemplates).toContain('eq(templates.type, type)');
  });

  it('supports field-specific Admin template filters inside each type tab', () => {
    const adminPanel = readSource('components/admin/templates-panel.tsx');
    const adminRoute = readSource('app/api/admin/templates/route.ts');
    const adminTemplates = readSource('lib/admin/services/templates.ts');

    expect(adminPanel).toContain('TemplateFilterState');
    expect(adminPanel).toContain("params.set('id', appliedFilters.id)");
    expect(adminPanel).toContain("params.set('title', appliedFilters.title)");
    expect(adminPanel).toContain(
      "params.set('category', appliedFilters.category)"
    );
    expect(adminPanel).toContain("params.set('gender', appliedFilters.gender)");
    expect(adminPanel).toContain("params.set('age', appliedFilters.age)");
    expect(adminPanel).toContain("params.set('style', appliedFilters.style)");
    expect(adminPanel).toContain('updateModelCategoryPart');
    expect(adminPanel).toContain('categoryFilterOptions');
    expect(adminPanel).toContain('copy.allCategories');
    expect(adminRoute).toContain("optionalSearchParam(searchParams, 'id')");
    expect(adminRoute).toContain("optionalSearchParam(searchParams, 'title')");
    expect(adminRoute).toContain(
      "optionalSearchParam(searchParams, 'category')"
    );
    expect(adminRoute).toContain("optionalSearchParam(searchParams, 'gender')");
    expect(adminRoute).toContain("optionalSearchParam(searchParams, 'age')");
    expect(adminRoute).toContain("optionalSearchParam(searchParams, 'style')");
    expect(adminRoute).toContain('return value ? value : undefined');
    expect(adminTemplates).toContain(
      'idQuery ? ilikeCol(templates.id, idQuery)'
    );
    expect(adminTemplates).toContain('ilikeCol(templates.title, titleQuery)');
    expect(adminTemplates).toContain('eq(templates.category, category)');
    expect(adminTemplates).toContain('modelCategorySegmentCondition');
    expect(adminTemplates).toContain('listAdminTemplateCategories(type)');
  });

  it('streams template media through the app route with range support', () => {
    const mediaRoute = readSource('app/api/template-media/[assetId]/route.ts');

    expect(mediaRoute).toContain('getTemplateMediaCacheEntry');
    expect(mediaRoute).toContain('createCachedTemplateMediaResponse');
    expect(mediaRoute).toContain('buildPublicUrl(asset.storageKey)');
    expect(mediaRoute).toContain("asset.storageKey.startsWith('external/')");
    expect(mediaRoute).toContain('new URL(input.sourceUrl, input.baseUrl)');
    expect(mediaRoute).toContain('proxyTemplateMediaSource({');
    expect(mediaRoute).toContain("request.headers.get('range')");
    expect(mediaRoute).toContain("'Accept-Ranges'");
    expect(mediaRoute).toContain('Content-Range');
    expect(mediaRoute).not.toContain('getObjectFromR2');
    expect(mediaRoute).not.toContain('falling back to public URL');
    expect(mediaRoute).not.toContain('NextResponse.redirect');
    expect(mediaRoute).not.toContain('createSignedGetUrl');
    expect(mediaRoute).not.toContain('refreshTemplateMediaCache');
    expect(mediaRoute).not.toContain('deleteTemplateMediaCacheEntries');
  });

  it('keeps bundled starter resources outside the R2 template namespace', () => {
    const seed = readSource('lib/db/seed.ts');
    const migration = readSource(
      'lib/db/migrations/0030_normalize_starter_template_assets.sql'
    );

    expect(seed).toContain('external/starter/${template.seedKey}/thumbnail');
    expect(seed).toContain('external/starter/${template.seedKey}/preview');
    expect(seed).not.toContain('templates/starter/${template.seedKey}/thumbnail');
    expect(seed).not.toContain('templates/starter/${template.seedKey}/preview');
    expect(migration).toContain("old_asset.\"storage_key\" LIKE 'templates/starter/%'");
    expect(migration).toContain("old_asset.\"public_url\" LIKE '/resources/%'");
    expect(migration).toContain("'external/starter/'");
    expect(migration).toContain("'archived/starter/'");
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
    expect(mediaCache).toContain('buildPublicUrl(asset.storageKey)');
    expect(mediaCache).not.toContain('getObjectFromR2');
    expect(mediaCache).toContain('deleteTemplateMediaCacheEntries');
    expect(adminTemplates).toContain('refreshTemplateMediaCacheAfterAdminWrite');
    expect(adminTemplates).toContain('clearPublishedTemplateCatalogCache');
    expect(adminTemplates).toContain(
      'refreshSingleTemplateMediaCacheAfterAdminWrite'
    );
    expect(adminTemplates).toContain('deleteTemplateMediaCacheEntries');
    expect(publicTemplateList).not.toContain('refreshTemplateMediaCache');
    expect(publicTemplateDetail).not.toContain('refreshTemplateMediaCache');
  });

  it('keeps direct template import scripts aligned with template media snapshots', () => {
    const importScripts = [
      readSource('scripts/import-template-catalog.ts'),
      readSource('scripts/import-wanxiang-templates.ts'),
      readSource('scripts/import-wanxiang-models.ts'),
    ];
    const snapshotColumns = [
      'thumbnail_url',
      'preview_url',
      'thumbnail_mime_type',
      'preview_mime_type',
    ];

    for (const source of importScripts) {
      expect(source).toContain('buildTemplateMediaUrl');
      expect(source).toContain('where storage_key in ${tx(assetKeys)}');
      for (const column of snapshotColumns) {
        expect(source).toContain(`'${column}'`);
      }
      expect(source).toContain('thumbnail_url = ${buildTemplateMediaUrl(');
      expect(source).toContain('preview_url = ${buildTemplateMediaUrl(');
      expect(source).toContain('thumbnail_mime_type = ${');
      expect(source).toContain('preview_mime_type = ${');
      expect(source).not.toContain('Legacy templates columns still present');
    }
  });

  it('passes real template ids through image-to-video generation requests', () => {
    const source = readSource('components/create/image-video-workbench.tsx');

    expect(source).toContain('selectedTemplateId');
    expect(source).toContain('templateId: selectedTemplateId');
    expect(source).toContain('setSelectedTemplate');
  });

  it('opens image-to-video workbench template details before applying a template', () => {
    const source = readSource('components/create/image-video-workbench.tsx');

    expect(source).toContain('TemplateDetailModal');
    expect(source).toContain('openTemplateDetail(template)');
    expect(source).toContain('applyTemplateDetail');
    expect(source).toContain('setPrompt(templateDetail.prompt)');
    expect(source).toContain('copy.previewTemplate');
    expect(source).toContain('pointer-events-none absolute');
    expect(source).toContain('opacity-0 shadow-sm');
    expect(source).toContain('group-hover:opacity-100');
    expect(source).not.toContain('absolute inset-x-1 bottom-1');
  });

  it('keeps image-to-video fixed to the current provider capability', () => {
    const source = readSource('components/create/image-video-workbench.tsx');

    expect(source).not.toContain('IMAGE_TO_VIDEO_DURATION_SECONDS');
    expect(source).not.toContain('durationSeconds:');
    expect(source).not.toContain('getCreditCostForDuration');
    expect(source).not.toContain("type SpecsSection = 'aspect' | 'duration' | 'quality'");
    expect(source).not.toContain("onClick={() => openSpecsSection('duration')}");
    expect(source).not.toContain("onClick={() => openSpecsSection('quality')}");
    expect(source).not.toContain('referenceVideoAssetIds');
    expect(source).not.toContain('referenceAudioAssetIds');
    expect(source).not.toContain('flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-100');
  });

  it('keeps image reference upload single-select in the image-to-video workbench', () => {
    const source = readSource('components/create/image-video-workbench.tsx');
    const copy = readSource('components/create/workbench-copy.ts');

    expect(source).toContain('const MAX_REFERENCE_IMAGE_FILE_COUNT = 1');
    expect(source).not.toContain('multiple={');
    expect(source).not.toContain("kind === 'image'");
    expect(source).not.toContain('uploadReferenceVideo');
    expect(source).not.toContain('uploadReferenceMusic');
    expect(source).toContain('setError(copy.referenceImageLimit)');
    expect(copy).toContain('referenceImageLimit');
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
