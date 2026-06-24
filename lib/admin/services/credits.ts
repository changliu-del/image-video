import 'server-only';

import { and, desc, eq, or, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { dbIdSchema } from '@/lib/db/id-schema';
import { creditLedger, generationJobs, users } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/db/queries';
import {
  getAdminJobTemplateId,
  summarizeAdminJobInput,
} from '@/lib/admin/search';
import {
  exactCol,
  exactJsonTextField,
  ilikeCol,
  ilikeJsonTextField,
  withPagination,
  type PaginatedResult,
} from './shared';

const creditLedgerIdSchema = dbIdSchema;
type AdminCreditLedgerRecord = {
  entry: typeof creditLedger.$inferSelect;
  user: Pick<typeof users.$inferSelect, 'email' | 'name'> | null;
  job: Pick<
    typeof generationJobs.$inferSelect,
    'generationType' | 'inputJson' | 'status'
  > | null;
};
type AdminCreditLedgerListItem = typeof creditLedger.$inferSelect & {
  userEmail: string | null;
  userName: string | null;
  generationType: string | null;
  jobStatus: string | null;
  jobInputSummary: string | null;
  jobTemplateId: string | null;
};

const updateCreditLedgerSchema = z
  .object({
    metadataJson: z.record(z.unknown()).optional(),
  })
  .strict();

function selectCreditsWithContext() {
  return db
    .select({
      entry: creditLedger,
      user: {
        email: users.email,
        name: users.name,
      },
      job: {
        generationType: generationJobs.generationType,
        inputJson: generationJobs.inputJson,
        status: generationJobs.status,
      },
    })
    .from(creditLedger)
    .leftJoin(users, eq(creditLedger.userId, users.id))
    .leftJoin(generationJobs, eq(creditLedger.jobId, generationJobs.id));
}

function adminCreditLedgerRecordToListItem({
  entry,
  job,
  user,
}: AdminCreditLedgerRecord): AdminCreditLedgerListItem {
  return {
    ...entry,
    userEmail: user?.email ?? null,
    userName: user?.name ?? null,
    generationType: job?.generationType ?? null,
    jobStatus: job?.status ?? null,
    jobInputSummary: summarizeAdminJobInput(job?.inputJson),
    jobTemplateId: getAdminJobTemplateId(job?.inputJson),
  };
}

export async function listCredits(params: {
  search?: string;
  userId?: string;
  jobId?: string;
  createdAt?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminCreditLedgerListItem>> {
  await requireAdmin();
  const {
    search = '',
    userId = '',
    jobId = '',
    createdAt = '',
    page = 1,
    pageSize = 20,
  } = params;
  const conditions: SQL[] = [];
  const query = search.trim();

  if (query) {
    const searchCondition = or(
      exactCol(creditLedger.id, query),
      exactCol(creditLedger.userId, query),
      exactCol(creditLedger.jobId, query),
      exactCol(creditLedger.stripeEventId, query),
      exactJsonTextField(creditLedger.metadataJson, 'priceId', query),
      exactJsonTextField(
        creditLedger.metadataJson,
        'stripeCheckoutSessionId',
        query
      ),
      exactJsonTextField(
        creditLedger.metadataJson,
        'stripeCustomerId',
        query
      ),
      exactJsonTextField(
        creditLedger.metadataJson,
        'stripePaymentIntentId',
        query
      ),
      ilikeCol(users.email, query),
      ilikeCol(users.name, query),
      ilikeCol(generationJobs.status, query),
      ilikeCol(generationJobs.generationType, query),
      ilikeJsonTextField(generationJobs.inputJson, 'productName', query),
      ilikeJsonTextField(generationJobs.inputJson, 'prompt', query),
      ilikeJsonTextField(generationJobs.inputJson, 'templateId', query),
      ilikeCol(creditLedger.reason, query),
      ilikeCol(creditLedger.createdAt, query),
      ilikeJsonTextField(creditLedger.metadataJson, 'note', query),
      ilikeJsonTextField(creditLedger.metadataJson, 'source', query),
      ilikeJsonTextField(creditLedger.metadataJson, 'packageName', query),
      ilikeJsonTextField(creditLedger.metadataJson, 'packageKey', query),
      ilikeJsonTextField(creditLedger.metadataJson, 'creditsSource', query),
      ilikeJsonTextField(creditLedger.metadataJson, 'mode', query),
      ilikeJsonTextField(creditLedger.metadataJson, 'currency', query),
      ilikeJsonTextField(creditLedger.metadataJson, 'interval', query),
      ilikeJsonTextField(creditLedger.metadataJson, 'tier', query)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  if (userId.trim()) {
    conditions.push(exactCol(creditLedger.userId, userId));
  }

  if (jobId.trim()) {
    conditions.push(exactCol(creditLedger.jobId, jobId));
  }

  if (createdAt.trim()) {
    conditions.push(ilikeCol(creditLedger.createdAt, createdAt));
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const [rows, countResult] = await Promise.all([
    withPagination(
      selectCreditsWithContext()
        .where(where)
        .orderBy(desc(creditLedger.createdAt)),
      page,
      pageSize
    ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(creditLedger)
      .leftJoin(users, eq(creditLedger.userId, users.id))
      .leftJoin(generationJobs, eq(creditLedger.jobId, generationJobs.id))
      .where(where),
  ]);
  return {
    list: rows.map(adminCreditLedgerRecordToListItem),
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function updateCreditLedgerEntry(id: string, data: unknown) {
  await requireAdmin();
  const entryId = creditLedgerIdSchema.parse(id);
  const parsed = updateCreditLedgerSchema.parse(data);
  const [row] = await db
    .update(creditLedger)
    .set({
      metadataJson: parsed.metadataJson ?? {},
    })
    .where(eq(creditLedger.id, entryId))
    .returning();

  if (!row) {
    throw new Error('Credit ledger entry not found');
  }

  return row;
}
