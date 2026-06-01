import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

function messageFor(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    return 'Invalid request';
  }

  return error instanceof Error ? error.message : fallback;
}

export function adminRouteStatus(error: unknown) {
  if (error instanceof ZodError) {
    return 400;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (
    message.includes('not authenticated') ||
    message.includes('unauthorized')
  ) {
    return 401;
  }

  if (
    message.includes('access required') ||
    message.includes('permission') ||
    message.includes('ops can only')
  ) {
    return 403;
  }

  if (message.includes('not found')) {
    return 404;
  }

  if (
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('unsupported') ||
    message.includes('storage key') ||
    message.includes('cannot') ||
    message.includes('no fields')
  ) {
    return 400;
  }

  return 500;
}

export function adminRouteError(error: unknown, fallback: string) {
  const body: { error: string; details?: unknown } = {
    error: messageFor(error, fallback),
  };

  if (error instanceof ZodError) {
    body.details = error.flatten();
  }

  return NextResponse.json(body, { status: adminRouteStatus(error) });
}

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new Error('Invalid JSON body');
  }
}

export function readPositiveIntegerId(value: unknown, label = 'id') {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }

  return id;
}
