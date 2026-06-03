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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ActionState = {
  name?: string;
  error?: string;
  success?: string;
};

function ProfileFields({
  state,
  user,
}: {
  state: ActionState;
  user?: User | null;
}) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={state.name || user?.name || ''}
          placeholder="Enter your name"
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user?.email || ''}
          placeholder="Enter your email"
          required
        />
      </div>
    </>
  );
}

function ProfileForm({ state }: { state: ActionState }) {
  const { data: user } = useSWR<User | null>('/api/user', fetcher);
  return <ProfileFields state={state} user={user} />;
}

function AccountSnapshot() {
  const { data: user } = useSWR<User | null>('/api/user', fetcher);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
          <CreditCard className="size-3.5 text-indigo-600" />
          Subscription plan
        </div>
        <p className="mt-3 truncate text-xl font-semibold text-gray-950">
          {user?.planName ?? 'No active plan'}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {user?.subscriptionStatus ?? 'Choose a plan to unlock recurring credits'}
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/dashboard/billing">
            Manage plans
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
          <Gem className="size-3.5 text-indigo-600" />
          Credit balance
        </div>
        <p className="mt-3 text-3xl font-semibold text-gray-950">
          {user?.creditBalance ?? 0}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Available for image, video, and try-on generations.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/dashboard/credits">
            Buy credits
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-medium text-indigo-600">Personal center</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Personal information
          </h1>
        </div>

        <AccountSnapshot />

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-5 w-5 text-indigo-600" />
              Account profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={formAction}>
              <Suspense fallback={<ProfileFields state={state} />}>
                <ProfileForm state={state} />
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
                    Saving...
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
