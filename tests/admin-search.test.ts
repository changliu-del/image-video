import { describe, expect, it } from 'vitest';

import {
  ADMIN_OPERATIONAL_SEARCH_FIELDS,
  adminSearchMatches,
  getAdminJobDurationSeconds,
  getAdminJobInputSearchValues,
  getAdminJobTemplateSlug,
  summarizeAdminJobInput,
} from '../lib/admin/search';

const technicalOnlyFields = new Set([
  'id',
  'userId',
  'assetId',
  'templateId',
  'storageKey',
  'publicUrl',
  'providerTaskId',
  'stripeCustomerId',
  'stripeSubscriptionId',
  'stripeProductId',
]);

describe('Admin operational search fields', () => {
  it('keeps each searchable Admin surface anchored on operator-facing fields', () => {
    for (const fields of Object.values(ADMIN_OPERATIONAL_SEARCH_FIELDS)) {
      expect(
        fields.some((field) => !technicalOnlyFields.has(field))
      ).toBe(true);
    }
  });

  it('includes the operational fields operators naturally search by', () => {
    expect(ADMIN_OPERATIONAL_SEARCH_FIELDS.users).toEqual(
      expect.arrayContaining(['email'])
    );
    expect(ADMIN_OPERATIONAL_SEARCH_FIELDS.templates).toEqual(
      expect.arrayContaining(['title', 'slug', 'status'])
    );
    expect(ADMIN_OPERATIONAL_SEARCH_FIELDS['library-assets']).toEqual(
      expect.arrayContaining(['title', 'kind', 'status', 'tags', 'useCases'])
    );
    expect(ADMIN_OPERATIONAL_SEARCH_FIELDS['generation-jobs']).toEqual(
      expect.arrayContaining(['inputSummary', 'status', 'templateSlug'])
    );
    expect(ADMIN_OPERATIONAL_SEARCH_FIELDS['credit-ledger']).toEqual(
      expect.arrayContaining(['userEmail', 'reason', 'stripeEventId'])
    );
  });
});

describe('adminSearchMatches', () => {
  it('matches user email searches', () => {
    expect(
      adminSearchMatches(['codex-admin@local.test', 'Admin'], 'codex-admin')
    ).toBe(true);
  });

  it('matches template title, slug, and status searches', () => {
    const values = [
      'Flash sale product hero',
      'flash-sale-product-hero',
      'published',
    ];

    expect(adminSearchMatches(values, 'flash sale')).toBe(true);
    expect(adminSearchMatches(values, 'flash-sale-product')).toBe(true);
    expect(adminSearchMatches(values, 'published')).toBe(true);
  });

  it('matches library asset kind, tags, and use cases', () => {
    const values = [
      'Lookbook model',
      'model_image',
      'published',
      ['fashion', 'studio-light'],
      ['try_on'],
    ];

    expect(adminSearchMatches(values, 'model_image')).toBe(true);
    expect(adminSearchMatches(values, 'studio-light')).toBe(true);
    expect(adminSearchMatches(values, 'try_on')).toBe(true);
  });

  it('does not treat arbitrary objects as broad raw search text', () => {
    expect(adminSearchMatches([{ id: 'asset-123' }], 'asset-123')).toBe(false);
  });
});

describe('Admin generation job input search', () => {
  it('summarizes job input from operator-facing fields', () => {
    expect(
      summarizeAdminJobInput({
        productName: 'Suede sneaker',
        prompt: 'Use a warm studio launch scene',
      })
    ).toBe('Suede sneaker');

    expect(
      summarizeAdminJobInput({
        prompt: 'Use a warm studio launch scene',
      })
    ).toBe('Use a warm studio launch scene');

    expect(
      summarizeAdminJobInput({
        headline: 'New season landing hero',
      })
    ).toBe('New season landing hero');

    expect(summarizeAdminJobInput({ templateSlug: 'lookbook' })).toBe(
      'lookbook'
    );
  });

  it('exposes template and duration fields for Admin job rows', () => {
    expect(getAdminJobTemplateSlug({ templateSlug: 'try-on-default' })).toBe(
      'try-on-default'
    );
    expect(getAdminJobTemplateSlug({ templateId: 'template-123' })).toBe(
      'template-123'
    );
    expect(getAdminJobDurationSeconds({ durationSeconds: '8' })).toBe(8);
  });

  it('matches job input summary terms without relying on job ids', () => {
    const values = getAdminJobInputSearchValues({
      productName: 'Pearl handbag',
      prompt: 'Show a premium retail counter',
      templateSlug: 'luxury-accessory-video',
      id: 'meaningless-job-id',
    });

    expect(adminSearchMatches(values, 'pearl handbag')).toBe(true);
    expect(adminSearchMatches(values, 'luxury-accessory')).toBe(true);
    expect(adminSearchMatches(values, 'meaningless-job-id')).toBe(false);
  });
});
