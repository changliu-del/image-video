import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function countOccurrences(source: string, pattern: string) {
  return source.split(pattern).length - 1;
}

describe('generation job accounting safety', () => {
  const source = readSource('lib/generations/jobs.ts');

  it('keeps terminal job transitions and credit ledger writes in one transaction', () => {
    expect(source).toContain('async function captureReservedCreditsInTransaction');
    expect(source).toContain('async function refundReservedCreditsInTransaction');
    expect(source).toContain('await captureReservedCreditsInTransaction');
    expect(source).toContain('await refundReservedCreditsInTransaction');
    expect(source).not.toContain("from '@/lib/credits'");
  });

  it('guards provider submit with a local lease and stable idempotency metadata', () => {
    expect(source).toContain('PROVIDER_SUBMIT_LEASE_SECONDS');
    expect(source).toContain('acquiredSubmitLease');
    expect(source).toContain("status = 'queued'");
    expect(source).toContain('next_provider_poll_at');
    expect(source).toContain('idempotencyKey: `generation:${job.id}`');
  });
});

describe('Admin backend safety rails', () => {
  it('does not allow generic Admin job updates to directly mutate status', () => {
    const source = readSource('lib/admin/services/jobs.ts');

    expect(source).toContain('Generation job status cannot be changed directly');
    expect(source).not.toContain('update.status = parsed.status');
  });

  it('verifies template asset objects in R2 before marking them uploaded', () => {
    const source = readSource('lib/admin/services/templates.ts');
    const verifyIndex = source.indexOf('verifyUploadedObject({');
    const updateIndex = source.indexOf('.update(assets)', verifyIndex);

    expect(verifyIndex).toBeGreaterThan(-1);
    expect(updateIndex).toBeGreaterThan(verifyIndex);
  });

  it('keeps dashboard activity estimates scoped to user behavior', () => {
    const source = readSource('lib/admin/services/dashboard.ts');

    expect(countOccurrences(source, "storage_key like 'users/%/uploads/%'"))
      .toBeGreaterThanOrEqual(6);
    expect(countOccurrences(source, "reason = 'purchase'"))
      .toBeGreaterThanOrEqual(2);
    expect(source).not.toContain('select user_id, created_at from credit_ledger');
    expect(source).not.toContain(
      "select date_trunc('day', created_at)::date as day, user_id from credit_ledger"
    );
    expect(source).toContain(
      'estimated from user uploads and generation jobs'
    );
  });
});
