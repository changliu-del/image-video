'use server';

import { redirect } from 'next/navigation';
import {
  cancelMockSubscription,
  createCheckoutSession,
  createCustomerPortalSession,
} from './stripe';
import { getUser } from '@/lib/db/queries';
import { normalizeDashboardLocale } from '@/lib/dashboard/content';

function getLocale(formData?: FormData) {
  return normalizeDashboardLocale(formData?.get('locale')?.toString());
}

export async function checkoutAction(formData: FormData) {
  const priceId = formData.get('priceId') as string;
  const locale = getLocale(formData);
  if (!priceId) {
    redirect(`/dashboard/billing?locale=${locale}`);
  }

  await createCheckoutSession({ priceId, locale });
}

export async function customerPortalAction(formData?: FormData) {
  const locale = getLocale(formData);
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const portalSession = await createCustomerPortalSession(user, { locale });
  redirect(portalSession.url);
}

export async function cancelMockSubscriptionAction(formData?: FormData) {
  const locale = getLocale(formData);
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  await cancelMockSubscription(user);
  redirect(`/dashboard/billing?subscription=mock_canceled&locale=${locale}`);
}
