'use server';

import { redirect } from 'next/navigation';
import {
  cancelMockSubscription,
  createCheckoutSession,
  createCustomerPortalSession,
} from './stripe';
import { getUser } from '@/lib/db/queries';

export async function checkoutAction(formData: FormData) {
  const priceId = formData.get('priceId') as string;
  if (!priceId) {
    redirect('/dashboard/billing');
  }

  await createCheckoutSession({ priceId });
}

export async function customerPortalAction() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const portalSession = await createCustomerPortalSession(user);
  redirect(portalSession.url);
}

export async function cancelMockSubscriptionAction() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  await cancelMockSubscription(user);
  redirect('/dashboard/billing?subscription=mock_canceled');
}
