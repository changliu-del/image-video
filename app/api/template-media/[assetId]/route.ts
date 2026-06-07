import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { assets } from '@/lib/db/schema';
import { getObjectFromR2 } from '@/lib/storage/r2';
import {
  createCachedTemplateMediaResponse,
  getTemplateMediaCacheEntry,
} from '@/lib/templates/media-cache';

export const runtime = 'nodejs';

type WebStreamBody = {
  transformToWebStream?: () => ReadableStream<Uint8Array>;
};

function toWebStream(body: unknown) {
  if (
    body &&
    typeof body === 'object' &&
    typeof (body as WebStreamBody).transformToWebStream === 'function'
  ) {
    return (body as WebStreamBody).transformToWebStream!();
  }

  return null;
}

function errorStatus(error: unknown) {
  if (!error || typeof error !== 'object' || !('$metadata' in error)) {
    return null;
  }

  const metadata = (error as { $metadata?: { httpStatusCode?: number } })
    .$metadata;
  return metadata?.httpStatusCode ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;
  const requestRange = request.headers.get('range');
  const cachedMedia = getTemplateMediaCacheEntry(assetId);

  if (cachedMedia) {
    const response = createCachedTemplateMediaResponse(
      cachedMedia,
      requestRange
    );

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  }

  try {
    const [asset] = await db
      .select({
        mimeType: assets.mimeType,
        status: assets.status,
        storageKey: assets.storageKey,
      })
      .from(assets)
      .where(eq(assets.id, assetId))
      .limit(1);

    if (
      !asset ||
      asset.status !== 'uploaded' ||
      !asset.storageKey.startsWith('templates/')
    ) {
      return NextResponse.json(
        { error: 'Template media not found' },
        { status: 404 }
      );
    }

    const object = await getObjectFromR2({
      storageKey: asset.storageKey,
      range: requestRange,
    });
    const body = toWebStream(object.Body);

    if (!body) {
      return NextResponse.json(
        { error: 'Template media body not found' },
        { status: 404 }
      );
    }

    const headers = new Headers({
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    });

    const contentType = object.ContentType ?? asset.mimeType;
    if (contentType) {
      headers.set('Content-Type', contentType);
    }
    if (object.ContentLength != null) {
      headers.set('Content-Length', String(object.ContentLength));
    }
    if (object.ContentRange) {
      headers.set('Content-Range', object.ContentRange);
    }
    if (object.ETag) {
      headers.set('ETag', object.ETag);
    }
    if (object.LastModified) {
      headers.set('Last-Modified', object.LastModified.toUTCString());
    }

    return new Response(body, {
      status: object.ContentRange ? 206 : 200,
      headers,
    });
  } catch (error) {
    if (errorStatus(error) === 416) {
      return new Response(null, {
        status: 416,
        headers: {
          'Accept-Ranges': 'bytes',
        },
      });
    }

    console.error('Failed to load template media', error);
    return NextResponse.json(
      { error: 'Failed to load template media' },
      { status: 500 }
    );
  }
}
