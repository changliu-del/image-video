import { client } from '@/lib/db/drizzle';
export {
  dbIdSchema,
  dbIdStringSchema,
  parseDbId,
  toDbIdString,
  type DbId,
} from './id-schema';

export const dbIdSequences = {
  assets: 'assets_id_seq',
  creditLedger: 'credit_ledger_id_seq',
  emailVerificationCodes: 'email_verification_codes_id_seq',
  generationJobs: 'generation_jobs_id_seq',
  templates: 'templates_id_seq',
  userMediaHistory: 'user_media_history_id_seq',
  users: 'users_id_seq',
} as const;

export type DbIdSequenceName =
  (typeof dbIdSequences)[keyof typeof dbIdSequences];

export async function reserveDbId(sequenceName: DbIdSequenceName) {
  const rows = await client<{ id: number }[]>`
    select nextval(${sequenceName}::regclass)::int as id
  `;

  return Number(rows[0]?.id);
}
