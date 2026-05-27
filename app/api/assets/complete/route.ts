import { getUser } from '@/lib/db/queries';
import {
  getAssetForUser,
  markAssetUploaded,
} from '@/lib/generations/jobs';
import { completeAssetRequestSchema } from '@/lib/generations/validation';
import {
  storageKeyBelongsToUser,
  storageKeyMatchesUploadAsset,
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

  const parsed = completeAssetRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid asset completion request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let asset;
  try {
    asset = await getAssetForUser(parsed.data.assetId, user.id);
  } catch (error) {
    await captureException(error, {
      route: 'POST /api/assets/complete',
      userId: user.id,
      assetId: parsed.data.assetId,
    });
    return NextResponse.json(
      { error: 'Failed to complete asset upload' },
      { status: 500 }
    );
  }

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  if (
    asset.storageKey !== parsed.data.storageKey ||
    !storageKeyBelongsToUser(user.id, parsed.data.storageKey) ||
    !storageKeyMatchesUploadAsset(user.id, asset.id, parsed.data.storageKey)
  ) {
    return NextResponse.json(
      { error: 'Storage key does not match this asset' },
      { status: 400 }
    );
  }

  let updatedAsset;
  try {
    updatedAsset = await markAssetUploaded({
      assetId: asset.id,
      userId: user.id,
      storageKey: parsed.data.storageKey,
    });
  } catch (error) {
    await captureException(error, {
      route: 'POST /api/assets/complete',
      userId: user.id,
      assetId: asset.id,
    });
    return NextResponse.json(
      { error: 'Failed to complete asset upload' },
      { status: 500 }
    );
  }

  if (!updatedAsset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  return NextResponse.json({
    assetId: updatedAsset.id,
    status: updatedAsset.status,
    publicUrl: updatedAsset.publicUrl,
  });
}
