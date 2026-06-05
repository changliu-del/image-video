import { getUser } from '@/lib/db/queries';
import {
  softDeleteUserMediaHistory,
  updateUserMediaHistory,
  UserMediaError,
} from '@/lib/user-media/service';
import { type NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

export const runtime = 'nodejs';

const privateHeaders = {
  'Cache-Control': 'no-store',
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    throw new UserMediaError(400, 'invalid_json', 'Invalid JSON body');
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { id } = await context.params;

  try {
    const body = await readJsonBody(request);
    return json(await updateUserMediaHistory(user.id, id, body));
  } catch (error) {
    return errorResponse(error, 'Failed to update user media');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const { id } = await context.params;

  try {
    await softDeleteUserMediaHistory(user.id, id);
    return json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Failed to delete user media');
  }
}
