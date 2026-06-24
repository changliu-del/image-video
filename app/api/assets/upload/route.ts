import { Buffer } from 'node:buffer';

import { buildAssetMediaUrl } from '@/lib/assets/media-url';
import { getUser } from '@/lib/db/queries';
import { dbIdSequences, reserveDbId, toDbIdString } from '@/lib/db/ids';
import {
  createPendingUploadAsset,
  markAssetUploaded,
} from '@/lib/generations/jobs';
import { presignAssetRequestSchema } from '@/lib/generations/validation';
import { captureException } from '@/lib/observability/sentry';
import {
  buildPublicUrl,
  buildUserUploadStorageKey,
  uploadObjectToR2,
} from '@/lib/storage/r2';
import { upsertUserMediaHistory } from '@/lib/user-media/service';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json(
      { error: 'Upload file is required' },
      { status: 400 }
    );
  }

  const parsed = presignAssetRequestSchema.safeParse({
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid upload request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const assetId = await reserveDbId(dbIdSequences.assets);
  const storageKey = buildUserUploadStorageKey(
    user.id,
    assetId,
    parsed.data.mimeType
  );
  const storagePublicUrl = buildPublicUrl(storageKey);

  try {
    await createPendingUploadAsset({
      assetId,
      userId: user.id,
      storageKey,
      publicUrl: storagePublicUrl,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    });

    await uploadObjectToR2({
      storageKey,
      body: Buffer.from(await file.arrayBuffer()),
      mimeType: parsed.data.mimeType,
    });

    const updatedAsset = await markAssetUploaded({
      assetId: toDbIdString(assetId),
      userId: user.id,
      storageKey,
    });

    if (!updatedAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    try {
      await upsertUserMediaHistory({
        userId: user.id,
        assetId: updatedAsset.id,
        source: 'user_upload',
        role: 'input',
        usedCount: 0,
        lastUsedAt: null,
      });
    } catch (error) {
      await captureException(error, {
        route: 'POST /api/assets/upload',
        userId: user.id,
        assetId: updatedAsset.id,
        phase: 'user_media_history',
      });
    }

    return NextResponse.json({
      assetId: updatedAsset.id,
      status: updatedAsset.status,
      storageKey: updatedAsset.storageKey,
      publicUrl: buildAssetMediaUrl(updatedAsset.id),
    });
  } catch (error) {
    console.error('Failed to upload asset', error);
    await captureException(error, {
      route: 'POST /api/assets/upload',
      userId: user.id,
      assetId,
      storageKey,
    });
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    );
  }
}
