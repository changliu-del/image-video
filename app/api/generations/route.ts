import { getUser } from '@/lib/db/queries';
import {
  createGenerationForUser,
  GenerationApiError,
} from '@/lib/generations/jobs';
import { generationApiRequestSchema } from '@/lib/generations/validation';
import { captureException } from '@/lib/observability/sentry';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = generationApiRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid generation request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.generationType === 'text-to-image') {
    return NextResponse.json(
      {
        error: 'Text-to-image generation is not available yet',
        code: 'generation_type_not_supported',
      },
      { status: 501 }
    );
  }

  try {
    const job = await createGenerationForUser(user.id, parsed.data);

    return NextResponse.json(
      {
        jobId: job.id,
        status: job.status,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof GenerationApiError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error('Failed to create generation job', error);
    await captureException(error, {
      route: 'POST /api/generations',
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to create generation job' },
      { status: 500 }
    );
  }
}
