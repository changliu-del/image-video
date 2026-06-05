import { randomUUID } from 'crypto';
import type postgres from 'postgres';

import { client } from '@/lib/db/drizzle';
import { getGenerationLimitViolation } from '@/lib/generations/limits';
import {
  getCreditCostForGeneration,
  generationRequestSchema,
  type GenerationRequest,
  type GenerationType,
  type TryOnMode,
} from '@/lib/generations/validation';
import {
  getModelCatalogAsset,
  type ModelCatalogAssetItem,
} from '@/lib/model-assets/catalog';
import {
  queryCloth,
  submitCloth,
} from '@/lib/providers/wanxiang/cloth';
import {
  queryImageToVideo,
  submitImageToVideo,
} from '@/lib/providers/wanxiang/img-to-video';
import {
  queryTryOn,
  submitTryOnMulti,
  submitTryOnSingle,
} from '@/lib/providers/wanxiang/starlink';
import { upsertUserMediaHistory } from '@/lib/user-media/service';

const DEFAULT_PROVIDER = 'wanxiang';
const PROVIDER_SUBMIT_LEASE_SECONDS = 120;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type QueryableSql = postgres.Sql;

type TemplateCategory = 'image_to_video' | 'image_to_image' | 'try_on';

const TEMPLATE_CATEGORY_BY_GENERATION_TYPE: Record<
  GenerationType,
  TemplateCategory
> = {
  image_to_video: 'image_to_video',
  apparel_image: 'image_to_image',
  try_on: 'try_on',
};

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
};

type GenerationJobRecord = {
  id: string;
  userId: number;
  generationType: GenerationType;
  status: 'queued' | 'submitting' | 'running' | 'succeeded' | 'failed';
  provider: string;
  providerTaskId: string | null;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown> | null;
  inputAssetId: string;
  outputAssetId: string | null;
  errorMessage: string | null;
  creditReserved: number;
  triggerRunId: string | null;
};

type JobStatusRecord = {
  id: string;
  generationId: string;
  generationType: GenerationType;
  tryOnMode: TryOnMode | null;
  status: string;
  progressLabel: string;
  finalImageUrl: string | null;
  finalVideoUrl: string | null;
  thumbnailUrl: string | null;
  outputJson: Record<string, unknown> | null;
  errorMessage: string | null;
  nextPollMs: number | null;
};

type WanxiangSubmitInput = {
  generationType: GenerationType;
  tryOnMode?: TryOnMode;
  inputAssetUrls: Record<string, string | string[]>;
  inputJson: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type WanxiangSubmitResult = {
  provider?: string;
  providerTaskId: string;
  rawResponse?: unknown;
};

type WanxiangQueryInput = {
  generationType: GenerationType;
  tryOnMode?: TryOnMode | null;
  providerTaskId: string;
};

type WanxiangQueryResult = {
  status: 'running' | 'succeeded' | 'failed';
  imageUrl?: string | null;
  videoUrl?: string | null;
  outputJson?: Record<string, unknown> | null;
  errorMessage?: string | null;
  rawResponse?: unknown;
};

type CreditLedgerMetadata = Record<string, unknown>;

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

function toJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getTryOnModeFromInput(input: Record<string, unknown>) {
  const mode = input.tryOnMode ?? input.mode;
  return mode === 'single' || mode === 'multi' ? mode : null;
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

function mapGenerationJobRow(row: Record<string, unknown>): GenerationJobRecord {
  return {
    id: toStringValue(row.id),
    userId: Number(row.user_id),
    generationType: toStringValue(row.generation_type) as GenerationType,
    status: toStringValue(row.status) as GenerationJobRecord['status'],
    provider: toStringValue(row.provider),
    providerTaskId: toNullableString(row.provider_task_id),
    inputJson: toJsonObject(row.input_json),
    outputJson: row.output_json == null ? null : toJsonObject(row.output_json),
    inputAssetId: toStringValue(row.input_asset_id),
    outputAssetId: toNullableString(row.output_asset_id),
    errorMessage: toNullableString(row.error_message),
    creditReserved: Number(row.credit_reserved ?? 0),
    triggerRunId: toNullableString(row.trigger_run_id),
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

async function getLibraryAssetForGeneration(
  assetId: string,
  generationType: GenerationType
) {
  const rows = await client`
    select
      a.id,
      a.user_id,
      a.type,
      a.status,
      a.storage_key,
      a.public_url,
      a.mime_type,
      a.size_bytes
    from library_assets la
    inner join assets a on a.id = la.asset_id
    where la.asset_id = ${assetId}
      and a.status = 'uploaded'
      and la.category = ${generationType}
    limit 1
  `;

  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapAssetRow(row) : null;
}

async function getGenerationInputAsset(
  assetId: string,
  userId: number,
  generationType: GenerationType
) {
  return (
    (await getAssetForUser(assetId, userId)) ??
    (await getLibraryAssetForGeneration(assetId, generationType))
  );
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

function getInputAssetIds(generation: GenerationRequest) {
  const ids = new Set<string>();
  ids.add(generation.inputAssetId);

  if (generation.generationType === 'try_on') {
    if (generation.modelAssetId) {
      ids.add(generation.modelAssetId);
    }

    for (const garmentAssetId of generation.garmentAssetIds) {
      ids.add(garmentAssetId);
    }
  }

  return [...ids];
}

function buildProviderInputAssets(
  generation: GenerationRequest,
  assetsById: Map<string, AssetRecord>,
  modelCatalogAsset?: ModelCatalogAssetItem | null
): Record<string, string | string[]> {
  switch (generation.generationType) {
    case 'image_to_video':
    case 'apparel_image':
      return {
        inputImageUrl: assetsById.get(generation.inputAssetId)!.publicUrl,
      };
    case 'try_on':
      const modelMediaUrl =
        modelCatalogAsset?.imageUrl ??
        modelCatalogAsset?.thumbnailUrl ??
        modelCatalogAsset?.videoUrl ??
        (generation.modelAssetId
          ? assetsById.get(generation.modelAssetId)?.publicUrl
          : null);

      if (!modelMediaUrl) {
        throw new GenerationApiError(
          404,
          'model_asset_not_found',
          'Model asset was not found'
        );
      }

      return {
        modelImageUrl: modelMediaUrl,
        ...(modelCatalogAsset?.videoUrl ? { modelVideoUrl: modelCatalogAsset.videoUrl } : {}),
        garmentImageUrls: generation.garmentAssetIds.map(
          (assetId) => assetsById.get(assetId)!.publicUrl
        ),
      };
  }
}

function buildInputJson(generation: GenerationRequest) {
  return JSON.parse(JSON.stringify(generation)) as Record<string, unknown>;
}

async function assertTemplateForGeneration(generation: GenerationRequest) {
  if (!generation.templateId) {
    return null;
  }

  if (!UUID_PATTERN.test(generation.templateId)) {
    throw new GenerationApiError(
      400,
      'invalid_template_id',
      'Template ID must be a valid UUID'
    );
  }

  const rows = await client`
    select id, category
    from templates
    where id = ${generation.templateId}
    limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;

  if (!row) {
    throw new GenerationApiError(
      404,
      'template_not_found',
      'Template was not found'
    );
  }

  const expectedCategory =
    TEMPLATE_CATEGORY_BY_GENERATION_TYPE[generation.generationType];
  const actualCategory = toStringValue(row.category) as TemplateCategory;

  if (actualCategory !== expectedCategory) {
    throw new GenerationApiError(
      400,
      'template_category_mismatch',
      'Template category does not match this generation type'
    );
  }

  return toStringValue(row.id);
}

async function assertInputAssetsForUser(
  generation: GenerationRequest,
  userId: number
) {
  const assets = new Map<string, AssetRecord>();

  for (const assetId of getInputAssetIds(generation)) {
    const asset = await getGenerationInputAsset(
      assetId,
      userId,
      generation.generationType
    );

    if (!asset) {
      throw new GenerationApiError(
        404,
        'input_asset_not_found',
        'Input asset was not found'
      );
    }

    if (asset.status !== 'uploaded') {
      throw new GenerationApiError(
        400,
        'input_asset_not_uploaded',
        'Input asset must be uploaded before generation'
      );
    }

    assets.set(assetId, asset);
  }

  return assets;
}

async function createQueuedGenerationJobWithCreditReservation(input: {
  jobId: string;
  userId: number;
  generation: GenerationRequest;
  templateId: string | null;
  inputJson: Record<string, unknown>;
  creditReserved: number;
}) {
  return client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.userId})`;

    const limitRows = await sql`
      select
        count(*) filter (
          where status in ('queued', 'submitting', 'running')
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
      select credit_balance::integer as balance
      from users
      where id = ${input.userId}
      limit 1
    `;
    const balanceRow = balanceRows[0] as Record<string, unknown> | undefined;

    if (!balanceRow) {
      throw new GenerationApiError(404, 'user_not_found', 'User not found');
    }

    const currentBalance = Number(balanceRow.balance ?? 0);
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
        generation_type,
        status,
        provider,
        input_json,
        input_asset_id,
        credit_reserved,
        created_at,
        updated_at
      )
      values (
        ${input.jobId},
        ${input.userId},
        ${input.generation.generationType},
        'queued',
        ${DEFAULT_PROVIDER},
        ${JSON.stringify(input.inputJson)}::jsonb,
        ${input.generation.inputAssetId},
        ${input.creditReserved},
        now(),
        now()
      )
      returning id, status
    `;
    const createdJob = mapJobRow(jobRows[0] as Record<string, unknown>);
    const balanceAfter = currentBalance - input.creditReserved;

    if (input.templateId) {
      await sql`
        update templates
        set usage_count = usage_count + 1
        where id = ${input.templateId}
      `;
    }

    await sql`
      update users
      set
        credit_balance = ${balanceAfter},
        updated_at = now()
      where id = ${input.userId}
    `;

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
        ${balanceAfter},
        ${JSON.stringify({
          generationType: input.generation.generationType,
          tryOnMode:
            input.generation.generationType === 'try_on'
              ? input.generation.tryOnMode
              : undefined,
          inputAssetId: input.generation.inputAssetId,
          templateId: input.templateId,
          provider: DEFAULT_PROVIDER,
          source: 'generation_create',
        })}::jsonb,
        now()
      )
    `;

    return createdJob;
  });
}

function buildWanxiangPayload(input: WanxiangSubmitInput) {
  return {
    ...input.inputJson,
    ...input.inputAssetUrls,
    metadata: input.metadata,
  };
}

async function submitWanxiangGeneration(input: WanxiangSubmitInput) {
  const payload = buildWanxiangPayload(input);

  if (input.generationType === 'image_to_video') {
    const result = await submitImageToVideo(payload);
    return normalizeWanxiangSubmitResult(result);
  }

  if (input.generationType === 'apparel_image') {
    const result = await submitCloth(payload);
    return normalizeWanxiangSubmitResult(result);
  }

  const result =
    input.tryOnMode === 'multi'
      ? await submitTryOnMulti(payload)
      : await submitTryOnSingle(payload);

  return normalizeWanxiangSubmitResult(result);
}

async function queryWanxiangGeneration(input: WanxiangQueryInput) {
  if (input.generationType === 'image_to_video') {
    const result = await queryImageToVideo(input.providerTaskId);
    return normalizeWanxiangQueryResult(result);
  }

  if (input.generationType === 'apparel_image') {
    const result = await queryCloth(input.providerTaskId);
    return normalizeWanxiangQueryResult(result);
  }

  const result = await queryTryOn(input.providerTaskId);
  return normalizeWanxiangQueryResult(result);
}

function normalizeWanxiangSubmitResult(
  result: { providerTaskId?: string; rawResponse?: unknown } | undefined
): WanxiangSubmitResult {
  if (!result?.providerTaskId) {
    throw new GenerationApiError(
      503,
      'provider_submit_unavailable',
      'Generation provider submit is not configured'
    );
  }

  return {
    provider: DEFAULT_PROVIDER,
    providerTaskId: result.providerTaskId,
    rawResponse: result.rawResponse,
  };
}

function normalizeWanxiangQueryResult(
  result:
    | {
        status: WanxiangQueryResult['status'];
        finalImageUrl?: string;
        finalVideoUrl?: string;
        rawResponse?: unknown;
        errorMessage?: string;
      }
    | undefined
): WanxiangQueryResult {
  if (!result) {
    throw new GenerationApiError(
      503,
      'provider_query_unavailable',
      'Generation provider query is not configured'
    );
  }

  return {
    status: result.status,
    imageUrl: result.finalImageUrl,
    videoUrl: result.finalVideoUrl,
    outputJson: {
      finalImageUrl: result.finalImageUrl,
      finalVideoUrl: result.finalVideoUrl,
    },
    rawResponse: result.rawResponse,
    errorMessage: result.errorMessage,
  };
}

async function markJobTriggerRun(input: {
  jobId: string;
  userId: number;
  triggerRunId: string | null;
}) {
  await client`
    update generation_jobs
    set
      trigger_run_id = ${input.triggerRunId},
      updated_at = now()
    where id = ${input.jobId}
      and user_id = ${input.userId}
      and status = 'queued'
  `;
}

async function markQueuedJobFailedAndRefund(input: {
  jobId: string;
  userId: number;
  errorMessage: string;
}) {
  await client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.userId})`;

    const rows = await sql`
      update generation_jobs
      set
        status = 'failed',
        error_message = ${input.errorMessage.slice(0, 2000)},
        updated_at = now()
      where id = ${input.jobId}
        and user_id = ${input.userId}
        and status in ('queued', 'submitting', 'running')
      returning id
    `;

    if (!rows[0]) {
      return;
    }

    await refundReservedCreditsInTransaction(
      {
        userId: input.userId,
        jobId: input.jobId,
        metadata: {
          reason: input.errorMessage.slice(0, 1000),
          source: 'generation_enqueue_failed',
        },
      },
      sql
    );
  });
}

export async function createGenerationForUser(
  userId: number,
  generation: GenerationRequest
) {
  const creditReserved = getCreditCostForGeneration(generation);
  await assertInputAssetsForUser(generation, userId);
  const templateId = await assertTemplateForGeneration(generation);
  const modelCatalogAsset =
    generation.generationType === 'try_on' && generation.modelCatalogAssetId
      ? await getModelCatalogAsset({ id: generation.modelCatalogAssetId })
      : null;

  if (
    generation.generationType === 'try_on' &&
    generation.modelCatalogAssetId &&
    !modelCatalogAsset
  ) {
    throw new GenerationApiError(
      404,
      'model_catalog_asset_not_found',
      'Model catalog asset was not found'
    );
  }

  const jobId = randomUUID();
  const inputJson = buildInputJson(generation);
  const job = await createQueuedGenerationJobWithCreditReservation({
    jobId,
    userId,
    generation,
    templateId,
    inputJson,
    creditReserved,
  });

  try {
    const { enqueueWanxiangGenerationJob } = await import(
      '@/lib/generations/trigger'
    );
    const triggerRun = await enqueueWanxiangGenerationJob(job.id);
    await markJobTriggerRun({
      jobId: job.id,
      userId,
      triggerRunId: triggerRun.runId,
    });
  } catch (error) {
    await markQueuedJobFailedAndRefund({
      jobId: job.id,
      userId,
      errorMessage:
        error instanceof Error
          ? error.message
          : 'Failed to enqueue generation worker',
    });

    throw new GenerationApiError(
      503,
      'trigger_enqueue_failed',
      'Failed to enqueue generation worker'
    );
  }

  return job;
}

export async function retryGenerationJobForUser(
  _jobId?: string,
  _userId?: number
): Promise<JobRecord & { reused?: boolean }> {
  throw new GenerationApiError(
    410,
    'retry_not_supported',
    'Retry is not supported for Wanxiang generation jobs'
  );
}

export function getProgressLabel(status: string) {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'submitting':
      return 'Starting';
    case 'running':
      return 'Generating';
    case 'succeeded':
      return 'Ready';
    case 'failed':
      return 'Failed';
    default:
      return 'Processing';
  }
}

function getNextPollMs(job: GenerationJobRecord) {
  if (
    job.status === 'succeeded' ||
    job.status === 'failed'
  ) {
    return null;
  }

  switch (job.status) {
    case 'queued':
      return 2_000;
    case 'submitting':
      return 5_000;
    default:
      return 10_000;
  }
}

async function getGenerationJobRecordForUser(jobId: string, userId: number) {
  const rows = await client`
    select
      id,
      user_id,
      generation_type,
      status,
      provider,
      provider_task_id,
      trigger_run_id,
      input_json,
      output_json,
      input_asset_id,
      output_asset_id,
      error_message,
      credit_reserved
    from generation_jobs
    where id = ${jobId}
      and user_id = ${userId}
    limit 1
  `;

  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapGenerationJobRow(row) : null;
}

async function getGenerationJobRecord(jobId: string) {
  const rows = await client`
    select
      id,
      user_id,
      generation_type,
      status,
      provider,
      provider_task_id,
      trigger_run_id,
      input_json,
      output_json,
      input_asset_id,
      output_asset_id,
      error_message,
      credit_reserved
    from generation_jobs
    where id = ${jobId}
    limit 1
  `;

  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapGenerationJobRow(row) : null;
}

async function markJobSubmitting(input: {
  jobId: string;
  triggerRunId?: string | null;
}) {
  const rows = await client`
    update generation_jobs
    set
      status = 'submitting',
      trigger_run_id = coalesce(${input.triggerRunId ?? null}, trigger_run_id),
      updated_at = now()
    where id = ${input.jobId}
      and status = 'queued'
    returning id
  `;

  return Boolean(rows[0]);
}

async function markStaleSubmitLeaseFailedAndRefund(input: {
  jobId: string;
  userId: number;
}) {
  return client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.userId})`;

    const rows = await sql`
      update generation_jobs
      set
        status = 'failed',
        error_message = 'Provider submit lease expired before a task id was recorded; refusing to resubmit.',
        updated_at = now()
      where id = ${input.jobId}
        and user_id = ${input.userId}
        and status = 'submitting'
        and provider_task_id is null
        and updated_at <= now() - (${PROVIDER_SUBMIT_LEASE_SECONDS}::text || ' seconds')::interval
      returning id
    `;

    if (!rows[0]) {
      return false;
    }

    await refundReservedCreditsInTransaction(
      {
        userId: input.userId,
        jobId: input.jobId,
        metadata: {
          reason:
            'Provider submit lease expired before a task id was recorded; refusing to resubmit.',
          source: 'generation_submit_lease_expired',
        },
      },
      sql
    );

    return true;
  });
}

async function markJobRunningWithProviderTask(input: {
  job: GenerationJobRecord;
  submitResult: WanxiangSubmitResult;
}) {
  await client`
    update generation_jobs
    set
      status = 'running',
      provider = ${input.submitResult.provider ?? DEFAULT_PROVIDER},
      provider_task_id = ${input.submitResult.providerTaskId},
      error_message = null,
      input_json = ${JSON.stringify({
        ...input.job.inputJson,
        providerSubmitRawResponse: input.submitResult.rawResponse,
      })}::jsonb,
      updated_at = now()
    where id = ${input.job.id}
      and status in ('submitting', 'running')
  `;

  const updatedJob = await getGenerationJobRecord(input.job.id);
  if (!updatedJob?.providerTaskId) {
    throw new GenerationApiError(
      502,
      'provider_task_id_missing',
      'Generation provider did not return a task id'
    );
  }

  return updatedJob;
}

async function markJobProviderStillRunning(input: {
  job: GenerationJobRecord;
  rawResponse?: unknown;
}) {
  await client`
    update generation_jobs
    set
      output_json = ${JSON.stringify({
        rawResponse: input.rawResponse,
      })}::jsonb,
      updated_at = now()
    where id = ${input.job.id}
      and status = 'running'
  `;
}

async function markJobWorkerErrorForRetry(input: {
  jobId: string;
  errorMessage: string;
}) {
  await client`
    update generation_jobs
    set
      error_message = ${input.errorMessage.slice(0, 2000)},
      updated_at = now()
    where id = ${input.jobId}
      and status in ('queued', 'submitting', 'running')
  `;
}

async function captureReservedCreditsInTransaction(
  input: {
    userId: number;
    jobId: string;
    metadata?: CreditLedgerMetadata;
  },
  sql: QueryableSql
) {
  const existingRows = await sql`
    select id
    from credit_ledger
    where user_id = ${input.userId}
      and job_id = ${input.jobId}
      and reason = 'capture'
    limit 1
  `;

  if (existingRows[0]) {
    return;
  }

  const refundRows = await sql`
    select id
    from credit_ledger
    where user_id = ${input.userId}
      and job_id = ${input.jobId}
      and reason = 'refund'
    limit 1
  `;

  if (refundRows[0]) {
    return;
  }

  const reserveRows = await sql`
    select delta
    from credit_ledger
    where user_id = ${input.userId}
      and job_id = ${input.jobId}
      and reason = 'reserve'
    order by created_at desc
    limit 1
  `;
  const reserve = reserveRows[0] as Record<string, unknown> | undefined;

  if (!reserve) {
    throw new Error(`No reserved credits found for job ${input.jobId}`);
  }

  const balanceRows = await sql`
    select credit_balance::integer as balance
    from users
    where id = ${input.userId}
    limit 1
  `;
  const balanceRow = balanceRows[0] as Record<string, unknown> | undefined;

  if (!balanceRow) {
    throw new Error(`User ${input.userId} not found`);
  }

  const balance = Number(balanceRow.balance ?? 0);
  const reservedCredits = Math.abs(Number(reserve.delta ?? 0));

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
      0,
      'capture',
      ${balance},
      ${JSON.stringify({
        reservedCredits,
        ...(input.metadata ?? {}),
      })}::jsonb,
      now()
    )
  `;

  await sql`
    update generation_jobs
    set
      credit_spent = ${reservedCredits},
      updated_at = now()
    where id = ${input.jobId}
      and user_id = ${input.userId}
  `;
}

async function refundReservedCreditsInTransaction(
  input: {
    userId: number;
    jobId: string;
    metadata?: CreditLedgerMetadata;
  },
  sql: QueryableSql
) {
  const existingRows = await sql`
    select id
    from credit_ledger
    where user_id = ${input.userId}
      and job_id = ${input.jobId}
      and reason = 'refund'
    limit 1
  `;

  if (existingRows[0]) {
    return;
  }

  const captureRows = await sql`
    select id
    from credit_ledger
    where user_id = ${input.userId}
      and job_id = ${input.jobId}
      and reason = 'capture'
    limit 1
  `;

  if (captureRows[0]) {
    return;
  }

  const reserveRows = await sql`
    select delta
    from credit_ledger
    where user_id = ${input.userId}
      and job_id = ${input.jobId}
      and reason = 'reserve'
    order by created_at desc
    limit 1
  `;
  const reserve = reserveRows[0] as Record<string, unknown> | undefined;

  if (!reserve) {
    throw new Error(`No reserved credits found for job ${input.jobId}`);
  }

  const balanceRows = await sql`
    select credit_balance::integer as balance
    from users
    where id = ${input.userId}
    limit 1
  `;
  const balanceRow = balanceRows[0] as Record<string, unknown> | undefined;

  if (!balanceRow) {
    throw new Error(`User ${input.userId} not found`);
  }

  const balance = Number(balanceRow.balance ?? 0);
  const refundCredits = Math.abs(Number(reserve.delta ?? 0));
  const balanceAfter = balance + refundCredits;

  await sql`
    update users
    set
      credit_balance = ${balanceAfter},
      updated_at = now()
    where id = ${input.userId}
  `;

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
      ${refundCredits},
      'refund',
      ${balanceAfter},
      ${JSON.stringify({
        reservedCredits: refundCredits,
        ...(input.metadata ?? {}),
      })}::jsonb,
      now()
    )
  `;
}

async function createProviderResultAsset(
  input: {
    userId: number;
    jobId: string;
    assetType: 'final_image' | 'final_video';
    publicUrl: string;
  },
  sql: QueryableSql = client
) {
  const assetId = randomUUID();
  const extension = input.assetType === 'final_image' ? 'image' : 'video';
  const storageKey = `provider-results/${input.userId}/${input.jobId}/${assetId}-${extension}`;

  const rows = await sql`
    insert into assets (
      id,
      user_id,
      type,
      status,
      storage_key,
      public_url,
      created_at,
      updated_at
    )
    values (
      ${assetId},
      ${input.userId},
      ${input.assetType},
      'uploaded',
      ${storageKey},
      ${input.publicUrl},
      now(),
      now()
    )
    returning id
  `;

  return toStringValue((rows[0] as Record<string, unknown>).id);
}

async function mapJobStatus(job: GenerationJobRecord): Promise<JobStatusRecord> {
  const rows = await client`
    select
      output_asset.public_url as output_url,
      output_asset.type as output_type,
      output_asset.mime_type as output_mime_type
    from generation_jobs
    left join assets output_asset
      on output_asset.id = generation_jobs.output_asset_id
    where generation_jobs.id = ${job.id}
    limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  const outputUrl = toNullableString(row?.output_url);
  const outputType = toNullableString(row?.output_type);
  const outputMimeType = toNullableString(row?.output_mime_type);
  const outputIsVideo =
    outputType === 'final_video' || outputMimeType?.startsWith('video/');
  const outputIsImage =
    outputType === 'final_image' || outputMimeType?.startsWith('image/');

  return {
    id: job.id,
    generationId: job.id,
    generationType: job.generationType,
    tryOnMode: getTryOnModeFromInput(job.inputJson),
    status: job.status,
    progressLabel: getProgressLabel(job.status),
    finalImageUrl: outputIsImage ? outputUrl : null,
    finalVideoUrl: outputIsVideo ? outputUrl : null,
    thumbnailUrl: null,
    outputJson: job.outputJson,
    errorMessage: job.errorMessage,
    nextPollMs: getNextPollMs(job),
  };
}

async function markJobSucceeded(input: {
  job: GenerationJobRecord;
  queryResult: WanxiangQueryResult;
}) {
  const outputJson = {
    ...(input.queryResult.outputJson ?? {}),
    rawResponse: input.queryResult.rawResponse,
  };
  const transitioned = await client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.job.userId})`;

    const transitionRows = await sql`
      update generation_jobs
      set
        status = 'succeeded',
        output_json = ${JSON.stringify(outputJson)}::jsonb,
        error_message = null,
        updated_at = now()
      where id = ${input.job.id}
        and user_id = ${input.job.userId}
        and status in ('submitting', 'running')
      returning id
    `;

    if (!transitionRows[0]) {
      return null;
    }

    const output =
      input.queryResult.videoUrl
        ? {
            assetType: 'final_video' as const,
            publicUrl: input.queryResult.videoUrl,
            source: 'generated_video' as const,
          }
        : input.queryResult.imageUrl
          ? {
              assetType: 'final_image' as const,
              publicUrl: input.queryResult.imageUrl,
              source: 'generated_image' as const,
            }
          : null;
    const outputAssetId = output
      ? await createProviderResultAsset(
          {
            userId: input.job.userId,
            jobId: input.job.id,
            assetType: output.assetType,
            publicUrl: output.publicUrl,
          },
          sql
        )
      : null;

    await sql`
      update generation_jobs
      set
        output_asset_id = ${outputAssetId},
        updated_at = now()
      where id = ${input.job.id}
        and user_id = ${input.job.userId}
        and status = 'succeeded'
    `;

    await captureReservedCreditsInTransaction(
      {
        userId: input.job.userId,
        jobId: input.job.id,
        metadata: {
          provider: input.job.provider,
          providerTaskId: input.job.providerTaskId,
          source: 'generation_status_succeeded',
        },
      },
      sql
    );

    return outputAssetId && output
      ? {
          outputAssetId,
          source: output.source,
        }
      : null;
  });

  if (!transitioned) {
    return;
  }

  try {
    await upsertUserMediaHistory({
      userId: input.job.userId,
      assetId: transitioned.outputAssetId,
      generationJobId: input.job.id,
      source: transitioned.source,
      generationType: input.job.generationType,
      role: 'output',
      usedCount: 0,
      lastUsedAt: null,
    });
  } catch (error) {
    console.error('Failed to record generated media history', error);
  }
}

async function markJobFailed(input: {
  job: GenerationJobRecord;
  errorMessage: string;
  rawResponse?: unknown;
}) {
  await client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.job.userId})`;

    const rows = await sql`
      update generation_jobs
      set
        status = 'failed',
        output_json = ${JSON.stringify({
          rawResponse: input.rawResponse,
        })}::jsonb,
        error_message = ${input.errorMessage},
        updated_at = now()
      where id = ${input.job.id}
        and user_id = ${input.job.userId}
        and status in ('queued', 'submitting', 'running')
      returning id
    `;

    if (!rows[0]) {
      return;
    }

    await refundReservedCreditsInTransaction(
      {
        userId: input.job.userId,
        jobId: input.job.id,
        metadata: {
          provider: input.job.provider,
          providerTaskId: input.job.providerTaskId,
          reason: input.errorMessage,
          source: 'generation_status_failed',
        },
      },
      sql
    );
  });
}

export async function runWanxiangGenerationJob(
  payload: { jobId: string },
  deps: {
    attemptNumber?: number;
    maxAttempts?: number;
    triggerRunId?: string | null;
  } = {}
) {
  const attemptNumber = Math.max(1, Number(deps.attemptNumber ?? 1));
  const maxAttempts = Math.max(
    attemptNumber,
    Number(deps.maxAttempts ?? attemptNumber)
  );
  let job = await getGenerationJobRecord(payload.jobId);
  let terminalProviderStatus: WanxiangQueryResult['status'] | null = null;

  if (!job) {
    throw new Error(`generation job not found: ${payload.jobId}`);
  }

  if (job.status === 'succeeded' || job.status === 'failed') {
    return {
      jobId: job.id,
      status: job.status,
      skipped: true,
    };
  }

  try {
    if (!job.providerTaskId) {
      const acquiredSubmitLease = await markJobSubmitting({
        jobId: job.id,
        triggerRunId: deps.triggerRunId,
      });

      if (!acquiredSubmitLease) {
        const failedStaleSubmit = await markStaleSubmitLeaseFailedAndRefund({
          jobId: job.id,
          userId: job.userId,
        });

        if (failedStaleSubmit) {
          return {
            jobId: job.id,
            status: 'failed' as const,
          };
        }

        return {
          jobId: job.id,
          status: 'running' as const,
        };
      }

      const generation = generationRequestSchema.parse(job.inputJson);
      const assetsById = await assertInputAssetsForUser(generation, job.userId);
      const modelCatalogAsset =
        generation.generationType === 'try_on' && generation.modelCatalogAssetId
          ? await getModelCatalogAsset({ id: generation.modelCatalogAssetId })
          : null;

      if (
        generation.generationType === 'try_on' &&
        generation.modelCatalogAssetId &&
        !modelCatalogAsset
      ) {
        throw new GenerationApiError(
          404,
          'model_catalog_asset_not_found',
          'Model catalog asset was not found'
        );
      }

      const submitResult = await submitWanxiangGeneration({
        generationType: generation.generationType,
        tryOnMode:
          generation.generationType === 'try_on' ? generation.tryOnMode : undefined,
        inputAssetUrls: buildProviderInputAssets(
          generation,
          assetsById,
          modelCatalogAsset
        ),
        inputJson: job.inputJson,
        metadata: {
          idempotencyKey: `generation:${job.id}`,
          jobId: job.id,
          userId: job.userId,
        },
      });

      job = await markJobRunningWithProviderTask({ job, submitResult });
    } else if (job.status !== 'running') {
      await client`
        update generation_jobs
        set
          status = 'running',
          updated_at = now()
        where id = ${job.id}
          and status in ('queued', 'submitting')
      `;
      job = (await getGenerationJobRecord(job.id)) ?? job;
    }

    if (!job.providerTaskId) {
      throw new GenerationApiError(
        502,
        'provider_task_id_missing',
        'Generation provider did not return a task id'
      );
    }

    const queryResult = await queryWanxiangGeneration({
      generationType: job.generationType,
      tryOnMode: getTryOnModeFromInput(job.inputJson),
      providerTaskId: job.providerTaskId,
    });

    if (queryResult.status === 'running') {
      await markJobProviderStillRunning({
        job,
        rawResponse: queryResult.rawResponse,
      });

      return {
        jobId: job.id,
        status: 'running' as const,
      };
    }

    terminalProviderStatus = queryResult.status;

    if (queryResult.status === 'succeeded') {
      await markJobSucceeded({ job, queryResult });
    } else {
      await markJobFailed({
        job,
        errorMessage: queryResult.errorMessage ?? 'Generation failed',
        rawResponse: queryResult.rawResponse,
      });
    }

    const updatedJob = await getGenerationJobRecord(job.id);
    return {
      jobId: job.id,
      status: updatedJob?.status ?? queryResult.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const latestJob = (await getGenerationJobRecord(payload.jobId)) ?? job;

    if (terminalProviderStatus) {
      await markJobWorkerErrorForRetry({
        jobId: latestJob.id,
        errorMessage,
      });
    } else if (attemptNumber >= maxAttempts) {
      await markJobFailed({
        job: latestJob,
        errorMessage,
      });
    } else {
      await markJobWorkerErrorForRetry({
        jobId: latestJob.id,
        errorMessage,
      });
    }

    throw error;
  }
}

export async function failWanxiangGenerationJob(jobId: string, errorMessage: string) {
  const job = await getGenerationJobRecord(jobId);

  if (!job || job.status === 'succeeded' || job.status === 'failed') {
    return;
  }

  await markJobFailed({
    job,
    errorMessage,
  });
}

export async function getGenerationJobForUser(jobId: string, userId: number) {
  const job = await getGenerationJobRecordForUser(jobId, userId);

  if (!job) {
    return null;
  }

  return mapJobStatus(job);
}
