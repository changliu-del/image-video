import { getUser } from '@/lib/db/queries';
import {
  GenerationApiError,
  getGenerationJobForUser,
} from '@/lib/generations/jobs';
import { idStringSchema } from '@/lib/generations/validation';
import { captureException } from '@/lib/observability/sentry';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const statusHeaders = {
  'Cache-Control': 'no-store',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const parsedId = idStringSchema.safeParse(resolvedParams.id);

  if (!parsedId.success) {
    return NextResponse.json(
      { error: 'Invalid generation id', details: parsedId.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const job = await getGenerationJobForUser(parsedId.data, user.id);

    if (!job) {
      return NextResponse.json(
        { error: 'Generation not found', code: 'generation_not_found' },
        { status: 404 }
      );
    }

    return NextResponse.json(job, { headers: statusHeaders });
  } catch (error) {
    if (error instanceof GenerationApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('Failed to query generation job', error);
    await captureException(error, {
      route: 'GET /api/generations/[id]/status',
      userId: user.id,
      generationId: parsedId.data,
    });
    return NextResponse.json(
      { error: 'Failed to query generation job' },
      { status: 500 }
    );
  }
}
