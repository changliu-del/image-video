import { getUser } from '@/lib/db/queries';
import { getGenerationJobForUser } from '@/lib/generations/jobs';
import { idStringSchema } from '@/lib/generations/validation';
import { captureException } from '@/lib/observability/sentry';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = await context.params;
  const parsedId = idStringSchema.safeParse(params.id);

  if (!parsedId.success) {
    return NextResponse.json({ error: 'Invalid job id' }, { status: 400 });
  }

  let job;
  try {
    job = await getGenerationJobForUser(parsedId.data, user.id);
  } catch (error) {
    await captureException(error, {
      route: 'GET /api/jobs/[id]',
      userId: user.id,
      jobId: parsedId.data,
    });
    return NextResponse.json(
      { error: 'Failed to load job status' },
      { status: 500 }
    );
  }

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    progressLabel: job.progressLabel,
    finalVideoUrl: job.finalVideoUrl,
    thumbnailUrl: job.thumbnailUrl,
    errorMessage: job.errorMessage,
  });
}
