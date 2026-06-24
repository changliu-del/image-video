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

type UploadErrorPhase =
  | 'asset_id_reserve'
  | 'asset_create'
  | 'asset_finalize'
  | 'file_read'
  | 'r2_upload'
  | 'storage_config';

type PublicErrorDetails = {
  code?: string;
  message?: string;
  name?: string;
  requestId?: string;
  statusCode?: number;
};

function publicErrorDetails(error: unknown) {
  if (!error || typeof error !== 'object') {
    return { message: String(error) };
  }

  const candidate = error as {
    $metadata?: { httpStatusCode?: number; requestId?: string };
    Code?: string;
    code?: string;
    message?: string;
    name?: string;
  };

  return {
    name: candidate.name,
    code: candidate.Code ?? candidate.code,
    statusCode: candidate.$metadata?.httpStatusCode,
    requestId: candidate.$metadata?.requestId,
    message: candidate.message,
  };
}

function errorSummary(details: PublicErrorDetails) {
  const parts = [
    details.name,
    details.code,
    details.statusCode ? `status ${details.statusCode}` : undefined,
  ].filter(Boolean);

  return parts.length ? ` (${parts.join(', ')})` : '';
}

async function uploadErrorResponse(input: {
  assetId?: number;
  error: unknown;
  message: string;
  phase: UploadErrorPhase;
  status: number;
  storageKey?: string;
  userId: number;
}) {
  const details = publicErrorDetails(input.error);
  const message = `${input.message}${errorSummary(details)}`;

  console.error(`Asset upload failed during ${input.phase}`, input.error);
  await captureException(input.error, {
    route: 'POST /api/assets/upload',
    userId: input.userId,
    assetId: input.assetId,
    storageKey: input.storageKey,
    phase: input.phase,
    ...details,
  });

  return NextResponse.json(
    {
      error: message,
      code: `${input.phase}_failed`,
      details,
    },
    { status: input.status }
  );
}

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

  let assetId: number;

  try {
    assetId = await reserveDbId(dbIdSequences.assets);
  } catch (error) {
    return uploadErrorResponse({
      error,
      message: 'Failed to reserve asset ID',
      phase: 'asset_id_reserve',
      status: 500,
      userId: user.id,
    });
  }

  const storageKey = buildUserUploadStorageKey(
    user.id,
    assetId,
    parsed.data.mimeType
  );

  let storagePublicUrl: string;

  try {
    storagePublicUrl = buildPublicUrl(storageKey);
  } catch (error) {
    return uploadErrorResponse({
      assetId,
      error,
      message: 'Failed to read storage configuration',
      phase: 'storage_config',
      status: 500,
      storageKey,
      userId: user.id,
    });
  }

  try {
    await createPendingUploadAsset({
      assetId,
      userId: user.id,
      storageKey,
      publicUrl: storagePublicUrl,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    });
  } catch (error) {
    return uploadErrorResponse({
      assetId,
      error,
      message: 'Failed to create upload asset',
      phase: 'asset_create',
      status: 500,
      storageKey,
      userId: user.id,
    });
  }

  let fileBody: Buffer;

  try {
    fileBody = Buffer.from(await file.arrayBuffer());
  } catch (error) {
    return uploadErrorResponse({
      assetId,
      error,
      message: 'Failed to read upload file',
      phase: 'file_read',
      status: 400,
      storageKey,
      userId: user.id,
    });
  }

  try {
    await uploadObjectToR2({
      storageKey,
      body: fileBody,
      mimeType: parsed.data.mimeType,
    });
  } catch (error) {
    return uploadErrorResponse({
      assetId,
      error,
      message: 'Failed to upload file to R2',
      phase: 'r2_upload',
      status: 502,
      storageKey,
      userId: user.id,
    });
  }

  let updatedAsset;

  try {
    updatedAsset = await markAssetUploaded({
      assetId: toDbIdString(assetId),
      userId: user.id,
      storageKey,
    });
  } catch (error) {
    return uploadErrorResponse({
      assetId,
      error,
      message: 'Failed to finalize upload asset',
      phase: 'asset_finalize',
      status: 500,
      storageKey,
      userId: user.id,
    });
  }

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
}
