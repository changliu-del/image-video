'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { getUser } from '@/lib/db/queries';

export async function checkoutAction(formData: FormData) {
  const priceId = formData.get('priceId') as string;
  if (!priceId) {
    redirect('/pricing');
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
