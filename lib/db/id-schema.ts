import { z } from 'zod';

export const dbIdSchema = z.preprocess(
  (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
      return Number(value.trim());
    }
    return value;
  },
  z.number().int().min(0)
);

export const dbIdStringSchema = z.preprocess((value) => {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value.trim();
  return value;
}, z.string().regex(/^\d+$/));

export type DbId = z.infer<typeof dbIdSchema>;

export function parseDbId(value: unknown, label = 'ID') {
  const parsed = dbIdSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} must be a non-negative integer`);
  }

  return parsed.data;
}

export function toDbIdString(value: number | string) {
  return String(parseDbId(value));
}
