import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('user media history schema', () => {
  it('keeps private user media as history over owned assets and generation jobs', () => {
    const schema = readSource('lib/db/schema.ts');
    const migration = readSource(
      'lib/db/migrations/0029_rekey_primary_ids_to_sequences.sql'
    );

    expect(schema).toContain("export const userMediaHistory = pgTable");
    expect(schema).toContain("assetId: integer('asset_id')");
    expect(schema).not.toContain("libraryAssetId: integer('library_asset_id')");
    expect(schema).toContain("generationJobId: integer('generation_job_id')");
    expect(migration).toContain('REFERENCES "assets"("id")');
    expect(migration).not.toContain('references library_assets(id)');
    expect(migration).toContain(
      'REFERENCES "generation_jobs"("id") ON DELETE SET NULL'
    );
    expect(migration).toContain(
      "\"source\" in ('user_upload', 'generated_image', 'generated_video')"
    );
    expect(migration).not.toContain('ops_library_used');
    expect(migration).toContain(
      "\"role\" in ('input', 'output', 'reference', 'garment', 'model')"
    );
    expect(migration).toContain(
      "\"visibility\" in ('active', 'hidden', 'deleted')"
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
    expect(service).toContain('asset.userId !== payload.userId');
    expect(service).toContain('buildAssetMediaUrl(asset.id)');
    expect(service).not.toContain('assetUrl: asset.publicUrl');
    expect(service).not.toContain('matchingLibraryAsset');
  });

  it('serves user asset bytes through the app media route instead of raw R2 public URLs', () => {
    const mediaUrl = readSource('lib/assets/media-url.ts');
    const mediaRoute = readSource('app/api/asset-media/[assetId]/route.ts');
    const completeRoute = readSource('app/api/assets/complete/route.ts');

    expect(mediaUrl).toContain('buildAssetMediaUrl');
    expect(mediaUrl).toContain('/api/asset-media/');
    expect(mediaRoute).toContain("storageKey.startsWith('users/')");
    expect(mediaRoute).toContain('getObjectFromR2({');
    expect(mediaRoute).toContain("'Accept-Ranges': 'bytes'");
    expect(mediaRoute).not.toContain('createSignedGetUrl');
    expect(mediaRoute).not.toContain('proxyExternal');
    expect(completeRoute).toContain('publicUrl: buildAssetMediaUrl(updatedAsset.id)');
  });

  it('keeps deleted history hidden on later upserts and sorts null usage after recency', () => {
    const service = readSource('lib/user-media/service.ts');

    expect(service).toContain("existing.visibility === 'deleted'");
    expect(service).toContain('coalesce(${userMediaHistory.lastUsedAt}');
    expect(service).toContain('desc(userMediaRecency)');
  });
});
