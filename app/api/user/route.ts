import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json(null);
  }

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return Response.json(safeUser);
}
