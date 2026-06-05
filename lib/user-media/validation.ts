import { z } from 'zod';
import {
  GENERATION_TYPES,
  USER_MEDIA_HISTORY_ROLES,
  USER_MEDIA_HISTORY_SOURCES,
  USER_MEDIA_HISTORY_VISIBILITIES,
} from '@/lib/db/schema';

const visibleMediaVisibilities = ['active', 'hidden'] as const;

const optionalNullableTitleSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(140).nullable().optional());

const optionalNullableDescriptionSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}, z.string().max(2000).nullable().optional());

const optionalDateSchema = z
  .union([z.date(), z.string().datetime().transform((value) => new Date(value))])
  .nullable()
  .optional();

export const userMediaIdSchema = z.string().uuid();

export const createUserMediaHistoryInputSchema = z
  .object({
    userId: z.number().int().positive(),
    assetId: z.string().uuid(),
    libraryAssetId: z.string().uuid().nullable().optional(),
    generationJobId: z.string().uuid().nullable().optional(),
    source: z.enum(USER_MEDIA_HISTORY_SOURCES),
    generationType: z.enum(GENERATION_TYPES).nullable().optional(),
    role: z.enum(USER_MEDIA_HISTORY_ROLES).nullable().optional(),
    title: optionalNullableTitleSchema,
    description: optionalNullableDescriptionSchema,
    visibility: z.enum(USER_MEDIA_HISTORY_VISIBILITIES).optional(),
    isFavorite: z.boolean().optional(),
    usedCount: z.number().int().min(0).optional(),
    lastUsedAt: optionalDateSchema,
  })
  .strict();

export const updateUserMediaHistoryInputSchema = z
  .object({
    title: optionalNullableTitleSchema,
    isFavorite: z.boolean().optional(),
    visibility: z.enum(USER_MEDIA_HISTORY_VISIBILITIES).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.title !== undefined ||
      value.isFavorite !== undefined ||
      value.visibility !== undefined,
    { message: 'No fields to update' }
  );

const listUserMediaQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(24),
    source: z.enum(USER_MEDIA_HISTORY_SOURCES).optional(),
    generationType: z.enum(GENERATION_TYPES).optional(),
    role: z.enum(USER_MEDIA_HISTORY_ROLES).optional(),
    visibility: z.enum(visibleMediaVisibilities).default('active'),
    isFavorite: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict();

export function parseListUserMediaQuery(searchParams: URLSearchParams) {
  return listUserMediaQuerySchema.parse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    source: searchParams.get('source') ?? undefined,
    generationType: searchParams.get('generationType') ?? undefined,
    role: searchParams.get('role') ?? undefined,
    visibility: searchParams.get('visibility') ?? undefined,
    isFavorite:
      searchParams.get('isFavorite') ??
      searchParams.get('favorite') ??
      undefined,
  });
}

export type CreateUserMediaHistoryInput = z.infer<
  typeof createUserMediaHistoryInputSchema
>;
export type UpdateUserMediaHistoryInput = z.infer<
  typeof updateUserMediaHistoryInputSchema
>;
export type ListUserMediaQuery = ReturnType<typeof parseListUserMediaQuery>;
