import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('user media history schema', () => {
  it('keeps private user media as history over assets and official library assets', () => {
    const schema = readSource('lib/db/schema.ts');
    const migration = readSource(
      'lib/db/migrations/0017_user_media_history.sql'
    );

    expect(schema).toContain("export const userMediaHistory = pgTable");
    expect(schema).toContain("assetId: uuid('asset_id')");
    expect(schema).toContain("libraryAssetId: uuid('library_asset_id')");
    expect(schema).toContain("generationJobId: uuid('generation_job_id')");
    expect(migration).toContain('references assets(id)');
    expect(migration).toContain('references library_assets(id) on delete set null');
    expect(migration).toContain('references generation_jobs(id) on delete set null');
    expect(migration).toContain(
      "source in ('user_upload', 'generated_image', 'generated_video', 'ops_library_used')"
    );
    expect(migration).toContain(
      "role in ('input', 'output', 'reference', 'garment', 'model')"
    );
    expect(migration).toContain(
      "visibility in ('active', 'hidden', 'deleted')"
    );
    expect(migration).toContain('user_media_history_user_visibility_updated_idx');
  });
});

describe('user media private API', () => {
  it('uses current-user auth and no public catalog cache headers', () => {
    const listRoute = readSource('app/api/user-media/route.ts');
    const itemRoute = readSource('app/api/user-media/[id]/route.ts');

    expect(listRoute).toContain('getUser()');
    expect(itemRoute).toContain('getUser()');
    expect(listRoute).toContain("'Cache-Control': 'no-store'");
    expect(itemRoute).toContain("'Cache-Control': 'no-store'");
    expect(listRoute).not.toContain('publicCatalogReadHeaders');
    expect(itemRoute).not.toContain('publicCatalogReadHeaders');
    expect(itemRoute).toContain('softDeleteUserMediaHistory');
  });
});

describe('user media catalog contract', () => {
  it('returns workbench tile media fields and only lists uploaded visible assets', () => {
    const service = readSource('lib/user-media/service.ts');

    for (const field of [
      'assetUrl',
      'imageUrl',
      'videoUrl',
      'thumbnailUrl',
      'publicUrl',
      'mimeType',
      'isFavorite',
      'usedCount',
    ]) {
      expect(service).toContain(field);
    }

    expect(service).toContain("eq(assets.status, 'uploaded')");
    expect(service).toContain(
      'asset.userId !== payload.userId && !matchingLibraryAsset'
    );
  });

  it('keeps deleted history hidden on later upserts and sorts null usage after recency', () => {
    const service = readSource('lib/user-media/service.ts');

    expect(service).toContain("existing.visibility === 'deleted'");
    expect(service).toContain('coalesce(${userMediaHistory.lastUsedAt}');
    expect(service).toContain('desc(userMediaRecency)');
  });
});
