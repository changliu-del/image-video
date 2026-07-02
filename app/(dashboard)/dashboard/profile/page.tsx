'use client';

import { Suspense, useActionState } from 'react';
import useSWR from 'swr';
import { BadgeCheck, CalendarDays, CreditCard, Gem, Loader2, UserRound } from 'lucide-react';
import { updateAccount } from '@/app/(login)/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/lib/db/schema';
import { useDashboardLocale } from '@/lib/dashboard/use-dashboard-locale';
import type { SubscriptionPlan } from '@/lib/payments/catalog';
import {
  billingCopy,
  profileCopy,
  subscriptionStatusLabels,
} from '@/components/dashboard/account-copy';

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

type BillingAccount = {
  user: {
    planName: string | null;
    subscriptionStatus: string | null;
  };
  activePlan: SubscriptionPlan | null;
  hasActivePlan: boolean;
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

function AccountValue({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  if (loading) {
    return <span className="inline-block h-7 w-24 animate-pulse rounded bg-gray-200" />;
  }

  return <>{children}</>;
}

function CurrentPlanCard() {
  const locale = useDashboardLocale();
  const copy = billingCopy[locale];
  const { data, error, isLoading, mutate } = useSWR<BillingAccount>(
    '/api/account/billing',
    fetcher,
    { revalidateOnFocus: false }
  );
  const activePlan = data?.activePlan ?? null;
  const hasActivePlan = Boolean(data?.hasActivePlan);
  const subscriptionStatus = data?.user.subscriptionStatus;
  const subscriptionStatusLabel = subscriptionStatus
    ? subscriptionStatusLabels[locale][subscriptionStatus] ?? subscriptionStatus
    : copy.inactive;
  const activePlanLabel =
    hasActivePlan && activePlan
      ? `${activePlan.displayName} · ${copy.intervalTabs[activePlan.interval]}`
      : hasActivePlan && data?.user.planName
        ? data.user.planName
        : copy.noActivePlan;
  const cadenceLabel =
    hasActivePlan && activePlan
      ? copy.intervalLabels[activePlan.interval]
      : copy.inactive;
  const creditsLabel =
    hasActivePlan && activePlan
      ? `${activePlan.monthlyCredits} ${copy.creditsPerMonth}`
      : copy.noActivePlan;

  return (
    <Card className="max-w-4xl rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-5 w-5 text-indigo-600" />
          {copy.currentPlan}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
              <BadgeCheck className="size-3.5 text-emerald-500" />
              {copy.currentPlan}
            </div>
            <p className="mt-3 truncate text-lg font-semibold text-gray-950">
              <AccountValue loading={isLoading}>{activePlanLabel}</AccountValue>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {subscriptionStatusLabel}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
              <CalendarDays className="size-3.5 text-cyan-600" />
              {copy.cadence}
            </div>
            <p className="mt-3 text-lg font-semibold text-gray-950">
              <AccountValue loading={isLoading}>{cadenceLabel}</AccountValue>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {copy.cadenceHint}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
              <Gem className="size-3.5 text-indigo-500" />
              {copy.creditsPerMonth}
            </div>
            <p className="mt-3 text-lg font-semibold text-gray-950">
              <AccountValue loading={isLoading}>{creditsLabel}</AccountValue>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {copy.cadenceHint}
            </p>
          </div>
        </div>
        {error ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {copy.loadError}
            <button
              type="button"
              onClick={() => void mutate()}
              className="ml-2 font-semibold underline"
            >
              {copy.retry}
            </button>
          </div>
        ) : null}
      </CardContent>
    </Card>
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
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-medium text-indigo-600">{copy.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            {copy.title}
          </h1>
        </div>

        <Card className="max-w-4xl rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-5 w-5 text-indigo-600" />
              {copy.accountProfile}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={formAction}>
              <input type="hidden" name="locale" value={locale} />
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

        <CurrentPlanCard />
      </div>
    </main>
  );
}
