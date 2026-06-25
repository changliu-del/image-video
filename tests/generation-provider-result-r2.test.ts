import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('generation provider result persistence', () => {
  const source = readSource('lib/generations/jobs.ts');

  it('downloads provider terminal output and uploads it to R2 before success persistence', () => {
    const successIndex = source.indexOf('async function markJobSucceeded');
    const uploadIndex = source.indexOf(
      'const uploadedOutput = await copyProviderResultToR2(input);',
      successIndex
    );
    const transactionIndex = source.indexOf(
      'const transitioned = await client.begin',
      successIndex
    );

    expect(source).toContain("from '@/lib/storage/r2'");
    expect(source).toContain('buildPublicUrl(storageKey)');
    expect(source).toContain('uploadObjectToR2({');
    expect(uploadIndex).toBeGreaterThan(successIndex);
    expect(uploadIndex).toBeLessThan(transactionIndex);
  });

  it('stores final assets with R2 URL, MIME, size, and deterministic storage key', () => {
    expect(source).toContain('function buildProviderResultStorageKey');
    expect(source).toContain('users/${input.userId}/generated/${input.jobId}');
    expect(source).toContain('on conflict (storage_key) do update');
    expect(source).toContain('mime_type = excluded.mime_type');
    expect(source).toContain('size_bytes = excluded.size_bytes');
    expect(source).toContain('finalVideoUrl:');
    expect(source).toContain('buildAssetMediaUrl(input.outputAssetId)');
    expect(source).not.toContain('publicUrl: input.queryResult.videoUrl');
    expect(source).not.toContain('publicUrl: input.queryResult.imageUrl');
  });

  it('keeps provider download and upload failures retryable until max attempts', () => {
    const workerIndex = source.indexOf('export async function runWanxiangGenerationJob');
    const catchIndex = source.indexOf('  } catch (error) {', workerIndex);
    const failIndex = source.indexOf('if (attemptNumber >= maxAttempts)', catchIndex);
    const retryIndex = source.indexOf('await markJobWorkerErrorForRetry', failIndex);

    expect(source).toContain('provider_result_download_failed');
    expect(source).toContain('provider_result_upload_failed');
    expect(failIndex).toBeGreaterThan(catchIndex);
    expect(retryIndex).toBeGreaterThan(failIndex);
  });

  it('surfaces terminal provider failures to the Trigger run', () => {
    const triggerSource = readSource('trigger/generate-wanxiang.ts');
    const workerIndex = source.indexOf('export async function runWanxiangGenerationJob');
    const providerFailureIndex = source.indexOf(
      "const errorMessage = queryResult.errorMessage ?? 'Generation failed'",
      workerIndex
    );

    expect(providerFailureIndex).toBeGreaterThan(workerIndex);
    expect(source).toContain(
      'errorMessage: updatedJob?.errorMessage ?? errorMessage'
    );
    expect(source).toContain('errorMessage: job.errorMessage');
    expect(triggerSource).toContain("if (result.status === 'failed')");
    expect(triggerSource).toContain('throw new Error(message)');
  });
});
