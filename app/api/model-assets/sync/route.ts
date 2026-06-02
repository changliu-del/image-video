import { type NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { isLocale } from '@/lib/marketing/content';
import { syncWanxiangModelCatalog } from '@/lib/model-assets/catalog';
import { WanxiangProviderError } from '@/lib/providers/wanxiang/types';

export const runtime = 'nodejs';

function canSyncModelCatalog(user: {
  isAdmin?: boolean | null;
  role?: string | null;
}) {
  return user.isAdmin || user.role === 'admin' || user.role === 'ops';
}

export async function POST(request: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canSyncModelCatalog(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const localeParam = request.nextUrl.searchParams.get('locale') ?? 'pt';
  const locale = isLocale(localeParam) ? localeParam : 'pt';

  try {
    const result = await syncWanxiangModelCatalog({ locale });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WanxiangProviderError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode ?? 503 }
      );
    }

    console.error('Failed to sync model catalog', error);
    return NextResponse.json(
      { error: 'Failed to sync model catalog' },
      { status: 500 }
    );
  }
}
