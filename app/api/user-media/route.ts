import { getUser } from '@/lib/db/queries';
import {
  listUserMedia,
  UserMediaError,
} from '@/lib/user-media/service';
import { parseListUserMediaQuery } from '@/lib/user-media/validation';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const runtime = 'nodejs';

const privateHeaders = {
  'Cache-Control': 'no-store',
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return json(
      { error: 'Invalid request', details: error.flatten() },
      400
    );
  }

  if (error instanceof UserMediaError) {
    return json({ error: error.message, code: error.code }, error.status);
  }

  console.error(fallback, error);
  return json({ error: fallback }, 500);
}

export async function GET(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const query = parseListUserMediaQuery(request.nextUrl.searchParams);
    const result = await listUserMedia({
      userId: user.id,
      ...query,
    });

    return json(result);
  } catch (error) {
    return errorResponse(error, 'Failed to list user media');
  }
}
