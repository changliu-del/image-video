import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('user id sequence contract', () => {
  it('keeps users as positive ids while resource ids may start at zero', () => {
    const schema = readSource('lib/db/schema.ts');
    const migration = readSource(
      'lib/db/migrations/0029_rekey_primary_ids_to_sequences.sql'
    );
    const userMediaValidation = readSource('lib/user-media/validation.ts');
    const adminUsers = readSource('lib/admin/services/users.ts');

    expect(schema).toContain('users_id_positive_check');
    expect(schema).toContain('sql`${table.id} > 0`');
    expect(migration).toContain('ALTER SEQUENCE IF EXISTS "users_id_seq"');
    expect(migration).toContain('MINVALUE 1');
    expect(migration).toContain('START WITH 1');
    expect(migration).toContain('RESTART WITH 1');
    expect(migration).toContain(
      'ADD CONSTRAINT "users_id_positive_check" CHECK ("id" > 0)'
    );
    expect(migration).toContain('CREATE SEQUENCE "assets_id_seq" AS integer');
    expect(migration).toContain('MINVALUE 0 START WITH 0');
    expect(userMediaValidation).toContain('userId: z.number().int().positive()');
    expect(adminUsers).toContain('userId: z.coerce.number().int().positive()');
  });
});
