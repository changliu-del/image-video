import { getUser } from '@/lib/db/queries';

const userHeaders = {
  'Cache-Control': 'no-store',
};

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json(null, { headers: userHeaders });
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return Response.json(safeUser, { headers: userHeaders });
}
