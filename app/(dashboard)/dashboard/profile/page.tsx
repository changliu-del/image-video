'use client';

import Link from 'next/link';
import { Suspense, useActionState } from 'react';
import useSWR from 'swr';
import { ArrowRight, CreditCard, Gem, Loader2, UserRound } from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/lib/db/schema';
import { useDashboardLocale, withDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import {
  billingCopy,
  profileCopy,
  subscriptionStatusLabels,
} from '@/components/dashboard/account-copy';
import { SUBSCRIPTION_PLANS } from '@/lib/payments/catalog';

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error('Failed to load profile');
  }
  return response.json();
};

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

function ProfileFields({
  copy,
  state,
  user,
}: {
  copy: (typeof profileCopy)['en'];
  state: ActionState;
  user?: User | null;
}) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          {copy.name}
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={state.name || user?.name || ''}
          placeholder={copy.namePlaceholder}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          {copy.email}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user?.email || ''}
          placeholder={copy.emailPlaceholder}
          required
        />
      </div>
    </>
  );
}

function ProfileForm({
  copy,
  state,
}: {
  copy: (typeof profileCopy)['en'];
  state: ActionState;
}) {
  const { data: user } = useSWR<User | null>('/api/user', fetcher);
  return <ProfileFields copy={copy} state={state} user={user} />;
}

function AccountSnapshot() {
  const locale = useDashboardLocale();
  const copy = profileCopy[locale];
  const billingLabels = billingCopy[locale];
  const { data: user } = useSWR<User | null>('/api/user', fetcher);
  const activePlan =
    SUBSCRIPTION_PLANS.find(
      (plan) => plan.name === user?.planName || plan.productId === user?.stripeProductId
    ) ?? null;
  const planLabel = activePlan
    ? `${activePlan.displayName} · ${billingLabels.intervalTabs[activePlan.interval]}`
    : user?.planName ?? copy.noActivePlan;
  const subscriptionStatus = user?.subscriptionStatus;
  const subscriptionStatusLabel = subscriptionStatus
    ? subscriptionStatusLabels[locale][subscriptionStatus] ?? subscriptionStatus
    : copy.inactive;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
          <CreditCard className="size-3.5 text-indigo-600" />
          {copy.subscriptionPlan}
        </div>
        <p className="mt-3 truncate text-xl font-semibold text-gray-950">
          {planLabel}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {subscriptionStatusLabel}
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href={withDashboardLocale('/dashboard/billing', locale)}>
            {copy.managePlans}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
          <Gem className="size-3.5 text-indigo-600" />
          {copy.creditBalance}
        </div>
        <p className="mt-3 text-3xl font-semibold text-gray-950">
          {user?.creditBalance ?? 0}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {copy.creditHint}
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href={withDashboardLocale('/dashboard/credits', locale)}>
            {copy.buyCredits}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const locale = useDashboardLocale();
  const copy = profileCopy[locale];
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-medium text-indigo-600">{copy.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            {copy.title}
          </h1>
        </div>

        <AccountSnapshot />

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-5 w-5 text-indigo-600" />
              {copy.accountProfile}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={formAction}>
              <Suspense fallback={<ProfileFields copy={copy} state={state} />}>
                <ProfileForm copy={copy} state={state} />
              </Suspense>
              {state.error ? (
                <p className="text-sm text-red-600">{state.error}</p>
              ) : null}
              {state.success ? (
                <p className="text-sm text-emerald-600">{state.success}</p>
              ) : null}
              <Button
                type="submit"
                className="bg-gray-950 text-white hover:bg-gray-800"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {copy.saving}
                  </>
                ) : (
                  copy.save
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
