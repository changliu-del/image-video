import 'server-only';

import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/lib/db/drizzle';
import {
  creditLedger,
  generationJobs,
  users,
  type CreditLedgerEntry,
} from '@/lib/db/schema';
import { getSignupFreeCreditsAmount } from '@/lib/generations/free-credits';

export type CreditLedgerMetadata = Record<string, unknown>;

export type GenerationCreditEstimateInput =
  | number
  | {
      durationSeconds: number;
    };

export type ReserveCreditsForJobInput = {
  userId: number;
  jobId: string;
  amount?: number;
  credits?: number;
  durationSeconds?: number;
  reason?: 'reserve';
  metadata?: CreditLedgerMetadata;
};

export type CaptureReservedCreditsInput = {
  userId: number;
  jobId: string;
  metadata?: CreditLedgerMetadata;
};

export type RefundReservedCreditsInput = {
  userId: number;
  jobId: string;
  metadata?: CreditLedgerMetadata;
};

export type GrantPurchasedCreditsInput = {
  userId: number;
  credits: number;
  stripeEventId: string;
  metadata?: CreditLedgerMetadata;
};

export type GrantSignupFreeCreditsInput = {
  userId: number;
  credits?: number;
  metadata?: CreditLedgerMetadata;
};

export type AdjustUserCreditsInput = {
  userId: number;
  amount: number;
  adminUserId: number;
  metadata?: CreditLedgerMetadata;
};

export type CreditLedgerOperationResult = {
  entry: CreditLedgerEntry;
  balance: number;
  alreadyProcessed: boolean;
};

export class InsufficientCreditsError extends Error {
  constructor(
    readonly userId: number,
    readonly requestedCredits: number,
    readonly availableCredits: number
  ) {
    super(
      `Insufficient credits: requested ${requestedCredits}, available ${availableCredits}`
    );
    this.name = 'InsufficientCreditsError';
  }
}

function assertPositiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
}

function assertNonZeroInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value === 0) {
    throw new Error(`${label} must be a non-zero integer`);
  }
}

function estimateFromDuration(durationSeconds: number) {
  switch (durationSeconds) {
    case 5:
      return 10;
    case 8:
      return 18;
    case 10:
      return 25;
    default:
      throw new Error(`Unsupported generation duration: ${durationSeconds}`);
  }
}

function getReserveAmount(input: ReserveCreditsForJobInput) {
  const amount =
    input.amount ??
    input.credits ??
    (input.durationSeconds == null
      ? undefined
      : estimateFromDuration(input.durationSeconds));

  if (amount == null) {
    throw new Error('reserve credits amount is required');
  }

  assertPositiveInteger(amount, 'reserve credits amount');
  return amount;
}

function normalizeMetadata(metadata: CreditLedgerMetadata | undefined) {
  return metadata ?? {};
}

export function estimateCreditsForGeneration(
  input: GenerationCreditEstimateInput
) {
  const durationSeconds =
    typeof input === 'number' ? input : input.durationSeconds;

  return estimateFromDuration(durationSeconds);
}

export async function getCreditBalance(userId: number) {
  const rows = await db
    .select({
      balance: users.creditBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return Number(rows[0]?.balance ?? 0);
}

export async function reserveCreditsForJob(
  input: ReserveCreditsForJobInput
): Promise<CreditLedgerOperationResult> {
  const amount = getReserveAmount(input);

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${input.userId})`);

    const existingRows = await tx
      .select()
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.userId, input.userId),
          eq(creditLedger.jobId, input.jobId),
          eq(creditLedger.reason, 'reserve')
        )
      )
      .orderBy(desc(creditLedger.createdAt))
      .limit(1);

    if (existingRows[0]) {
      return {
        entry: existingRows[0],
        balance: existingRows[0].balanceAfter,
        alreadyProcessed: true,
      };
    }

    const balanceRows = await tx
      .select({
        balance: users.creditBalance,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    const balance = Number(balanceRows[0]?.balance ?? 0);

    if (balance < amount) {
      throw new InsufficientCreditsError(input.userId, amount, balance);
    }

    const balanceAfter = balance - amount;
    await tx
      .update(users)
      .set({
        creditBalance: balanceAfter,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId));

    const insertedRows = await tx
      .insert(creditLedger)
      .values({
        userId: input.userId,
        jobId: input.jobId,
        delta: -amount,
        reason: 'reserve',
        balanceAfter,
        metadataJson: normalizeMetadata(input.metadata),
      })
      .returning();

    return {
      entry: insertedRows[0],
      balance: balanceAfter,
      alreadyProcessed: false,
    };
  });
}

export async function captureReservedCredits(
  input: CaptureReservedCreditsInput
): Promise<CreditLedgerOperationResult> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${input.userId})`);

    const existingRows = await tx
      .select()
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.userId, input.userId),
          eq(creditLedger.jobId, input.jobId),
          eq(creditLedger.reason, 'capture')
        )
      )
      .orderBy(desc(creditLedger.createdAt))
      .limit(1);

    if (existingRows[0]) {
      return {
        entry: existingRows[0],
        balance: existingRows[0].balanceAfter,
        alreadyProcessed: true,
      };
    }

    const reserveRows = await tx
      .select()
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.userId, input.userId),
          eq(creditLedger.jobId, input.jobId),
          eq(creditLedger.reason, 'reserve')
        )
      )
      .orderBy(desc(creditLedger.createdAt))
      .limit(1);

    const reserve = reserveRows[0];
    if (!reserve) {
      throw new Error(`No reserved credits found for job ${input.jobId}`);
    }

    const balanceRows = await tx
      .select({
        balance: users.creditBalance,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    const balance = Number(balanceRows[0]?.balance ?? 0);
    const reservedCredits = Math.abs(reserve.delta);

    const insertedRows = await tx
      .insert(creditLedger)
      .values({
        userId: input.userId,
        jobId: input.jobId,
        delta: 0,
        reason: 'capture',
        balanceAfter: balance,
        metadataJson: {
          reservedCredits,
          ...normalizeMetadata(input.metadata),
        },
      })
      .returning();

    await tx
      .update(generationJobs)
      .set({
        creditSpent: reservedCredits,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(generationJobs.id, input.jobId),
          eq(generationJobs.userId, input.userId)
        )
      );

    return {
      entry: insertedRows[0],
      balance,
      alreadyProcessed: false,
    };
  });
}

export async function refundReservedCredits(
  input: RefundReservedCreditsInput
): Promise<CreditLedgerOperationResult> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${input.userId})`);

    const existingRows = await tx
      .select()
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.userId, input.userId),
          eq(creditLedger.jobId, input.jobId),
          eq(creditLedger.reason, 'refund')
        )
      )
      .orderBy(desc(creditLedger.createdAt))
      .limit(1);

    if (existingRows[0]) {
      return {
        entry: existingRows[0],
        balance: existingRows[0].balanceAfter,
        alreadyProcessed: true,
      };
    }

    const reserveRows = await tx
      .select()
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.userId, input.userId),
          eq(creditLedger.jobId, input.jobId),
          eq(creditLedger.reason, 'reserve')
        )
      )
      .orderBy(desc(creditLedger.createdAt))
      .limit(1);

    const reserve = reserveRows[0];
    if (!reserve) {
      throw new Error(`No reserved credits found for job ${input.jobId}`);
    }

    const balanceRows = await tx
      .select({
        balance: users.creditBalance,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    const balance = Number(balanceRows[0]?.balance ?? 0);
    const refundCredits = Math.abs(reserve.delta);
    const balanceAfter = balance + refundCredits;

    await tx
      .update(users)
      .set({
        creditBalance: balanceAfter,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId));

    const insertedRows = await tx
      .insert(creditLedger)
      .values({
        userId: input.userId,
        jobId: input.jobId,
        delta: refundCredits,
        reason: 'refund',
        balanceAfter,
        metadataJson: {
          reservedCredits: refundCredits,
          ...normalizeMetadata(input.metadata),
        },
      })
      .returning();

    return {
      entry: insertedRows[0],
      balance: balanceAfter,
      alreadyProcessed: false,
    };
  });
}

export async function grantPurchasedCredits(
  input: GrantPurchasedCreditsInput
): Promise<CreditLedgerOperationResult> {
  assertPositiveInteger(input.credits, 'purchased credits');

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${input.userId})`);

    const existingRows = await tx
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.stripeEventId, input.stripeEventId))
      .limit(1);

    if (existingRows[0]) {
      return {
        entry: existingRows[0],
        balance: existingRows[0].balanceAfter,
        alreadyProcessed: true,
      };
    }

    const balanceRows = await tx
      .select({
        balance: users.creditBalance,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    const balance = Number(balanceRows[0]?.balance ?? 0);
    const balanceAfter = balance + input.credits;

    await tx
      .update(users)
      .set({
        creditBalance: balanceAfter,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId));

    const insertedRows = await tx
      .insert(creditLedger)
      .values({
        userId: input.userId,
        stripeEventId: input.stripeEventId,
        delta: input.credits,
        reason: 'purchase',
        balanceAfter,
        metadataJson: normalizeMetadata(input.metadata),
      })
      .returning();

    return {
      entry: insertedRows[0],
      balance: balanceAfter,
      alreadyProcessed: false,
    };
  });
}

export async function grantSignupFreeCredits(
  input: GrantSignupFreeCreditsInput
): Promise<CreditLedgerOperationResult> {
  const credits = input.credits ?? getSignupFreeCreditsAmount();
  assertPositiveInteger(credits, 'signup free credits');

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${input.userId})`);

    const existingRows = await tx
      .select()
      .from(creditLedger)
      .where(
        and(
          eq(creditLedger.userId, input.userId),
          eq(creditLedger.reason, 'admin_adjust'),
          sql`${creditLedger.metadataJson} ->> 'source' = 'signup_free_credits'`
        )
      )
      .orderBy(desc(creditLedger.createdAt))
      .limit(1);

    if (existingRows[0]) {
      return {
        entry: existingRows[0],
        balance: existingRows[0].balanceAfter,
        alreadyProcessed: true,
      };
    }

    const balanceRows = await tx
      .select({
        balance: users.creditBalance,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    const balance = Number(balanceRows[0]?.balance ?? 0);
    const balanceAfter = balance + credits;

    await tx
      .update(users)
      .set({
        creditBalance: balanceAfter,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId));

    const insertedRows = await tx
      .insert(creditLedger)
      .values({
        userId: input.userId,
        delta: credits,
        reason: 'admin_adjust',
        balanceAfter,
        metadataJson: {
          ...normalizeMetadata(input.metadata),
          source: 'signup_free_credits',
          credits,
        },
      })
      .returning();

    return {
      entry: insertedRows[0],
      balance: balanceAfter,
      alreadyProcessed: false,
    };
  });
}

export async function adjustUserCredits(
  input: AdjustUserCreditsInput
): Promise<CreditLedgerOperationResult> {
  assertNonZeroInteger(input.amount, 'credit adjustment');

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${input.userId})`);

    const balanceRows = await tx
      .select({
        balance: users.creditBalance,
      })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!balanceRows[0]) {
      throw new Error(`User ${input.userId} not found`);
    }

    const balance = Number(balanceRows[0].balance ?? 0);
    const balanceAfter = balance + input.amount;

    if (balanceAfter < 0) {
      throw new InsufficientCreditsError(
        input.userId,
        Math.abs(input.amount),
        balance
      );
    }

    await tx
      .update(users)
      .set({
        creditBalance: balanceAfter,
        updatedAt: new Date(),
      })
      .where(eq(users.id, input.userId));

    const insertedRows = await tx
      .insert(creditLedger)
      .values({
        userId: input.userId,
        delta: input.amount,
        reason: 'admin_adjust',
        balanceAfter,
        metadataJson: {
          ...normalizeMetadata(input.metadata),
          adminUserId: input.adminUserId,
        },
      })
      .returning();

    return {
      entry: insertedRows[0],
      balance: balanceAfter,
      alreadyProcessed: false,
    };
  });
}

export const reserveGenerationCredits = reserveCreditsForJob;
export const reserveCredits = reserveCreditsForJob;

export default reserveCreditsForJob;
