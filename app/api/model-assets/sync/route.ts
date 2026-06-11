import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Model assets are stored as templates with type=model. Use the Wanxiang model template import script instead.',
    },
    { status: 410 }
  );
}
