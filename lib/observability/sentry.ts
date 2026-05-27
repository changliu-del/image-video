import 'server-only';

export async function captureException(
  error: unknown,
  extra?: Record<string, unknown>
) {
  try {
    const sentry = (await import('@sentry/nextjs')) as {
      captureException?: (
        error: unknown,
        context?: { extra?: Record<string, unknown> }
      ) => void;
    };

    sentry.captureException?.(error, { extra });
  } catch {
    // Sentry must never block request or task error handling.
  }
}
