import { randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { POSTHOG_EVENTS, captureServerEvent } from '@/lib/analytics/posthog';
import {
  captureReservedCredits,
  refundReservedCredits
} from '@/lib/credits';
import { client } from '@/lib/db/drizzle';
import {
  sendGenerationFailedNotification,
  sendGenerationSucceededNotification
} from '@/lib/email/notifications';
import { FalVideoProvider } from '@/lib/providers/video/fal';
import {
  type ImageToVideoProvider,
  type VideoAspectRatio,
  isVideoAspectRatio
} from '@/lib/providers/video/types';
import {
  generateThumbnail,
  renderEcommerceVideo
} from '@/lib/render/ffmpeg';
import {
  buildEcommerceVideoPrompt,
  normalizeEcommerceTemplateSlug
} from '@/lib/templates/ecommerce';

type GenerationStatus =
  | 'queued'
  | 'running'
  | 'rendering'
  | 'succeeded'
  | 'failed';

interface GenerationJob {
  id: string;
  userId: number;
  status: GenerationStatus | string;
  inputAssetId: string;
  rawVideoAssetId?: string | null;
  finalVideoAssetId?: string | null;
  thumbnailAssetId?: string | null;
  productName: string;
  headline?: string | null;
  sellingPoint?: string | null;
  priceText?: string | null;
  ctaText?: string | null;
  aspectRatio: VideoAspectRatio;
  durationSeconds: number;
  templateSlug: string;
  creditReserved: number;
}

interface AssetRecord {
  id: string;
  storageKey: string;
  publicUrl?: string | null;
  mimeType?: string | null;
}

export interface GenerateVideoPayload {
  jobId: string;
}

export interface StorageUploadInput {
  key: string;
  filePath: string;
  contentType: string;
}

export interface StorageUploadResult {
  storageKey: string;
  publicUrl: string;
}

export interface StorageAdapter {
  uploadFile(input: StorageUploadInput): Promise<StorageUploadResult>;
  createReadUrl?(
    storageKey: string,
    options?: { expiresInSeconds?: number }
  ): Promise<string>;
}

export interface GenerationRunnerDeps {
  provider?: ImageToVideoProvider;
  storage?: StorageAdapter;
  ffmpegPath?: string;
  tmpRoot?: string;
  attemptNumber?: number;
  maxAttempts?: number;
}

export async function runGenerationJob(
  payload: GenerateVideoPayload,
  deps: GenerationRunnerDeps = {}
) {
  let job: GenerationJob | null = null;
  let tmpDir: string | null = null;
  const provider = deps.provider ?? new FalVideoProvider();
  const storage = deps.storage ?? new R2StorageAdapter();
  const attemptNumber = parseAttemptNumber(deps.attemptNumber, 1);
  const maxAttempts = parseAttemptNumber(deps.maxAttempts, attemptNumber);

  try {
    if (!payload.jobId) {
      throw new Error('generate-video payload requires jobId');
    }

    job = await claimQueuedGenerationJob(payload.jobId, provider.name);
    if (!job && attemptNumber > 1) {
      job = await reclaimInProgressGenerationJobForRetryAttempt({
        jobId: payload.jobId,
        providerName: provider.name,
        attemptNumber,
        maxAttempts
      });
    }
    if (!job) {
      const existingJob = await getGenerationJob(payload.jobId);
      if (!existingJob) {
        throw new Error(`generation job not found: ${payload.jobId}`);
      }
      return {
        jobId: existingJob.id,
        status: existingJob.status,
        skipped: true
      };
    }

    tmpDir = await mkdtemp(join(deps.tmpRoot ?? tmpdir(), 'generate-video-'));
    const inputAsset = await getAsset(job.inputAssetId);
    const inputImageUrl = await resolveAssetUrl(inputAsset, storage);
    const template = buildEcommerceVideoPrompt({
      productName: job.productName,
      headline: job.headline,
      sellingPoint: job.sellingPoint,
      priceText: job.priceText,
      ctaText: job.ctaText,
      aspectRatio: job.aspectRatio,
      durationSeconds: job.durationSeconds,
      templateSlug: job.templateSlug
    });

    await markJobPrompt({
      jobId: job.id,
      prompt: template.prompt,
      negativePrompt: template.negativePrompt
    });

    const providerRequest = {
      imageUrl: inputImageUrl,
      prompt: template.prompt,
      negativePrompt: template.negativePrompt,
      durationSeconds: job.durationSeconds,
      aspectRatio: job.aspectRatio
    };
    const created = await provider.createJob(providerRequest);
    await markProviderJobId(job.id, created.providerJobId);

    const providerResult = await provider.waitForResult(created.providerJobId);

    const rawPath = join(tmpDir, 'raw.mp4');
    await downloadToFile(providerResult.videoUrl, rawPath);
    const rawAsset = await uploadAndCreateAsset({
      job,
      storage,
      filePath: rawPath,
      kind: 'raw_video',
      contentType: 'video/mp4',
      durationSeconds: job.durationSeconds
    });

    await markJobRendering(job.id, rawAsset.id);

    const finalPath = join(tmpDir, 'final.mp4');
    const thumbnailPath = join(tmpDir, 'thumbnail.jpg');
    await renderEcommerceVideo({
      inputPath: rawPath,
      outputPath: finalPath,
      aspectRatio: job.aspectRatio,
      overlay: template.overlay,
      durationSeconds: job.durationSeconds,
      ffmpegPath: deps.ffmpegPath
    });
    await generateThumbnail({
      inputPath: finalPath,
      outputPath: thumbnailPath,
      aspectRatio: job.aspectRatio,
      ffmpegPath: deps.ffmpegPath
    });

    const finalAsset = await uploadAndCreateAsset({
      job,
      storage,
      filePath: finalPath,
      kind: 'final_video',
      contentType: 'video/mp4',
      durationSeconds: job.durationSeconds
    });
    const thumbnailAsset = await uploadAndCreateAsset({
      job,
      storage,
      filePath: thumbnailPath,
      kind: 'thumbnail',
      contentType: 'image/jpeg'
    });

    await captureCredits(job);
    await markJobSucceeded({
      jobId: job.id,
      finalVideoAssetId: finalAsset.id,
      thumbnailAssetId: thumbnailAsset.id,
      creditSpent: job.creditReserved
    });
    const succeededJob = job;
    await bestEffort(async () => {
      const recipientEmail = await getUserEmail(succeededJob.userId);
      await sendGenerationSucceededNotification({
        to: recipientEmail,
        job: succeededJob,
        finalVideoUrl: finalAsset.publicUrl
      });
    });
    await bestEffort(() =>
      captureServerEvent({
        distinctId: String(succeededJob.userId),
        event: POSTHOG_EVENTS.GENERATION_SUCCEEDED,
        properties: {
          jobId: succeededJob.id,
          userId: succeededJob.userId,
          aspectRatio: succeededJob.aspectRatio,
          durationSeconds: succeededJob.durationSeconds,
          templateSlug: succeededJob.templateSlug,
          creditSpent: succeededJob.creditReserved,
          source: 'trigger_runner'
        }
      })
    );

    return {
      jobId: job.id,
      status: 'succeeded' as const,
      rawVideoAssetId: rawAsset.id,
      finalVideoAssetId: finalAsset.id,
      thumbnailAssetId: thumbnailAsset.id
    };
  } catch (error) {
    const errorMessage = toErrorMessage(error);
    const failedJob = job;
    if (failedJob) {
      if (attemptNumber < maxAttempts) {
        await markJobQueuedForRetry({
          jobId: failedJob.id,
          errorMessage,
          attemptNumber,
          maxAttempts
        });
        await captureException(error, {
          jobId: failedJob.id,
          attemptNumber,
          maxAttempts,
          retrying: true
        });
        throw error;
      }

      try {
        await refundCredits(failedJob, errorMessage);
        await markJobFailed(failedJob.id, errorMessage);
      } catch (compensationError) {
        await captureException(compensationError, {
          jobId: failedJob.id,
          attemptNumber,
          maxAttempts,
          finalAttempt: true,
          compensation: 'refund_or_mark_failed'
        });
        throw compensationError;
      }
      await bestEffort(async () => {
        const recipientEmail = await getUserEmail(failedJob.userId);
        await sendGenerationFailedNotification({
          to: recipientEmail,
          job: failedJob,
          errorSummary: errorMessage
        });
      });
      await bestEffort(() =>
        captureServerEvent({
          distinctId: String(failedJob.userId),
          event: POSTHOG_EVENTS.GENERATION_FAILED,
          properties: {
            jobId: failedJob.id,
            userId: failedJob.userId,
            errorMessage: errorMessage.slice(0, 1000),
            source: 'trigger_runner'
          }
        })
      );
      await captureException(error, {
        jobId: failedJob.id,
        attemptNumber,
        maxAttempts,
        finalAttempt: true
      });
      throw error;
    }

    await captureException(error, { jobId: payload.jobId });
    throw error;
  } finally {
    const cleanupDir = tmpDir;
    if (cleanupDir) {
      await bestEffort(() => rm(cleanupDir, { recursive: true, force: true }));
    }
  }
}

async function getGenerationJob(jobId: string): Promise<GenerationJob | null> {
  const rows = await client`
    select
      id::text as "id",
      user_id as "userId",
      status,
      input_asset_id::text as "inputAssetId",
      raw_video_asset_id::text as "rawVideoAssetId",
      final_video_asset_id::text as "finalVideoAssetId",
      thumbnail_asset_id::text as "thumbnailAssetId",
      product_name as "productName",
      headline,
      selling_point as "sellingPoint",
      price_text as "priceText",
      cta_text as "ctaText",
      aspect_ratio as "aspectRatio",
      duration_seconds as "durationSeconds",
      template_slug as "templateSlug",
      credit_reserved as "creditReserved"
    from generation_jobs
    where id::text = ${jobId}
    limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapGenerationJobRow(row) : null;
}

async function claimQueuedGenerationJob(
  jobId: string,
  providerName: string
): Promise<GenerationJob | null> {
  const rows = await client`
    update generation_jobs
    set
      status = 'running',
      provider = ${providerName},
      started_at = coalesce(started_at, now()),
      updated_at = now()
    where id::text = ${jobId}
      and status = 'queued'
    returning
      id::text as "id",
      user_id as "userId",
      status,
      input_asset_id::text as "inputAssetId",
      raw_video_asset_id::text as "rawVideoAssetId",
      final_video_asset_id::text as "finalVideoAssetId",
      thumbnail_asset_id::text as "thumbnailAssetId",
      product_name as "productName",
      headline,
      selling_point as "sellingPoint",
      price_text as "priceText",
      cta_text as "ctaText",
      aspect_ratio as "aspectRatio",
      duration_seconds as "durationSeconds",
      template_slug as "templateSlug",
      credit_reserved as "creditReserved"
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapGenerationJobRow(row) : null;
}

async function reclaimInProgressGenerationJobForRetryAttempt(input: {
  jobId: string;
  providerName: string;
  attemptNumber: number;
  maxAttempts: number;
}): Promise<GenerationJob | null> {
  const rows = await client`
    update generation_jobs
    set
      status = 'running',
      provider = ${input.providerName},
      error_message = ${formatRetryReclaimMessage(input)},
      updated_at = now()
    where id::text = ${input.jobId}
      and status in ('running', 'rendering')
    returning
      id::text as "id",
      user_id as "userId",
      status,
      input_asset_id::text as "inputAssetId",
      raw_video_asset_id::text as "rawVideoAssetId",
      final_video_asset_id::text as "finalVideoAssetId",
      thumbnail_asset_id::text as "thumbnailAssetId",
      product_name as "productName",
      headline,
      selling_point as "sellingPoint",
      price_text as "priceText",
      cta_text as "ctaText",
      aspect_ratio as "aspectRatio",
      duration_seconds as "durationSeconds",
      template_slug as "templateSlug",
      credit_reserved as "creditReserved"
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapGenerationJobRow(row) : null;
}

function mapGenerationJobRow(row: Record<string, unknown>): GenerationJob {
  return {
    id: requiredString(row.id, 'generation_jobs.id'),
    userId: parsePositiveNumber(row.userId, 0),
    status: requiredString(row.status, 'generation_jobs.status'),
    inputAssetId: requiredString(
      row.inputAssetId,
      'generation_jobs.input_asset_id'
    ),
    rawVideoAssetId: optionalString(row.rawVideoAssetId),
    finalVideoAssetId: optionalString(row.finalVideoAssetId),
    thumbnailAssetId: optionalString(row.thumbnailAssetId),
    productName: requiredString(row.productName, 'generation_jobs.product_name'),
    headline: optionalString(row.headline),
    sellingPoint: optionalString(row.sellingPoint),
    priceText: optionalString(row.priceText),
    ctaText: optionalString(row.ctaText),
    aspectRatio: parseAspectRatio(row.aspectRatio),
    durationSeconds: parsePositiveNumber(row.durationSeconds, 5),
    templateSlug: normalizeEcommerceTemplateSlug(optionalString(row.templateSlug)),
    creditReserved: parsePositiveNumber(row.creditReserved, 0)
  };
}

async function getAsset(assetId: string): Promise<AssetRecord> {
  const rows = await client`
    select
      id::text as "id",
      storage_key as "storageKey",
      public_url as "publicUrl",
      mime_type as "mimeType"
    from assets
    where id::text = ${assetId}
    limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) {
    throw new Error(`asset not found: ${assetId}`);
  }

  return {
    id: requiredString(row.id, 'assets.id'),
    storageKey: requiredString(row.storageKey, 'assets.storage_key'),
    publicUrl: optionalString(row.publicUrl),
    mimeType: optionalString(row.mimeType)
  };
}

async function getUserEmail(userId: number) {
  const rows = await client`
    select email
    from users
    where id = ${userId}
      and deleted_at is null
    limit 1
  `;

  return optionalString(
    (rows[0] as Record<string, unknown> | undefined)?.email
  );
}

async function markJobPrompt(input: {
  jobId: string;
  prompt: string;
  negativePrompt: string;
}) {
  await client`
    update generation_jobs
    set
      prompt = ${input.prompt},
      negative_prompt = ${input.negativePrompt},
      updated_at = now()
    where id::text = ${input.jobId}
  `;
}

async function markProviderJobId(jobId: string, providerJobId: string) {
  await client`
    update generation_jobs
    set
      provider_job_id = ${providerJobId},
      updated_at = now()
    where id::text = ${jobId}
  `;
}

async function markJobRendering(jobId: string, rawVideoAssetId: string) {
  await client`
    update generation_jobs
    set
      status = 'rendering',
      raw_video_asset_id = ${rawVideoAssetId},
      updated_at = now()
    where id::text = ${jobId}
  `;
}

async function markJobSucceeded(input: {
  jobId: string;
  finalVideoAssetId: string;
  thumbnailAssetId: string;
  creditSpent: number;
}) {
  await client`
    update generation_jobs
    set
      status = 'succeeded',
      final_video_asset_id = ${input.finalVideoAssetId},
      thumbnail_asset_id = ${input.thumbnailAssetId},
      credit_spent = ${input.creditSpent},
      completed_at = now(),
      updated_at = now()
    where id::text = ${input.jobId}
  `;
}

async function markJobFailed(jobId: string, errorMessage: string) {
  await client`
    update generation_jobs
    set
      status = 'failed',
      error_message = ${errorMessage.slice(0, 2000)},
      completed_at = now(),
      updated_at = now()
    where id::text = ${jobId}
  `;
}

async function markJobQueuedForRetry(input: {
  jobId: string;
  errorMessage: string;
  attemptNumber: number;
  maxAttempts: number;
}) {
  await client`
    update generation_jobs
    set
      status = 'queued',
      error_message = ${formatRetryErrorMessage(input)},
      completed_at = null,
      updated_at = now()
    where id::text = ${input.jobId}
  `;
}

async function uploadAndCreateAsset(input: {
  job: GenerationJob;
  storage: StorageAdapter;
  filePath: string;
  kind: 'raw_video' | 'final_video' | 'thumbnail';
  contentType: string;
  durationSeconds?: number;
}) {
  const fileStat = await stat(input.filePath);
  const extension = input.kind === 'thumbnail' ? 'jpg' : 'mp4';
  const storageKey = buildStorageKey({
    userId: String(input.job.userId),
    jobId: input.job.id,
    kind: input.kind,
    extension
  });
  const uploaded = await input.storage.uploadFile({
    key: storageKey,
    filePath: input.filePath,
    contentType: input.contentType
  });
  const rows = await client`
    insert into assets (
      user_id,
      type,
      status,
      storage_key,
      public_url,
      mime_type,
      size_bytes,
      duration_seconds,
      created_at,
      updated_at
    )
    values (
      ${input.job.userId},
      ${input.kind},
      'uploaded',
      ${uploaded.storageKey},
      ${uploaded.publicUrl},
      ${input.contentType},
      ${fileStat.size},
      ${input.durationSeconds ?? null},
      now(),
      now()
    )
    returning
      id::text as "id",
      storage_key as "storageKey",
      public_url as "publicUrl",
      mime_type as "mimeType"
  `;
  const row = rows[0] as Record<string, unknown> | undefined;

  return {
    id: requiredString(row?.id, 'assets.id'),
    storageKey: requiredString(row?.storageKey, 'assets.storage_key'),
    publicUrl: requiredString(row?.publicUrl, 'assets.public_url'),
    mimeType: optionalString(row?.mimeType)
  };
}

async function captureCredits(job: GenerationJob) {
  await captureReservedCredits({
    userId: job.userId,
    jobId: job.id,
    metadata: {
      creditSpent: job.creditReserved,
      source: 'trigger_runner'
    }
  });
}

async function refundCredits(job: GenerationJob, errorMessage: string) {
  if (job.creditReserved <= 0) {
    return;
  }

  await refundReservedCredits({
    userId: job.userId,
    jobId: job.id,
    metadata: {
      errorMessage: errorMessage.slice(0, 1000),
      source: 'trigger_runner'
    }
  });
}

async function downloadToFile(url: string, filePath: string) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(
      `failed to download provider video: ${response.status} ${response.statusText}`
    );
  }

  await pipeline(
    Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
    createWriteStream(filePath)
  );
}

async function resolveAssetUrl(asset: AssetRecord, storage: StorageAdapter) {
  if (storage.createReadUrl) {
    return storage.createReadUrl(asset.storageKey, {
      expiresInSeconds: 60 * 60
    });
  }

  if (asset.publicUrl) {
    return asset.publicUrl;
  }

  return publicUrlForStorageKey(asset.storageKey);
}

function publicUrlForStorageKey(storageKey: string) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!baseUrl) {
    throw new Error('R2_PUBLIC_BASE_URL is required to resolve asset URLs');
  }

  return `${baseUrl.replace(/\/$/, '')}/${storageKey.replace(/^\//, '')}`;
}

function buildStorageKey(input: {
  userId: string;
  jobId: string;
  kind: 'raw_video' | 'final_video' | 'thumbnail';
  extension: string;
}) {
  const directory =
    input.kind === 'raw_video'
      ? 'raw-videos'
      : input.kind === 'final_video'
        ? 'final-videos'
        : 'thumbnails';

  return [
    'users',
    safePathPart(input.userId),
    directory,
    `${safePathPart(input.jobId)}-${randomUUID()}.${input.extension}`
  ].join('/');
}

class R2StorageAdapter implements StorageAdapter {
  async createReadUrl(
    storageKey: string,
    options: { expiresInSeconds?: number } = {}
  ) {
    const client = createR2Client();

    return getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: requiredEnv('R2_BUCKET'),
        Key: storageKey
      }),
      { expiresIn: options.expiresInSeconds ?? 60 * 60 }
    );
  }

  async uploadFile(input: StorageUploadInput): Promise<StorageUploadResult> {
    const bucket = requiredEnv('R2_BUCKET');
    const publicBaseUrl = requiredEnv('R2_PUBLIC_BASE_URL');
    const client = createR2Client();
    const fileStat = await stat(input.filePath);

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: createReadStream(input.filePath),
        ContentType: input.contentType,
        ContentLength: fileStat.size
      })
    );

    return {
      storageKey: input.key,
      publicUrl: `${publicBaseUrl.replace(/\/$/, '')}/${input.key}`
    };
  }
}

function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${requiredEnv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY')
    },
    forcePathStyle: true
  });
}

function parseAspectRatio(value: unknown): VideoAspectRatio {
  if (isVideoAspectRatio(value)) {
    return value;
  }

  throw new Error(`unsupported video aspect ratio: ${String(value)}`);
}

function requiredString(value: unknown, fieldName: string) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  throw new Error(`missing required field ${fieldName}`);
}

function optionalString(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return null;
}

function parsePositiveNumber(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseAttemptNumber(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function formatRetryErrorMessage(input: {
  errorMessage: string;
  attemptNumber: number;
  maxAttempts: number;
}) {
  return `Attempt ${input.attemptNumber}/${input.maxAttempts} failed: ${input.errorMessage}`.slice(
    0,
    2000
  );
}

function formatRetryReclaimMessage(input: {
  attemptNumber: number;
  maxAttempts: number;
}) {
  return `Retry attempt ${input.attemptNumber}/${input.maxAttempts} reclaimed an unfinished worker run.`;
}

function safePathPart(value: string) {
  return (
    value
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || basename(randomUUID())
  );
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function captureException(
  error: unknown,
  extra: Record<string, unknown>
) {
  const moduleName: string = '@sentry/nextjs';
  try {
    const sentry = (await import(moduleName)) as {
      captureException?: (
        error: unknown,
        context?: Record<string, unknown>
      ) => string;
    };
    sentry.captureException?.(error, { extra });
  } catch {
    // Sentry should never block the runner cleanup path.
  }
}

async function bestEffort(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    await captureException(error, { bestEffort: true });
  }
}
