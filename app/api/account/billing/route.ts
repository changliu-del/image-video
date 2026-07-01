import { NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/catalog';
import { getUser } from '@/lib/db/queries';
import { isPaymentCheckoutEnabled } from '@/lib/payments/availability';

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

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      creditBalance: user.creditBalance,
      planName: user.planName,
      subscriptionStatus: user.subscriptionStatus,
      stripeCustomerId: user.stripeCustomerId,
      stripeProductId: user.stripeProductId,
    },
    activePlan,
    hasActivePlan:
      user.subscriptionStatus === 'active' ||
      user.subscriptionStatus === 'trialing',
    payments: {
      checkoutEnabled: isPaymentCheckoutEnabled(),
    },
  });
}
