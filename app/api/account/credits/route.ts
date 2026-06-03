import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { creditLedger } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/catalog';

export const dynamic = 'force-dynamic';

function findActivePlan({
  planName,
  stripeProductId,
}: {
  planName?: string | null;
  stripeProductId?: string | null;
}) {
  return (
    SUBSCRIPTION_PLANS.find(
      (plan) => plan.name === planName || plan.productId === stripeProductId
    ) ?? null
  );
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const activePlan = findActivePlan({
    planName: user.planName,
    stripeProductId: user.stripeProductId,
  });

  const ledger = await db
    .select({
      id: creditLedger.id,
      delta: creditLedger.delta,
      reason: creditLedger.reason,
      balanceAfter: creditLedger.balanceAfter,
      createdAt: creditLedger.createdAt,
    })
    .from(creditLedger)
    .where(eq(creditLedger.userId, user.id))
    .orderBy(desc(creditLedger.createdAt))
    .limit(12);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      creditBalance: user.creditBalance,
      planName: user.planName,
      subscriptionStatus: user.subscriptionStatus,
    },
    activePlan,
    ledger,
  });
}
