import { type NextRequest, NextResponse } from 'next/server';
import {
  adjustUserCreditsService,
  getUserById,
  listUsers,
  restoreUser,
  setUserRole,
  softDeleteUser,
  updateUser,
} from '@/lib/admin/services';
import { parsePagination } from '@/lib/admin/services/shared';
import {
  adminRouteError,
  readJsonBody,
  readPositiveIntegerId,
} from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (id) {
      const user = await getUserById(readPositiveIntegerId(id));

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user);
    }

    const { search, page, pageSize } = parsePagination(
      request.nextUrl.searchParams
    );
    const result = await listUsers({ search, page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    return adminRouteError(error, 'Failed to list users');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    const { id, ...data } = body;
    const user = await updateUser(readPositiveIntegerId(id), data);
    return NextResponse.json(user);
  } catch (error) {
    return adminRouteError(error, 'Failed to update user');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await readJsonBody(request)) as Record<string, unknown>;
    await softDeleteUser(readPositiveIntegerId(body.id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return adminRouteError(error, 'Failed to delete user');
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...body } = (await readJsonBody(request)) as Record<
      string,
      unknown
    >;

    if (action === 'restore') {
      await restoreUser(readPositiveIntegerId(body.id));
      return NextResponse.json({ success: true });
    }

    if (action === 'adjust-credits') {
      await adjustUserCreditsService(
        body as Parameters<typeof adjustUserCreditsService>[0]
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'set-role') {
      await setUserRole(
        readPositiveIntegerId(body.id),
        body.role as Parameters<typeof setUserRole>[1]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (error) {
    return adminRouteError(error, 'Failed to update user');
  }
}
