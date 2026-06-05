import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('auth security hardening', () => {
  it('rate limits auth and requires signup verification codes', () => {
    const source = readSource('app/(login)/actions.ts');
    const schemaSource = readSource('lib/db/schema.ts');
    const loginSource = readSource('app/(login)/login.tsx');

    expect(source).toContain('consumeSignInLimit(email)');
    expect(source).toContain('consumeSignUpLimit(email)');
    expect(source).toContain('consumeSignupVerificationCodeRequestLimit(email)');
    expect(source).toContain('consumeSignupVerificationAttemptLimit(input.email)');
    expect(source).toContain('transform(normalizeEmail)');
    expect(source).toContain('sendSignupVerificationCode');
    expect(source).toContain('hashSignupVerificationCode(email, code)');
    expect(source).toContain('SIGNUP_VERIFICATION_MAX_ATTEMPTS');
    expect(source).toContain("lower(${users.email})");
    expect(source).not.toContain('SIGNUP_INVITE_CODE');
    expect(loginSource).toContain('sendSignupVerificationCode');
    expect(loginSource).toContain('name="verificationCode"');
    expect(loginSource).not.toContain('name="inviteId"');
    expect(schemaSource).toContain('email_verification_codes');
    expect(schemaSource).toContain('codeHash: text');
  });

  it('does not return or render password values after auth failures', () => {
    const actionsSource = readSource('app/(login)/actions.ts');
    const securityPageSource = readSource(
      'app/(dashboard)/dashboard/security/page.tsx'
    );

    expect(actionsSource).not.toContain('        currentPassword,');
    expect(actionsSource).not.toContain('        newPassword,');
    expect(actionsSource).not.toContain('        confirmPassword,');
    expect(actionsSource).not.toContain('        password,');
    expect(securityPageSource).not.toContain('defaultValue={passwordState');
    expect(securityPageSource).not.toContain('defaultValue={deleteState.password}');
  });
});

describe('admin proxy hardening', () => {
  it('requires ops or admin access before proxying the legacy template endpoint', () => {
    const source = readSource('app/api/creative-templates/route.ts');

    expect(source).toContain('getUser()');
    expect(source).toContain('hasOpsAccess(user)');
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain("{ error: 'Forbidden' }");
    expect(source).toContain('proxyTemplateAdminList');
  });
});

describe('provider submit hardening', () => {
  it('does not reacquire stale submit leases by resubmitting provider jobs', () => {
    const source = readSource('lib/generations/jobs.ts');

    expect(source).toContain("and status = 'queued'");
    expect(source).toContain('markStaleSubmitLeaseFailedAndRefund');
    expect(source).toContain('generation_submit_lease_expired');
    expect(source).toContain('refusing to resubmit');
  });
});
