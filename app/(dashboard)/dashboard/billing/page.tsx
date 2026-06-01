import { redirect } from 'next/navigation';
import { Check, CreditCard, RotateCcw } from 'lucide-react';
import {
  cancelMockSubscriptionAction,
  checkoutAction,
  customerPortalAction,
} from '@/lib/payments/actions';
import { MOCK_MONTHLY_PLANS } from '@/lib/payments/mock';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { getUser } from '@/lib/db/queries';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SubmitButton } from '../../pricing/submit-button';

export const dynamic = 'force-dynamic';

export default async function BillingPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const plans = MOCK_MONTHLY_PLANS.map((plan) => {
    const product = products.find(
      (item) =>
        item.name.toLowerCase() === plan.name.toLowerCase() ||
        item.name.toLowerCase().includes(plan.key.replace('monthly_', ''))
    );
    const price = prices.find(
      (item) =>
        item.interval === 'month' &&
        (item.productId === product?.id || item.credits === plan.credits)
    );

    return {
      ...plan,
      price: price?.unitAmount ?? plan.unitAmount,
      priceId: price?.id,
    };
  });

  const hasActivePlan = user.subscriptionStatus === 'active';

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm font-medium text-orange-600">Monthly plan</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Recharge credits every month
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Active plan: <span className="font-semibold text-gray-950">{user.planName || 'None'}</span>
          </p>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5 text-orange-600" />
              Subscription status
            </CardTitle>
            <CardDescription>
              Monthly plans grant credits immediately in mock mode and are tracked on your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-950">
                {user.subscriptionStatus || 'No active subscription'}
              </p>
              <p className="text-sm text-gray-500">
                Balance: {user.creditBalance} credits
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {user.stripeCustomerId ? (
                <form action={customerPortalAction}>
                  <Button type="submit" variant="outline">
                    Manage billing
                  </Button>
                </form>
              ) : null}
              {hasActivePlan ? (
                <form action={cancelMockSubscriptionAction}>
                  <Button type="submit" variant="outline">
                    <RotateCcw className="h-4 w-4" />
                    Cancel mock plan
                  </Button>
                </form>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.key} className="rounded-lg">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-4xl font-semibold text-gray-950">
                  ${(plan.price / 100).toFixed(2)}
                  <span className="text-base font-medium text-gray-500"> / mo</span>
                </p>
                <p className="mb-6 text-sm font-medium text-orange-600">
                  {plan.credits} credits per month
                </p>
                <ul className="mb-8 space-y-3 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    Credits granted immediately after checkout
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    Works with ecommerce image, video, and image-to-video templates
                  </li>
                  <li className="flex items-start">
                    <Check className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                    Plan state is visible in the personal center
                  </li>
                </ul>
                <form action={checkoutAction}>
                  <input type="hidden" name="priceId" value={plan.priceId ?? ''} />
                  <SubmitButton disabled={!plan.priceId} />
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
