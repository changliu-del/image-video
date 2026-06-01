'use client';

import { Suspense, useActionState } from 'react';
import useSWR from 'swr';
import { Loader2, UserRound } from 'lucide-react';
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

export default function ProfilePage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateAccount,
    {}
  );

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-medium text-orange-600">Personal center</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-950">
            Personal information
          </h1>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-5 w-5 text-orange-600" />
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
                className="bg-orange-500 text-white hover:bg-orange-600"
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
