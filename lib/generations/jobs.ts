import 'server-only';

import { randomUUID } from 'crypto';

import { client } from '@/lib/db/drizzle';
import { refundReservedCredits } from '@/lib/credits';
import { getGenerationLimitViolation } from '@/lib/generations/limits';
import {
  getCreditCostForDuration,
  generationRequestSchema,
  type GenerationRequest,
} from '@/lib/generations/validation';

type AssetRecord = {
  id: string;
  userId: number;
  type: string;
  status: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

type JobRecord = {
  id: string;
  status: string;
  reused?: boolean;
};

type JobStatusRecord = {
  id: string;
  status: string;
  progressLabel: string;
  finalVideoUrl: string | null;
  thumbnailUrl: string | null;
  errorMessage: string | null;
};

export class GenerationApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

function toStringValue(value: unknown) {
  return value == null ? '' : String(value);
}

function toNullableString(value: unknown) {
  return value == null ? null : String(value);
}

function toNullableNumber(value: unknown) {
  if (value == null) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toBooleanValue(value: unknown) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value === 'true' || value === 't' || value === '1';
  }

  return Boolean(value);
}

function mapAssetRow(row: Record<string, unknown>): AssetRecord {
  return {
    id: toStringValue(row.id),
    userId: Number(row.user_id),
    type: toStringValue(row.type),
    status: toStringValue(row.status),
    storageKey: toStringValue(row.storage_key),
    publicUrl: toStringValue(row.public_url),
    mimeType: toNullableString(row.mime_type),
    sizeBytes: toNullableNumber(row.size_bytes),
  };
}

function mapJobRow(row: Record<string, unknown>): JobRecord {
  return {
    id: toStringValue(row.id),
    status: toStringValue(row.status),
  };
}

export async function createPendingUploadAsset(input: {
  assetId: string;
  userId: number;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const rows = await client`
    insert into assets (
      id,
      user_id,
      type,
      status,
      storage_key,
      public_url,
      mime_type,
      size_bytes,
      created_at,
      updated_at
    )
    values (
      ${input.assetId},
      ${input.userId},
      'upload',
      'pending',
      ${input.storageKey},
      ${input.publicUrl},
      ${input.mimeType},
      ${input.sizeBytes},
      now(),
      now()
    )
    returning
      id,
      user_id,
      type,
      status,
      storage_key,
      public_url,
      mime_type,
      size_bytes
  `;

  return mapAssetRow(rows[0] as Record<string, unknown>);
}

export async function getAssetForUser(assetId: string, userId: number) {
  const rows = await client`
    select
      id,
      user_id,
      type,
      status,
      storage_key,
      public_url,
      mime_type,
      size_bytes
    from assets
    where id = ${assetId}
      and user_id = ${userId}
    limit 1
  `;

  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapAssetRow(row) : null;
}

export async function markAssetUploaded(input: {
  assetId: string;
  userId: number;
  storageKey: string;
}) {
  const rows = await client`
    update assets
    set
      status = 'uploaded',
      updated_at = now()
    where id = ${input.assetId}
      and user_id = ${input.userId}
      and storage_key = ${input.storageKey}
    returning
      id,
      user_id,
      type,
      status,
      storage_key,
      public_url,
      mime_type,
      size_bytes
  `;

  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapAssetRow(row) : null;
}

export function buildGenerationPrompt(input: GenerationRequest) {
  return [
    'Create a polished ecommerce product video from the uploaded product image.',
    `Product name: ${input.productName}.`,
    `Campaign headline: ${input.headline}.`,
    `Core selling point: ${input.sellingPoint}.`,
    'Use clean lighting, premium product motion, and a commercial social-ad style.',
    'Do not render readable price, CTA, discounts, or typography in the generated video; those overlays are added later.',
  ].join(' ');
}

export async function createQueuedGenerationJob(input: {
  jobId: string;
  userId: number;
  generation: GenerationRequest;
  prompt: string;
  creditReserved: number;
}) {
  const rows = await client`
    insert into generation_jobs (
      id,
      user_id,
      status,
      input_asset_id,
      provider,
      prompt,
      product_name,
      headline,
      selling_point,
      price_text,
      cta_text,
      aspect_ratio,
      duration_seconds,
      template_slug,
      credit_reserved,
      created_at,
      updated_at
    )
    values (
      ${input.jobId},
      ${input.userId},
      'queued',
      ${input.generation.inputAssetId},
      'fal',
      ${input.prompt},
      ${input.generation.productName},
      ${input.generation.headline},
      ${input.generation.sellingPoint},
      ${input.generation.priceText},
      ${input.generation.ctaText},
      ${input.generation.aspectRatio},
      ${input.generation.durationSeconds},
      ${input.generation.templateSlug},
      ${input.creditReserved},
      now(),
      now()
    )
    returning id, status
  `;

  return mapJobRow(rows[0] as Record<string, unknown>);
}

async function createQueuedGenerationJobWithCreditReservation(input: {
  jobId: string;
  userId: number;
  generation: GenerationRequest;
  prompt: string;
  creditReserved: number;
  retryOfJobId?: string;
  metadata?: Record<string, unknown>;
}) {
  return client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.userId})`;

    if (input.retryOfJobId) {
      const activeRetryRows = await sql`
        select
          generation_jobs.id,
          generation_jobs.status
        from generation_jobs
        inner join credit_ledger
          on credit_ledger.job_id = generation_jobs.id
        where generation_jobs.user_id = ${input.userId}
          and generation_jobs.status in ('queued', 'running', 'rendering')
          and credit_ledger.reason = 'reserve'
          and credit_ledger.metadata_json ->> 'retryOfJobId' = ${input.retryOfJobId}
        order by generation_jobs.created_at desc
        limit 1
      `;

      const activeRetryRow = activeRetryRows[0] as
        | Record<string, unknown>
        | undefined;

      if (activeRetryRow) {
        return {
          ...mapJobRow(activeRetryRow),
          reused: true,
        };
      }
    }

    const limitRows = await sql`
      select
        count(*) filter (
          where status in ('queued', 'running', 'rendering')
        )::integer as active_count,
        count(*) filter (
          where created_at >= now() - interval '24 hours'
        )::integer as daily_count,
        count(*)::integer as total_count
      from generation_jobs
      where user_id = ${input.userId}
    `;
    const purchaseRows = await sql`
      select exists(
        select 1
        from credit_ledger
        where user_id = ${input.userId}
          and reason = 'purchase'
      ) as has_purchased_credits
    `;
    const limitRow = limitRows[0] as Record<string, unknown> | undefined;
    const purchaseRow = purchaseRows[0] as Record<string, unknown> | undefined;
    const limitViolation = getGenerationLimitViolation({
      activeCount: Number(limitRow?.active_count ?? 0),
      dailyCount: Number(limitRow?.daily_count ?? 0),
      totalCount: Number(limitRow?.total_count ?? 0),
      hasPurchasedCredits: toBooleanValue(
        purchaseRow?.has_purchased_credits ?? false
      ),
    });

    if (limitViolation) {
      throw new GenerationApiError(
        limitViolation.status,
        limitViolation.code,
        limitViolation.message
      );
    }

    const balanceRows = await sql`
      select coalesce(sum(delta), 0)::integer as balance
      from credit_ledger
      where user_id = ${input.userId}
    `;
    const currentBalance = Number(
      (balanceRows[0] as Record<string, unknown> | undefined)?.balance ?? 0
    );

    if (currentBalance < input.creditReserved) {
      throw new GenerationApiError(
        402,
        'insufficient_credits',
        'Not enough credits to create this generation'
      );
    }

    const jobRows = await sql`
      insert into generation_jobs (
        id,
        user_id,
        status,
        input_asset_id,
        provider,
        prompt,
        product_name,
        headline,
        selling_point,
        price_text,
        cta_text,
        aspect_ratio,
        duration_seconds,
        template_slug,
        credit_reserved,
        created_at,
        updated_at
      )
      values (
        ${input.jobId},
        ${input.userId},
        'queued',
        ${input.generation.inputAssetId},
        'fal',
        ${input.prompt},
        ${input.generation.productName},
        ${input.generation.headline},
        ${input.generation.sellingPoint},
        ${input.generation.priceText},
        ${input.generation.ctaText},
        ${input.generation.aspectRatio},
        ${input.generation.durationSeconds},
        ${input.generation.templateSlug},
        ${input.creditReserved},
        now(),
        now()
      )
      returning id, status
    `;
    const createdJob = mapJobRow(jobRows[0] as Record<string, unknown>);

    await sql`
      insert into credit_ledger (
        user_id,
        job_id,
        delta,
        reason,
        balance_after,
        metadata_json,
        created_at
      )
      values (
        ${input.userId},
        ${input.jobId},
        ${-input.creditReserved},
        'reserve',
        ${currentBalance - input.creditReserved},
        ${JSON.stringify({
          inputAssetId: input.generation.inputAssetId,
          durationSeconds: input.generation.durationSeconds,
          aspectRatio: input.generation.aspectRatio,
          templateSlug: input.generation.templateSlug,
          ...input.metadata,
        })}::jsonb,
        now()
      )
    `;

    return createdJob;
  });
}

async function getRetrySourceJobForUser(jobId: string, userId: number) {
  const rows = await client`
    select
      id::text as id,
      status,
      input_asset_id::text as input_asset_id,
      product_name,
      headline,
      selling_point,
      price_text,
      cta_text,
      aspect_ratio,
      duration_seconds,
      template_slug
    from generation_jobs
    where id::text = ${jobId}
      and user_id = ${userId}
    limit 1
  `;

  const row = rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return {
    id: toStringValue(row.id),
    status: toStringValue(row.status),
    generation: generationRequestSchema.parse({
      inputAssetId: toStringValue(row.input_asset_id),
      productName: toStringValue(row.product_name),
      headline: toStringValue(row.headline),
      sellingPoint: toStringValue(row.selling_point),
      priceText: toStringValue(row.price_text),
      ctaText: toStringValue(row.cta_text),
      aspectRatio: toStringValue(row.aspect_ratio),
      durationSeconds: Number(row.duration_seconds),
      templateSlug: toStringValue(row.template_slug),
    }),
  };
}

export async function triggerGenerateVideoJob(jobId: string) {
  if (!process.env.TRIGGER_SECRET_KEY && !process.env.TRIGGER_API_KEY) {
    console.info(
      `Trigger.dev credentials are not configured; generation job ${jobId} remains queued`
    );
    return { triggered: false, reason: 'missing_trigger_credentials' };
  }

  try {
    const triggerSdk = await import(`@trigger.dev/sdk${'/v3'}`).catch(() =>
      import(`@trigger.dev/${'sdk'}`)
    );
    const tasks = (triggerSdk as { tasks?: unknown }).tasks as
      | { trigger?: (taskId: string, payload: unknown) => Promise<unknown> }
      | undefined;

    if (!tasks?.trigger) {
      console.info(
        `Trigger.dev SDK did not expose tasks.trigger; generation job ${jobId} remains queued`
      );
      return { triggered: false, reason: 'trigger_client_unavailable' };
    }

    await tasks.trigger('generate-video', { jobId });
    return { triggered: true };
  } catch (error) {
    console.warn('Failed to trigger generate-video task', error);
    return { triggered: false, reason: 'trigger_failed' };
  }
}

async function failQueuedJobAndRefund(input: {
  jobId: string;
  userId: number;
  reason: string;
}) {
  await client`
    update generation_jobs
    set
      status = 'failed',
      error_message = ${input.reason},
      completed_at = now(),
      updated_at = now()
    where id = ${input.jobId}
      and user_id = ${input.userId}
      and status = 'queued'
  `;

  await refundReservedCredits({
    userId: input.userId,
    jobId: input.jobId,
    metadata: {
      reason: input.reason,
      source: 'trigger_enqueue_compensation',
    },
  });
}

function getTriggerFailureMessage(code?: string) {
  return code === 'missing_trigger_credentials'
    ? 'Video queue is not configured'
    : 'Video queue could not be reached';
}

export async function createGenerationForUser(
  userId: number,
  generation: GenerationRequest
) {
  const inputAsset = await getAssetForUser(generation.inputAssetId, userId);

  if (!inputAsset) {
    throw new GenerationApiError(
      404,
      'input_asset_not_found',
      'Input asset was not found'
    );
  }

  if (inputAsset.status !== 'uploaded') {
    throw new GenerationApiError(
      400,
      'input_asset_not_uploaded',
      'Input asset must be uploaded before generation'
    );
  }

  const creditReserved = getCreditCostForDuration(generation.durationSeconds);
  const jobId = randomUUID();
  const prompt = buildGenerationPrompt(generation);

  const job = await createQueuedGenerationJobWithCreditReservation({
    jobId,
    userId,
    generation,
    prompt,
    creditReserved,
    metadata: {
      source: 'generation_create',
    },
  });

  const triggerResult = await triggerGenerateVideoJob(job.id);

  if (!triggerResult.triggered) {
    const code = triggerResult.reason ?? 'trigger_failed';
    const reason = getTriggerFailureMessage(code);
    await failQueuedJobAndRefund({
      jobId: job.id,
      userId,
      reason,
    });
    throw new GenerationApiError(503, code, reason);
  }

  return job;
}

export async function retryGenerationJobForUser(
  jobId: string,
  userId: number
) {
  const sourceJob = await getRetrySourceJobForUser(jobId, userId);

  if (!sourceJob) {
    throw new GenerationApiError(404, 'job_not_found', 'Job not found');
  }

  if (sourceJob.status !== 'failed') {
    throw new GenerationApiError(
      409,
      'job_not_failed',
      'Only failed jobs can be retried'
    );
  }

  const inputAsset = await getAssetForUser(
    sourceJob.generation.inputAssetId,
    userId
  );

  if (!inputAsset) {
    throw new GenerationApiError(
      404,
      'input_asset_not_found',
      'Input asset was not found'
    );
  }

  if (inputAsset.status !== 'uploaded') {
    throw new GenerationApiError(
      400,
      'input_asset_not_uploaded',
      'Input asset must be uploaded before generation'
    );
  }

  const newJobId = randomUUID();
  const creditReserved = getCreditCostForDuration(
    sourceJob.generation.durationSeconds
  );
  const prompt = buildGenerationPrompt(sourceJob.generation);

  const job = await createQueuedGenerationJobWithCreditReservation({
    jobId: newJobId,
    userId,
    generation: sourceJob.generation,
    prompt,
    creditReserved,
    retryOfJobId: sourceJob.id,
    metadata: {
      source: 'job_retry',
      retryOfJobId: sourceJob.id,
    },
  });

  if (job.reused) {
    return job;
  }

  const triggerResult = await triggerGenerateVideoJob(job.id);

  if (!triggerResult.triggered) {
    const code = triggerResult.reason ?? 'trigger_failed';
    const reason = getTriggerFailureMessage(code);
    await failQueuedJobAndRefund({
      jobId: job.id,
      userId,
      reason,
    });
    throw new GenerationApiError(503, code, reason);
  }

  return job;
}

export function getProgressLabel(status: string) {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'running':
      return 'Generating video';
    case 'rendering':
      return 'Adding product overlays';
    case 'succeeded':
      return 'Ready';
    case 'failed':
      return 'Failed';
    default:
      return 'Processing';
  }
}

export async function getGenerationJobForUser(jobId: string, userId: number) {
  const rows = await client`
    select
      generation_jobs.id,
      generation_jobs.status,
      generation_jobs.error_message,
      final_asset.public_url as final_video_url,
      thumbnail_asset.public_url as thumbnail_url
    from generation_jobs
    left join assets final_asset
      on final_asset.id = generation_jobs.final_video_asset_id
    left join assets thumbnail_asset
      on thumbnail_asset.id = generation_jobs.thumbnail_asset_id
    where generation_jobs.id = ${jobId}
      and generation_jobs.user_id = ${userId}
    limit 1
  `;

  const row = rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  const status = toStringValue(row.status);

  return {
    id: toStringValue(row.id),
    status,
    progressLabel: getProgressLabel(status),
    finalVideoUrl: toNullableString(row.final_video_url),
    thumbnailUrl: toNullableString(row.thumbnail_url),
    errorMessage: toNullableString(row.error_message),
  } satisfies JobStatusRecord;
}
