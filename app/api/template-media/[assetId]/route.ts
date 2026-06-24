import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { dbIdSchema } from '@/lib/db/id-schema';
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

async function proxyExternalTemplateMedia(input: {
  mimeType: string | null;
  publicUrl: string;
  range: string | null;
}) {
  let url: URL;
  try {
    url = new URL(input.publicUrl);
  } catch {
    return NextResponse.json(
      { error: 'Template media not found' },
      { status: 404 }
    );
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return NextResponse.json(
      { error: 'Template media not found' },
      { status: 404 }
    );
  }

  const upstreamHeaders = new Headers();
  if (input.range) {
    upstreamHeaders.set('Range', input.range);
  }

  const upstream = await fetch(url, {
    headers: upstreamHeaders,
    next: { revalidate: 300 },
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: 'Template media not found' },
      { status: upstream.status === 404 ? 404 : 502 }
    );
  }

  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
  });
  const contentType = upstream.headers.get('Content-Type') ?? input.mimeType;
  if (contentType) {
    headers.set('Content-Type', contentType);
  }

  for (const header of [
    'Content-Length',
    'Content-Range',
    'ETag',
    'Last-Modified',
  ]) {
    const value = upstream.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const { assetId } = await params;
  const parsedAssetId = dbIdSchema.safeParse(assetId);
  if (!parsedAssetId.success) {
    return NextResponse.json(
      { error: 'Template media not found' },
      { status: 404 }
    );
  }
  const requestRange = request.headers.get('range');
  const cachedMedia = getTemplateMediaCacheEntry(parsedAssetId.data);

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
        publicUrl: assets.publicUrl,
        status: assets.status,
        storageKey: assets.storageKey,
      })
      .from(assets)
      .where(eq(assets.id, parsedAssetId.data))
      .limit(1);

    if (!asset || asset.status !== 'uploaded') {
      return NextResponse.json(
        { error: 'Template media not found' },
        { status: 404 }
      );
    }

    if (!asset.storageKey.startsWith('templates/')) {
      if (!asset.storageKey.startsWith('external/')) {
        return NextResponse.json(
          { error: 'Template media not found' },
          { status: 404 }
        );
      }

      return proxyExternalTemplateMedia({
        mimeType: asset.mimeType,
        publicUrl: asset.publicUrl,
        range: requestRange,
      });
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
