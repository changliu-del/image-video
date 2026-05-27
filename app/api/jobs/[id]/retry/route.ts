import { getUser } from '@/lib/db/queries';
import {
  GenerationApiError,
  retryGenerationJobForUser,
} from '@/lib/generations/jobs';
import { idStringSchema } from '@/lib/generations/validation';
import { captureException } from '@/lib/observability/sentry';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const parsedId = idStringSchema.safeParse(params.id);

  if (!parsedId.success) {
    return NextResponse.json(
      { error: 'Invalid job id', code: 'invalid_job_id' },
      { status: 400 }
    );
  }

  try {
    const job = await retryGenerationJobForUser(parsedId.data, user.id);

    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
      },
      { status: job.reused ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof GenerationApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    await captureException(error, {
      route: 'POST /api/jobs/[id]/retry',
      userId: user.id,
      jobId: parsedId.data,
    });
    return NextResponse.json(
      {
        error: 'Failed to retry generation job',
        code: 'retry_failed',
      },
      { status: 500 }
    );
  }
}
