import { randomUUID } from 'crypto';

import { getUser } from '@/lib/db/queries';
import { buildAssetMediaUrl } from '@/lib/assets/media-url';
import { createPendingUploadAsset } from '@/lib/generations/jobs';
import { presignAssetRequestSchema } from '@/lib/generations/validation';
import {
  buildPublicUrl,
  buildUserUploadStorageKey,
  createSignedPutUrl,
} from '@/lib/storage/r2';
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

  const parsed = presignAssetRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid upload request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const assetId = randomUUID();
  const storageKey = buildUserUploadStorageKey(
    user.id,
    assetId,
    parsed.data.mimeType
  );
  const storagePublicUrl = buildPublicUrl(storageKey);

  try {
    const uploadUrl = await createSignedPutUrl({
      storageKey,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    });

    await createPendingUploadAsset({
      assetId,
      userId: user.id,
      storageKey,
      publicUrl: storagePublicUrl,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    });

    return NextResponse.json({
      assetId,
      uploadUrl,
      storageKey,
      publicUrl: buildAssetMediaUrl(assetId),
    });
  } catch (error) {
    console.error('Failed to create signed upload URL', error);
    await captureException(error, {
      route: 'POST /api/assets/presign',
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}
