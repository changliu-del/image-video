import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { creditLedger } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { isPaymentCheckoutEnabled } from '@/lib/payments/availability';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
    },
    ledger,
    payments: {
      checkoutEnabled: isPaymentCheckoutEnabled(),
    },
  });
}
