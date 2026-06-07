export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');

    const { startTemplateMediaCachePreload } = await import(
      './lib/templates/media-cache'
    );
    void startTemplateMediaCachePreload().catch(() => {
      // The cache is an optimization. Public media reads still fall back to DB/R2.
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
