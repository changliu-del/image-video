import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function functionBody(source: string, name: string) {
  const start = source.indexOf(`function ${name}`);
  expect(start, `${name} should exist`).toBeGreaterThanOrEqual(0);

  const signatureEnd = source.indexOf(')', start);
  expect(signatureEnd, `${name} should have a signature`).toBeGreaterThanOrEqual(0);

  const braceStart = source.indexOf('{', signatureEnd);
  expect(braceStart, `${name} should have a body`).toBeGreaterThanOrEqual(0);

  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) return source.slice(braceStart, index + 1);
  }

  throw new Error(`Could not parse ${name} body`);
}

describe('provider output storage contract', () => {
  it('does not persist Wanxiang result URLs directly as final assets', () => {
    const jobs = readSource('lib/generations/jobs.ts');
    const markJobSucceeded = functionBody(jobs, 'markJobSucceeded');

    expect(markJobSucceeded).not.toContain(
      'publicUrl: input.queryResult.videoUrl'
    );
    expect(markJobSucceeded).not.toContain(
      'publicUrl: input.queryResult.imageUrl'
    );
    expect(markJobSucceeded).toMatch(
      /uploadObjectToR2|copyProviderResult|copyProviderOutput|downloadProviderOutput/
    );
  });

  it('keeps status APIs and frontend display anchored to the output asset URL', () => {
    const jobs = readSource('lib/generations/jobs.ts');
    const generationStatusRoute = readSource(
      'app/api/generations/[id]/status/route.ts'
    );
    const legacyStatusRoute = readSource('app/api/jobs/[id]/route.ts');
    const workbench = readSource('components/create/image-video-workbench.tsx');
    const mapJobStatus = functionBody(jobs, 'mapJobStatus');

    expect(mapJobStatus).toContain('output_asset.id as output_asset_id');
    expect(mapJobStatus).toContain('buildAssetMediaUrl(outputAssetId)');
    expect(mapJobStatus).not.toContain('job.outputJson.finalVideoUrl');
    expect(mapJobStatus).not.toContain('job.outputJson.finalImageUrl');

    expect(generationStatusRoute).toContain('getGenerationJobForUser');
    expect(generationStatusRoute).not.toContain('outputJson');
    expect(legacyStatusRoute).toContain('finalVideoUrl: job.finalVideoUrl');
    expect(legacyStatusRoute).toContain('finalImageUrl: job.finalImageUrl');
    expect(workbench).toContain('/api/generations/${jobId}/status');
    expect(workbench.indexOf('/api/generations/${jobId}/status')).toBeLessThan(
      workbench.indexOf('/api/jobs/${jobId}')
    );
  });

  it('keeps user media history and admin previews sourced from owned assets', () => {
    const userMedia = readSource('lib/user-media/service.ts');
    const adminUserMedia = readSource('lib/admin/services/user-media.ts');
    const adminJobs = readSource('lib/admin/services/jobs.ts');

    expect(userMedia).toContain('const mediaUrl = buildAssetMediaUrl(asset.id)');
    expect(userMedia).toContain('assetUrl: mediaUrl');
    expect(userMedia).toContain('videoUrl: video ? mediaUrl : null');
    expect(userMedia).toContain('publicUrl: mediaUrl');
    expect(userMedia).not.toContain('outputJson');
    expect(userMedia).not.toContain('providerTaskId');

    expect(adminUserMedia).toContain('buildAssetMediaUrl(asset.id)');
    expect(adminJobs).toContain('outputAsset');
    expect(adminJobs).toContain('finalPreviewUrl: finalPreview.url');
  });
});
