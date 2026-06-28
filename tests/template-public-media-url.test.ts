import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolvePublicTemplateMediaUrl } from '../lib/templates/public-media-url';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('public template media URL resolution', () => {
  it('returns a direct CDN URL for uploaded R2-backed template media', () => {
    vi.stubEnv('R2_PUBLIC_BASE_URL', 'https://cdn.example.com/');

    expect(
      resolvePublicTemplateMediaUrl('/api/template-media/42', {
        status: 'uploaded',
        storageKey: 'templates/catalog/thumb.jpg',
      })
    ).toBe('https://cdn.example.com/templates/catalog/thumb.jpg');
  });

  it('falls back to the app media route when the public CDN base is missing', () => {
    vi.stubEnv('R2_PUBLIC_BASE_URL', '');

    expect(
      resolvePublicTemplateMediaUrl('/api/template-media/42', {
        status: 'uploaded',
        storageKey: 'templates/catalog/thumb.jpg',
      })
    ).toBe('/api/template-media/42');
  });

  it('keeps external template media on the app media fallback route', () => {
    vi.stubEnv('R2_PUBLIC_BASE_URL', 'https://cdn.example.com');

    expect(
      resolvePublicTemplateMediaUrl('/api/template-media/43', {
        status: 'uploaded',
        storageKey: 'external/starter/example/preview.mp4',
      })
    ).toBe('/api/template-media/43');
  });

  it('keeps non-uploaded template media on the app media fallback route', () => {
    vi.stubEnv('R2_PUBLIC_BASE_URL', 'https://cdn.example.com');

    expect(
      resolvePublicTemplateMediaUrl('/api/template-media/44', {
        status: 'pending',
        storageKey: 'templates/catalog/pending.jpg',
      })
    ).toBe('/api/template-media/44');
  });
});
