import 'server-only';

import { desc, eq, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  GENERATION_JOB_STATUSES,
  generationJobs,
  users,
} from '@/lib/db/schema';
import { requireAdmin, requireOpsOrAdmin } from '@/lib/db/queries';
import {
  getAdminJobDurationSeconds,
  getAdminJobTemplateSlug,
  summarizeAdminJobInput,
} from '@/lib/admin/search';
import {
  exactCol,
  exactJsonTextField,
  ilikeCol,
  ilikeJsonTextField,
  withPagination,
  type PaginatedResult,
} from './shared';

const jobIdSchema = z.string().uuid();
type AdminMediaKind = 'image' | 'video' | 'file';
type AdminAssetPreviewSource = Pick<
  typeof assets.$inferSelect,
  'publicUrl' | 'mimeType'
>;
type AdminAssetPreview = {
  url: string | null;
  mimeType: string | null;
  mediaKind: AdminMediaKind | null;
};
type AdminGenerationJobRecord = {
  job: typeof generationJobs.$inferSelect;
  inputAsset: AdminAssetPreviewSource | null;
  finalImageAsset: AdminAssetPreviewSource | null;
  finalVideoAsset: AdminAssetPreviewSource | null;
};
type AdminGenerationJob = typeof generationJobs.$inferSelect & {
  inputSummary: string | null;
  templateSlug: string | null;
  durationSeconds: number | null;
  inputPreviewUrl: string | null;
  inputPreviewMimeType: string | null;
  inputMediaKind: AdminMediaKind | null;
  finalPreviewUrl: string | null;
  finalPreviewMimeType: string | null;
  finalMediaKind: AdminMediaKind | null;
  finalImagePreviewUrl: string | null;
  finalImagePreviewMimeType: string | null;
  finalImageMediaKind: AdminMediaKind | null;
  finalVideoPreviewUrl: string | null;
  finalVideoPreviewMimeType: string | null;
  finalVideoMediaKind: AdminMediaKind | null;
};

const inputAsset = alias(assets, 'input_asset');
const finalImageAsset = alias(assets, 'final_image_asset');
const finalVideoAsset = alias(assets, 'final_video_asset');
const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  png: 'image/png',
  webm: 'video/webm',
  webp: 'image/webp',
};

const updateJobSchema = z
  .object({
    status: z.enum(GENERATION_JOB_STATUSES).optional(),
    errorMessage: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

function inferAdminMediaKind(input: {
  mimeType?: string | null;
  publicUrl?: string | null;
}): AdminMediaKind {
  const mimeType = input.mimeType?.trim().toLowerCase().split(';')[0] ?? '';
  const url = input.publicUrl?.toLowerCase() ?? '';

  if (
    mimeType.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|avif)(\?|#|$)/.test(url)
  ) {
    return 'image';
  }

  if (
    mimeType.startsWith('video/') ||
    /\.(mp4|webm|mov|m4v)(\?|#|$)/.test(url)
  ) {
    return 'video';
  }

  return 'file';
}

function inferMimeTypeFromUrl(publicUrl: string | null | undefined) {
  const extension = publicUrl
    ?.trim()
    .toLowerCase()
    .split(/[?#]/)[0]
    ?.match(/\.([a-z0-9]+)$/)?.[1];

  return extension ? MIME_TYPE_BY_EXTENSION[extension] ?? null : null;
}

function mediaKindFromMimeType(mimeType: string | null | undefined) {
  const normalized = mimeType?.trim().toLowerCase().split(';')[0] ?? '';
  if (normalized.startsWith('image/')) return 'image';
  if (normalized.startsWith('video/')) return 'video';
  return null;
}

function previewMimeTypeFromAsset(
  asset: AdminAssetPreviewSource | null | undefined
) {
  const mimeType = asset?.mimeType?.trim() || null;

  if (mediaKindFromMimeType(mimeType)) {
    return mimeType;
  }

  return inferMimeTypeFromUrl(asset?.publicUrl) ?? mimeType;
}

function mediaFieldsFromAsset(
  asset: AdminAssetPreviewSource | null | undefined
): AdminAssetPreview {
  const mediaKind = asset ? inferAdminMediaKind(asset) : null;
  const previewMimeType = previewMimeTypeFromAsset(asset);

  if (!asset || mediaKind === 'file') {
    return {
      url: null,
      mimeType: previewMimeType,
      mediaKind,
    };
  }

  return {
    url: asset.publicUrl,
    mimeType: previewMimeType,
    mediaKind,
  };
}

function adminGenerationJobToListItem({
  finalImageAsset,
  finalVideoAsset,
  inputAsset,
  job,
}: AdminGenerationJobRecord): AdminGenerationJob {
  const inputJson =
    job.inputJson &&
    typeof job.inputJson === 'object' &&
    !Array.isArray(job.inputJson)
      ? job.inputJson
      : {};

  const inputPreview = mediaFieldsFromAsset(inputAsset);
  const finalImagePreview = mediaFieldsFromAsset(finalImageAsset);
  const finalVideoPreview = mediaFieldsFromAsset(finalVideoAsset);
  const finalPreview = finalImagePreview.url
    ? finalImagePreview
    : finalVideoPreview;

  return {
    ...job,
    inputSummary: summarizeAdminJobInput(inputJson),
    templateSlug: getAdminJobTemplateSlug(inputJson),
    durationSeconds: getAdminJobDurationSeconds(inputJson),
    inputPreviewUrl: inputPreview.url,
    inputPreviewMimeType: inputPreview.mimeType,
    inputMediaKind: inputPreview.mediaKind,
    finalPreviewUrl: finalPreview.url,
    finalPreviewMimeType: finalPreview.mimeType,
    finalMediaKind: finalPreview.mediaKind,
    finalImagePreviewUrl: finalImagePreview.url,
    finalImagePreviewMimeType: finalImagePreview.mimeType,
    finalImageMediaKind: finalImagePreview.mediaKind,
    finalVideoPreviewUrl: finalVideoPreview.url,
    finalVideoPreviewMimeType: finalVideoPreview.mimeType,
    finalVideoMediaKind: finalVideoPreview.mediaKind,
  };
}

function selectJobsWithAssets() {
  return db
    .select({
      job: generationJobs,
      inputAsset,
      finalImageAsset,
      finalVideoAsset,
    })
    .from(generationJobs)
    .leftJoin(users, eq(generationJobs.userId, users.id))
    .leftJoin(inputAsset, eq(generationJobs.inputAssetId, inputAsset.id))
    .leftJoin(
      finalImageAsset,
      eq(generationJobs.finalImageAssetId, finalImageAsset.id)
    )
    .leftJoin(
      finalVideoAsset,
      eq(generationJobs.finalVideoAssetId, finalVideoAsset.id)
    );
}

async function getAdminGenerationJobRecord(id: string) {
  const [row] = await selectJobsWithAssets()
    .where(eq(generationJobs.id, id))
    .limit(1);

  if (!row) {
    throw new Error('Generation job not found');
  }

  return row;
}

export async function listJobs(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<AdminGenerationJob>> {
  await requireOpsOrAdmin();
  const { search = '', page = 1, pageSize = 20 } = params;
  const query = search.trim();
  const where = query
    ? or(
        exactCol(generationJobs.id, query),
        exactCol(generationJobs.userId, query),
        exactCol(generationJobs.inputAssetId, query),
        exactCol(generationJobs.finalImageAssetId, query),
        exactCol(generationJobs.finalVideoAssetId, query),
        exactCol(generationJobs.providerTaskId, query),
        exactCol(generationJobs.triggerRunId, query),
        exactJsonTextField(generationJobs.inputJson, 'templateId', query),
        exactJsonTextField(generationJobs.inputJson, 'modelAssetId', query),
        exactJsonTextField(
          generationJobs.inputJson,
          'modelCatalogAssetId',
          query
        ),
        exactJsonTextField(generationJobs.inputJson, 'garmentAssetId', query),
        sql`${generationJobs.inputJson}->'garmentAssetIds' ? ${query}`,
        ilikeCol(users.email, query),
        ilikeCol(users.name, query),
        ilikeCol(generationJobs.status, query),
        ilikeCol(generationJobs.generationType, query),
        ilikeCol(generationJobs.tryOnMode, query),
        ilikeCol(generationJobs.provider, query),
        ilikeCol(generationJobs.providerStatus, query),
        ilikeCol(generationJobs.errorMessage, query),
        ilikeJsonTextField(generationJobs.inputJson, 'productName', query),
        ilikeJsonTextField(generationJobs.inputJson, 'headline', query),
        ilikeJsonTextField(generationJobs.inputJson, 'prompt', query),
        ilikeJsonTextField(generationJobs.inputJson, 'templateSlug', query),
        ilikeJsonTextField(generationJobs.inputJson, 'aspectRatio', query)
      )
    : undefined;
  const [rows, countResult] = await Promise.all([
    withPagination(
      selectJobsWithAssets()
        .where(where)
        .orderBy(desc(generationJobs.createdAt)),
      page,
      pageSize
    ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(generationJobs)
      .leftJoin(users, eq(generationJobs.userId, users.id))
      .leftJoin(inputAsset, eq(generationJobs.inputAssetId, inputAsset.id))
      .leftJoin(
        finalImageAsset,
        eq(generationJobs.finalImageAssetId, finalImageAsset.id)
      )
      .leftJoin(
        finalVideoAsset,
        eq(generationJobs.finalVideoAssetId, finalVideoAsset.id)
      )
      .where(where),
  ]);

  return {
    list: rows.map(adminGenerationJobToListItem),
    total: Number(countResult[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function updateJob(id: string, data: unknown) {
  await requireAdmin();
  const jobId = jobIdSchema.parse(id);
  const parsed = updateJobSchema.parse(data);
  const update: Partial<typeof generationJobs.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.status !== undefined) {
    throw new Error(
      'Generation job status cannot be changed directly; use the generation worker or a dedicated recovery action'
    );
  }

  if (parsed.errorMessage !== undefined) {
    update.errorMessage = parsed.errorMessage?.trim() || null;
  }

  if (Object.keys(update).length === 1) {
    throw new Error('No fields to update');
  }

  const [row] = await db
    .update(generationJobs)
    .set(update)
    .where(eq(generationJobs.id, jobId))
    .returning();

  if (!row) {
    throw new Error('Generation job not found');
  }

  return adminGenerationJobToListItem(
    await getAdminGenerationJobRecord(row.id)
  );
}

export async function removeJob(id: string) {
  await requireAdmin();
  const jobId = jobIdSchema.parse(id);
  const [row] = await db
    .delete(generationJobs)
    .where(eq(generationJobs.id, jobId))
    .returning({ id: generationJobs.id });

  if (!row) {
    throw new Error('Generation job not found');
  }
}
