export type AdminSearchArea =
  | 'users'
  | 'user-media'
  | 'generation-jobs'
  | 'templates'
  | 'library-assets'
  | 'credit-ledger';

export const ADMIN_OPERATIONAL_SEARCH_FIELDS: Record<
  AdminSearchArea,
  readonly string[]
> = {
  users: ['email', 'name', 'role', 'subscriptionStatus', 'accountStatus'],
  'user-media': [
    'userEmail',
    'userName',
    'title',
    'source',
    'generationType',
    'visibility',
    'role',
    'libraryTitle',
    'jobStatus',
    'mimeType',
  ],
  'generation-jobs': [
    'inputSummary',
    'status',
    'generationType',
  ],
  templates: ['name', 'category', 'tags'],
  'library-assets': ['title', 'description', 'category', 'assetId', 'mimeType'],
  'credit-ledger': [
    'userEmail',
    'userName',
    'reason',
    'stripeEventId',
    'generationType',
    'jobStatus',
    'note',
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function stringFromRecord(input: Record<string, unknown>, key: string) {
  const value = input[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toSearchStrings(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(toSearchStrings);
  }

  if (value instanceof Date) {
    return [value.toISOString()];
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    const normalized = String(value).trim();
    return normalized ? [normalized] : [];
  }

  return [];
}

function uniqueValues(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => !!value)));
}

export function normalizeAdminSearchQuery(search: string | null | undefined) {
  return search?.trim().toLowerCase() ?? '';
}

export function adminSearchMatches(
  values: unknown[],
  search: string | null | undefined
) {
  const query = normalizeAdminSearchQuery(search);

  if (!query) {
    return true;
  }

  return values
    .flatMap(toSearchStrings)
    .some((value) => value.toLowerCase().includes(query));
}

export function summarizeAdminJobInput(input: unknown) {
  if (!isRecord(input)) {
    return null;
  }

  return (
    stringFromRecord(input, 'productName') ??
    stringFromRecord(input, 'prompt') ??
    stringFromRecord(input, 'headline') ??
    stringFromRecord(input, 'templateId') ??
    null
  );
}

export function getAdminJobTemplateId(input: unknown) {
  if (!isRecord(input)) {
    return null;
  }

  return stringFromRecord(input, 'templateId');
}

export function getAdminJobDurationSeconds(input: unknown) {
  if (!isRecord(input)) {
    return null;
  }

  const value = input.durationSeconds;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function getAdminJobInputSearchValues(input: unknown) {
  if (!isRecord(input)) {
    return [];
  }

  return uniqueValues([
    summarizeAdminJobInput(input),
    stringFromRecord(input, 'templateId'),
    stringFromRecord(input, 'productName'),
    stringFromRecord(input, 'prompt'),
    stringFromRecord(input, 'headline'),
    stringFromRecord(input, 'sellingPoint'),
    stringFromRecord(input, 'priceText'),
  ]);
}
