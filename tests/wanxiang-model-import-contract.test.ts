import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('wanxiang model import contract', () => {
  it('wires Wanxiang models directly into R2-backed templates', () => {
    const schema = readSource('lib/db/schema.ts');
    const migration = readSource('lib/db/migrations/0027_template_model_type.sql');
    const catalog = readSource('lib/templates/catalog.ts');
    const categoryConfig = readSource('lib/templates/category-config.ts');
    const publicClient = readSource('lib/templates/public-client.ts');
    const importer = readSource('scripts/import-wanxiang-models.ts');
    const generationJobs = readSource('lib/generations/jobs.ts');
    const adminTemplates = readSource('components/admin/templates-panel.tsx');
    const adminTemplateService = readSource('lib/admin/services/templates.ts');

    expect(schema).toContain("'model'");
    expect(migration).toContain("'model'");
    expect(catalog).toContain("'model'");
    expect(categoryConfig).toContain('modelTemplateCategories = []');
    expect(publicClient).toContain("'model'");
    expect(importer).toContain("const TEMPLATE_TYPE = 'model'");
    expect(importer).toContain('where storage_key in ${tx(assetKeys)}');
    expect(importer).toContain('assetIdByStorageKey');
    expect(importer).toContain('buildTemplateMediaUrl(thumbnailAssetId)');
    expect(importer).toContain('buildTemplateMediaUrl(detailAssetId)');
    expect(importer).toContain('where type = ${TEMPLATE_TYPE}');
    expect(importer).toContain('category = ${item.category}');
    expect(importer).toContain('prompt = ${item.prompt}');
    expect(importer).toContain('${TEMPLATE_TYPE},');
    expect(importer).toContain('${item.category},');
    expect(importer).toContain('${item.prompt},');
    expect(importer).toContain('buildModelTemplateLocalization');
    expect(importer).toContain('stripModelAgePrefix(name)');
    expect(importer).toContain('sourceTitle: name');
    expect(importer).toContain(
      'title_translations_json = ${JSON.stringify(item.titleTranslations)}::jsonb'
    );
    expect(importer).toContain(
      'prompt_translations_json = ${JSON.stringify(item.promptTranslations)}::jsonb'
    );
    expect(importer).toContain('function buildModelCategory');
    expect(importer).toContain('and title in ${tx(titles)}');
    expect(importer).toContain('or title = ${item.sourceTitle}');
    expect(importer).toContain('or thumbnail_asset_id = ${thumbnailAssetId}');
    expect(importer).toContain('or preview_asset_id = ${detailAssetId}');
    expect(importer).toContain('title = ${item.title}');
    expect(importer).not.toContain('insert into model_catalog_assets');
    expect(importer).not.toContain('provider_payload_json');
    expect(importer).not.toContain("model.isNew ? 'new' : ''");
    expect(generationJobs).toContain('createSignedGetUrl');
    expect(generationJobs).toContain('getModelTemplate');
    expect(generationJobs).toContain('imageStorageKey');
    expect(adminTemplates).toContain('normalizeFormCategoryForSubmit');
    expect(adminTemplates).toContain("type === 'model' ? trimmed : trimmed.toLowerCase()");
    expect(adminTemplates).toContain("type: 'model'");
    expect(adminTemplateService).toContain('Template category is invalid for this type');
  });

  it('loads the expanded official model templates in the try-on workbench', () => {
    const imageVideo = readSource('components/create/image-video-workbench.tsx');
    const tryOn = readSource('components/create/try-on-workbench.tsx');
    const copy = readSource('components/create/workbench-copy.ts');
    const modelTemplates = readSource('lib/model-assets/catalog.ts');
    const modelAssetsRoute = readSource('app/api/model-assets/route.ts');

    expect(copy).toContain("chooseModel: '模特库'");
    expect(copy).toContain("modelAgeFilter: '年龄'");
    expect(copy).toContain("middle: '中年'");
    expect(copy).toContain("senior: '老年'");
    expect(copy).toContain("modelGenderFilter: '性别'");
    expect(copy).toContain("modelGenderOptions: { all: '全部', female: '女', male: '男' }");
    expect(copy).toContain("modelStyleFilter: '风格'");
    expect(copy).toContain("modelDisplayImage: '展示图'");
    expect(copy).toContain("modelStyleIntro: '个人风格介绍'");
    expect(copy).toContain("useThisModel: '使用这个模特'");
    expect(copy).not.toContain('officialModel');
    expect(tryOn).toContain(
      "type ModelAgeFilter = 'all' | 'child' | 'youth' | 'middle' | 'senior'"
    );
    expect(tryOn).toContain("type ModelGenderFilter = 'all' | 'female' | 'male'");
    expect(tryOn).toContain('const modelAgeTags');
    expect(tryOn).toContain('const modelGenderTags');
    expect(tryOn).toContain('modelHasTag(model, modelAgeTags[modelAgeFilter])');
    expect(tryOn).toContain('modelHasTag(model, modelGenderTags[modelGenderFilter])');
    expect(tryOn).toContain("modelStyleFilter === 'all' ? null : modelStyleFilter");
    expect(tryOn).toContain('localizeModelCategoryTag(style, locale)');
    expect(tryOn).toContain('filteredModelAssets.some((model) => model.id === current.id)');
    expect(imageVideo).toContain(
      "return item.imageUrl ?? item.thumbnailUrl ?? item.videoUrl ?? '';"
    );
    expect(tryOn).toContain(
      "return item.imageUrl ?? item.thumbnailUrl ?? item.videoUrl ?? '';"
    );
    expect(tryOn).toContain('const MODEL_ASSET_LIMIT = 96');
    expect(tryOn).toContain('limit: String(MODEL_ASSET_LIMIT)');
    expect(tryOn).toContain('modelDetailAsset');
    expect(tryOn).toContain('getModelDetailImage');
    expect(tryOn).toContain('getModelDescriptionLines');
    expect(tryOn).toContain('displayTags');
    expect(tryOn).toContain("normalized !== 'new'");
    expect(tryOn).toContain('filteredModelAssets.map((model)');
    expect(tryOn).toContain('max-h-96 grid-cols-4');
    expect(tryOn).toContain('copy.modelDisplayImage');
    expect(tryOn).toContain('copy.modelStyleIntro');
    expect(tryOn.indexOf('title={copy.templateMaterials}')).toBeLessThan(
      tryOn.indexOf('title={copy.chooseModel}')
    );
    expect(tryOn).toContain('modelTemplateId: selectedModelAsset.id');
    expect(modelTemplates).toContain("from templates t");
    expect(modelTemplates).toContain("where t.type = 'model'");
    expect(modelTemplates).toContain('const title = toStringValue(row.title).trim();');
    expect(modelTemplates).not.toContain('resolveModelTitle');
    expect(modelTemplates).toContain('resolveModelPrompt');
    expect(modelTemplates).toContain('localizeModelCategoryTags');
    expect(modelTemplates).toContain('Math.min(Math.max(input.limit ?? 24, 1), 96)');
    expect(modelAssetsRoute).toContain('modelAssetsReadHeaders');
    expect(modelAssetsRoute).not.toContain('publicCatalogReadHeaders');
    expect(imageVideo).toContain("cache: 'no-store'");
    expect(tryOn).toContain("cache: 'no-store'");
    expect(tryOn).not.toContain('modelAssets.slice(0, 8)');
    expect(tryOn).not.toContain('copy.officialModel');
    expect(tryOn).not.toContain('copy.viewModelDetails');
    expect(tryOn).not.toContain('<Eye');
  });
});
