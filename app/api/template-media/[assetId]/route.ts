import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { dbIdSchema } from '@/lib/db/id-schema';
import { assets } from '@/lib/db/schema';
import { buildPublicUrl } from '@/lib/storage/r2';
import {
  createCachedTemplateMediaResponse,
  getTemplateMediaCacheEntry,
} from '@/lib/templates/media-cache';

export const runtime = 'nodejs';

async function proxyTemplateMediaSource(input: {
  baseUrl: string;
  mimeType: string | null;
  range: string | null;
  sourceUrl: string;
}) {
  let url: URL;
  try {
    url = new URL(input.sourceUrl, input.baseUrl);
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

  if (upstream.status === 416) {
    return new Response(null, {
      status: 416,
      headers: {
        'Accept-Ranges': 'bytes',
      },
    });
  }

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

      return proxyTemplateMediaSource({
        baseUrl: request.nextUrl.origin,
        mimeType: asset.mimeType,
        range: requestRange,
        sourceUrl: asset.publicUrl,
      });
    }

    return proxyTemplateMediaSource({
      baseUrl: request.nextUrl.origin,
      mimeType: asset.mimeType,
      range: requestRange,
      sourceUrl: buildPublicUrl(asset.storageKey),
    });
  } catch (error) {
    console.error('Failed to load template media', error);
    return NextResponse.json(
      { error: 'Failed to load template media' },
      { status: 500 }
    );
  }
}
