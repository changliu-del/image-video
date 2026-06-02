import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Coins, Film, ReceiptText, WandSparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { db } from '@/lib/db/drizzle';
import { creditLedger, generationJobs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { customerPortalAction } from '@/lib/payments/actions';

export const dynamic = 'force-dynamic';

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const [jobs, ledger] = await Promise.all([
    db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.userId, user.id))
      .orderBy(desc(generationJobs.createdAt))
      .limit(8),
    db
      .select()
      .from(creditLedger)
      .where(eq(creditLedger.userId, user.id))
      .orderBy(desc(creditLedger.createdAt))
      .limit(8),
  ]);

  const completedJobs = jobs.filter((job) => job.status === 'succeeded').length;

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-orange-600">
              Personal dashboard
            </p>
            <h1 className="text-2xl font-semibold text-gray-950">
              {user.name || user.email}
            </h1>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/create">
              <WandSparkles className="h-4 w-4" />
              Create
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Coins className="h-5 w-5 text-orange-600" />
                Credits
              </CardTitle>
              <CardDescription>Stored on users.credit_balance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-gray-950">
                {user.creditBalance}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Film className="h-5 w-5 text-orange-600" />
                Recent jobs
              </CardTitle>
              <CardDescription>Latest records for this account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold text-gray-950">
                {jobs.length}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {completedJobs} completed in the latest {jobs.length}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="h-5 w-5 text-orange-600" />
                Billing
              </CardTitle>
              <CardDescription>Credit packages and subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-950">
                  {user.planName || 'Credit plan'}
                </p>
                <p className="text-sm text-gray-500">
                  {user.subscriptionStatus || 'No active subscription'}
                </p>
              </div>
              {user.stripeCustomerId ? (
                <form action={customerPortalAction}>
                  <Button type="submit" variant="outline" size="sm">
                    Manage billing
                  </Button>
                </form>
              ) : (
                <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/credits">Buy credits</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Recent generation jobs</CardTitle>
            <CardDescription>
              Personal generation overview without team membership.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Generation</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Credits</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-gray-500">
                      No video jobs yet.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {job.id.slice(0, 8)}
                      </td>
                      <td className="py-3 pr-4">{job.generationType}</td>
                      <td className="py-3 pr-4">{job.status}</td>
                      <td className="py-3 pr-4">
                        {job.creditSpent || job.creditReserved}
                      </td>
                      <td className="py-3">{formatDate(job.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Credit ledger</CardTitle>
            <CardDescription>Read-only account credit activity.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Delta</th>
                  <th className="py-2 pr-4">Balance after</th>
                  <th className="py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-gray-500">
                      No credit activity yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td className="py-3 pr-4">{entry.reason}</td>
                      <td className="py-3 pr-4">{entry.delta}</td>
                      <td className="py-3 pr-4">{entry.balanceAfter}</td>
                      <td className="py-3">{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
