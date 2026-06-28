import { existsSync, readFileSync } from 'node:fs';
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
    expect(source).toContain('updated_at <= now() -');
    expect(source).toContain('idempotencyKey: `generation:${job.id}`');
  });
});

describe('Admin backend safety rails', () => {
  it('does not allow generic Admin job updates to directly mutate status', () => {
    const source = readSource('lib/admin/services/jobs.ts');

    expect(source).toContain('Generation job status cannot be changed directly');
    expect(source).not.toContain('update.status = parsed.status');
  });

  it('verifies template media objects in R2 before linking uploaded assets to templates', () => {
    const source = readSource('lib/admin/services/templates.ts');
    const verifyIndex = source.indexOf('verifyUploadedObject({');
    const updateIndex = source.indexOf('.update(assets)', verifyIndex);

    expect(verifyIndex).toBeGreaterThan(-1);
    expect(updateIndex).toBeGreaterThan(verifyIndex);
    expect(source).toMatch(/\bthumbnailAssetId\b|\bthumbnail_asset_id\b/);
    expect(source).toMatch(/\bpreviewAssetId\b|\bpreview_asset_id\b/);
  });

  it('deletes templates directly from the catalog table', () => {
    const source = readSource('lib/admin/services/templates.ts');

    expect(source).toContain('await db.delete(templates)');
  });

  it('validates template type without writing removed usage counters', () => {
    const source = readSource('lib/generations/jobs.ts');

    expect(source).toContain('select id, type');
    expect(source).toContain('template_type_mismatch');
    expect(source).not.toContain('usage_count');
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

  it('keeps Admin user media on the split history table with soft deletion', () => {
    const source = readSource('lib/admin/services/user-media.ts');

    expect(source).toContain('from(userMediaHistory)');
    expect(source).toContain('requireOpsOrAdmin()');
    expect(source).toContain('requireAdmin()');
    expect(source).toContain('innerJoin(users');
    expect(source).toContain('innerJoin(assets');
    expect(source).toContain("visibility: 'deleted'");
  });

  it('keeps user media Admin routes private and uncached', () => {
    const source = readSource('app/api/admin/user-media/route.ts');

    expect(source).toContain('listAdminUserMedia');
    expect(source).toContain("searchParams.get('userEmail')");
    expect(source).toContain("searchParams.get('assetId')");
    expect(source).toContain("searchParams.get('materialId')");
    expect(source).toContain('updateAdminUserMedia');
    expect(source).toContain('softDeleteAdminUserMedia');
    expect(source).not.toContain('Cache-Control');
    expect(source).not.toContain('public,');
  });

  it('keeps Admin field filters wired from UI to backend services', () => {
    const shell = readSource('app/(dashboard)/admin/components/admin-shell.tsx');
    const usersRoute = readSource('app/api/admin/users/route.ts');
    const jobsRoute = readSource('app/api/admin/generation-jobs/route.ts');
    const creditsRoute = readSource('app/api/admin/credit-ledger/route.ts');
    const usersService = readSource('lib/admin/services/users.ts');
    const jobsService = readSource('lib/admin/services/jobs.ts');
    const creditsService = readSource('lib/admin/services/credits.ts');

    expect(shell).toContain("key: 'email'");
    expect(shell).toContain("key: 'name'");
    expect(shell).toContain("key: 'userEmail'");
    expect(shell).toContain("key: 'assetId'");
    expect(shell).toContain("key: 'genId'");
    expect(shell).toContain("key: 'createdFrom'");
    expect(shell).toContain("key: 'createdTo'");

    expect(usersRoute).toContain("searchParams.get('email')");
    expect(usersRoute).toContain("searchParams.get('name')");
    expect(usersService).toContain('ilikeCol(users.email, email)');
    expect(usersService).toContain('ilikeCol(users.name, name)');

    expect(jobsRoute).toContain("searchParams.get('genId')");
    expect(jobsService).toContain('exactCol(generationJobs.id, genId)');

    expect(creditsRoute).toContain("searchParams.get('userEmail')");
    expect(creditsRoute).toContain("searchParams.get('createdFrom')");
    expect(creditsRoute).toContain("searchParams.get('createdTo')");
    expect(creditsService).toContain('ilikeCol(users.email, userEmail)');
    expect(creditsService).toContain('parseCreditLedgerDateBound');
    expect(creditsService).toContain('creditLedger.createdAt} >=');
    expect(creditsService).toContain('creditLedger.createdAt} <');
  });

  it('does not expose the technical assets table as an Admin management API', () => {
    const serviceIndex = readSource('lib/admin/services/index.ts');

    expect(existsSync(join(process.cwd(), 'app/api/admin/assets/route.ts'))).toBe(
      false
    );
    expect(existsSync(join(process.cwd(), 'lib/admin/services/assets.ts'))).toBe(
      false
    );
    expect(serviceIndex).not.toContain("from './assets'");
  });
});
