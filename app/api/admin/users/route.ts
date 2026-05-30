import { NextRequest, NextResponse } from 'next/server';
import { listUsers, getUserById, updateUser, softDeleteUser, restoreUser, adjustUserCreditsService } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';

export async function GET(req: NextRequest) {
  try {
    const { search, page, pageSize } = parsePagination(req.nextUrl.searchParams);
    const result = await listUsers({ search, page, pageSize });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message?.includes('Admin') ? 403 : 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const user = await updateUser(id, data);
    return NextResponse.json(user);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await softDeleteUser(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, ...body } = await req.json();
    if (action === 'restore') {
      await restoreUser(body.id);
      return NextResponse.json({ success: true });
    }
    if (action === 'adjust-credits') {
      await adjustUserCreditsService(body);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
