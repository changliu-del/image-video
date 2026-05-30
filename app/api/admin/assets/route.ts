import { NextRequest, NextResponse } from 'next/server';
import { listAssets, removeAsset } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';

export async function GET(req: NextRequest) {
  try {
    const { search, page, pageSize } = parsePagination(req.nextUrl.searchParams);
    return NextResponse.json(await listAssets({ search, page, pageSize }));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await removeAsset(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
