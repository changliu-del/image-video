import { NextRequest, NextResponse } from 'next/server';
import { listJobs, removeJob } from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';

export async function GET(req: NextRequest) {
  const { page, pageSize } = parsePagination(req.nextUrl.searchParams);
  return NextResponse.json(await listJobs({ page, pageSize }));
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await removeJob(id);
  return NextResponse.json({ success: true });
}
