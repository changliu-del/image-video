import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { AdminShell } from './components/admin-shell';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  if (!user.isAdmin) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-950">403</h1>
        <p className="mt-2 text-gray-600">You do not have permission to access the admin console.</p>
      </main>
    );
  }
  return <AdminShell />;
}
