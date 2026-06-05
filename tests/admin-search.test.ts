import { describe, expect, it } from 'vitest';

import {
  ADMIN_OPERATIONAL_SEARCH_FIELDS,
  adminSearchMatches,
  getAdminJobDurationSeconds,
  getAdminJobInputSearchValues,
  getAdminJobTemplateId,
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
      expect.arrayContaining(['name', 'category', 'tags'])
    );
    expect(ADMIN_OPERATIONAL_SEARCH_FIELDS['library-assets']).toEqual(
      expect.arrayContaining(['title', 'category', 'assetId', 'mimeType'])
    );
    expect(ADMIN_OPERATIONAL_SEARCH_FIELDS['generation-jobs']).toEqual(
      expect.arrayContaining(['inputSummary', 'status', 'generationType'])
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

  it('matches template name, category, and tag searches', () => {
    const values = [
      'Flash sale product hero',
      'image_to_video',
      ['sale', 'ratio-9-16'],
    ];

    expect(adminSearchMatches(values, 'flash sale')).toBe(true);
    expect(adminSearchMatches(values, 'image_to_video')).toBe(true);
    expect(adminSearchMatches(values, 'ratio-9-16')).toBe(true);
  });

  it('matches library asset title, category, and asset metadata', () => {
    const values = [
      'Lookbook model',
      'try_on',
      '2e8f4c55-a4f7-48d2-b546-55a41e31f31a',
      'image/webp',
    ];

    expect(adminSearchMatches(values, 'lookbook')).toBe(true);
    expect(adminSearchMatches(values, 'try_on')).toBe(true);
    expect(adminSearchMatches(values, 'image/webp')).toBe(true);
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

    expect(summarizeAdminJobInput({ templateId: 'lookbook' })).toBe(
      'lookbook'
    );
  });

  it('exposes template and duration fields for Admin job rows', () => {
    expect(getAdminJobTemplateId({ templateId: 'try-on-default' })).toBe(
      'try-on-default'
    );
    expect(getAdminJobDurationSeconds({ durationSeconds: '8' })).toBe(8);
  });

  it('matches job input summary terms without relying on job ids', () => {
    const values = getAdminJobInputSearchValues({
      productName: 'Pearl handbag',
      prompt: 'Show a premium retail counter',
      templateId: 'luxury-accessory-video',
      id: 'meaningless-job-id',
    });

    expect(adminSearchMatches(values, 'pearl handbag')).toBe(true);
    expect(adminSearchMatches(values, 'luxury-accessory')).toBe(true);
    expect(adminSearchMatches(values, 'meaningless-job-id')).toBe(false);
  });
});
