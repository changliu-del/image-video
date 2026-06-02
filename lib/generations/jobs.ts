import 'server-only';

import { randomUUID } from 'crypto';

import {
  captureReservedCredits,
  refundReservedCredits,
} from '@/lib/credits';
import { client } from '@/lib/db/drizzle';
import { getGenerationLimitViolation } from '@/lib/generations/limits';
import {
  getCreditCostForGeneration,
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

const DEFAULT_PROVIDER = 'wanxiang';

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
  tryOnMode: TryOnMode | null;
  status: 'running' | 'succeeded' | 'failed';
  provider: string;
  providerTaskId: string;
  inputJson: Record<string, unknown>;
  outputJson: Record<string, unknown> | null;
  inputAssetId: string;
  finalImageAssetId: string | null;
  finalVideoAssetId: string | null;
  errorMessage: string | null;
  creditReserved: number;
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
    tryOnMode: toNullableString(row.try_on_mode) as TryOnMode | null,
    status: toStringValue(row.status) as GenerationJobRecord['status'],
    provider: toStringValue(row.provider),
    providerTaskId: toStringValue(row.provider_task_id),
    inputJson: toJsonObject(row.input_json),
    outputJson: row.output_json == null ? null : toJsonObject(row.output_json),
    inputAssetId: toStringValue(row.input_asset_id),
    finalImageAssetId: toNullableString(row.final_image_asset_id),
    finalVideoAssetId: toNullableString(row.final_video_asset_id),
    errorMessage: toNullableString(row.error_message),
    creditReserved: Number(row.credit_reserved ?? 0),
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

async function assertInputAssetsForUser(
  generation: GenerationRequest,
  userId: number
) {
  const assets = new Map<string, AssetRecord>();

  for (const assetId of getInputAssetIds(generation)) {
    const asset = await getAssetForUser(assetId, userId);

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

async function assertUserCanCreateGeneration(input: {
  userId: number;
  generation: GenerationRequest;
  creditReserved: number;
}) {
  await client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.userId})`;

    const limitRows = await sql`
      select
        count(*) filter (where status = 'running')::integer as active_count,
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

async function createRunningGenerationJobWithCreditReservation(input: {
  jobId: string;
  userId: number;
  generation: GenerationRequest;
  provider: string;
  providerTaskId: string;
  inputJson: Record<string, unknown>;
  creditReserved: number;
}) {
  return client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.userId})`;

    const balanceRows = await sql`
      select credit_balance::integer as balance
      from users
      where id = ${input.userId}
      limit 1
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
        generation_type,
        try_on_mode,
        status,
        provider,
        provider_task_id,
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
        ${
          input.generation.generationType === 'try_on'
            ? input.generation.tryOnMode
            : null
        },
        'running',
        ${input.provider},
        ${input.providerTaskId},
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
          provider: input.provider,
          providerTaskId: input.providerTaskId,
          source: 'generation_create',
        })}::jsonb,
        now()
      )
    `;

    return createdJob;
  });
}

export async function createGenerationForUser(
  userId: number,
  generation: GenerationRequest
) {
  const creditReserved = getCreditCostForGeneration(generation);
  const assetsById = await assertInputAssetsForUser(generation, userId);
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

  await assertUserCanCreateGeneration({
    userId,
    generation,
    creditReserved,
  });

  const jobId = randomUUID();
  const inputJson = buildInputJson(generation);
  const submitResult = await submitWanxiangGeneration({
    generationType: generation.generationType,
    tryOnMode:
      generation.generationType === 'try_on' ? generation.tryOnMode : undefined,
    inputAssetUrls: buildProviderInputAssets(
      generation,
      assetsById,
      modelCatalogAsset
    ),
    inputJson,
    metadata: {
      jobId,
      userId,
    },
  });

  if (!submitResult.providerTaskId) {
    throw new GenerationApiError(
      502,
      'provider_task_id_missing',
      'Generation provider did not return a task id'
    );
  }

  const job = await createRunningGenerationJobWithCreditReservation({
    jobId,
    userId,
    generation,
    provider: submitResult.provider ?? DEFAULT_PROVIDER,
    providerTaskId: submitResult.providerTaskId,
    inputJson: {
      ...inputJson,
      providerSubmitRawResponse: submitResult.rawResponse,
    },
    creditReserved,
  });

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

async function getGenerationJobRecordForUser(jobId: string, userId: number) {
  const rows = await client`
    select
      id,
      user_id,
      generation_type,
      try_on_mode,
      status,
      provider,
      provider_task_id,
      input_json,
      output_json,
      input_asset_id,
      final_image_asset_id,
      final_video_asset_id,
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

async function createProviderResultAsset(input: {
  userId: number;
  jobId: string;
  assetType: 'final_image' | 'final_video';
  publicUrl: string;
}) {
  const assetId = randomUUID();
  const extension = input.assetType === 'final_image' ? 'image' : 'video';
  const storageKey = `provider-results/${input.userId}/${input.jobId}/${assetId}-${extension}`;

  const rows = await client`
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
      final_image.public_url as final_image_url,
      final_video.public_url as final_video_url
    from generation_jobs
    left join assets final_image
      on final_image.id = generation_jobs.final_image_asset_id
    left join assets final_video
      on final_video.id = generation_jobs.final_video_asset_id
    where generation_jobs.id = ${job.id}
    limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;

  return {
    id: job.id,
    generationId: job.id,
    generationType: job.generationType,
    tryOnMode: job.tryOnMode,
    status: job.status,
    progressLabel: getProgressLabel(job.status),
    finalImageUrl: toNullableString(row?.final_image_url),
    finalVideoUrl: toNullableString(row?.final_video_url),
    thumbnailUrl: null,
    outputJson: job.outputJson,
    errorMessage: job.errorMessage,
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
  const finalImageAssetId = input.queryResult.imageUrl
    ? await createProviderResultAsset({
        userId: input.job.userId,
        jobId: input.job.id,
        assetType: 'final_image',
        publicUrl: input.queryResult.imageUrl,
      })
    : null;
  const finalVideoAssetId = input.queryResult.videoUrl
    ? await createProviderResultAsset({
        userId: input.job.userId,
        jobId: input.job.id,
        assetType: 'final_video',
        publicUrl: input.queryResult.videoUrl,
      })
    : null;

  await client`
    update generation_jobs
    set
      status = 'succeeded',
      output_json = ${JSON.stringify(outputJson)}::jsonb,
      final_image_asset_id = ${finalImageAssetId},
      final_video_asset_id = ${finalVideoAssetId},
      error_message = null,
      completed_at = now(),
      updated_at = now()
    where id = ${input.job.id}
      and user_id = ${input.job.userId}
      and status = 'running'
  `;

  await captureReservedCredits({
    userId: input.job.userId,
    jobId: input.job.id,
    metadata: {
      provider: input.job.provider,
      providerTaskId: input.job.providerTaskId,
      source: 'generation_status_succeeded',
    },
  });
}

async function markJobFailed(input: {
  job: GenerationJobRecord;
  errorMessage: string;
  rawResponse?: unknown;
}) {
  await client`
    update generation_jobs
    set
      status = 'failed',
      output_json = ${JSON.stringify({
        rawResponse: input.rawResponse,
      })}::jsonb,
      error_message = ${input.errorMessage},
      completed_at = now(),
      updated_at = now()
    where id = ${input.job.id}
      and user_id = ${input.job.userId}
      and status = 'running'
  `;

  await refundReservedCredits({
    userId: input.job.userId,
    jobId: input.job.id,
    metadata: {
      provider: input.job.provider,
      providerTaskId: input.job.providerTaskId,
      reason: input.errorMessage,
      source: 'generation_status_failed',
    },
  });
}

export async function getGenerationJobForUser(jobId: string, userId: number) {
  const job = await getGenerationJobRecordForUser(jobId, userId);

  if (!job) {
    return null;
  }

  if (job.status !== 'running') {
    return mapJobStatus(job);
  }

  const queryResult = await queryWanxiangGeneration({
    generationType: job.generationType,
    tryOnMode: job.tryOnMode,
    providerTaskId: job.providerTaskId,
  });

  if (queryResult.status === 'running') {
    return mapJobStatus(job);
  }

  if (queryResult.status === 'succeeded') {
    await markJobSucceeded({ job, queryResult });
  } else {
    await markJobFailed({
      job,
      errorMessage: queryResult.errorMessage ?? 'Generation failed',
      rawResponse: queryResult.rawResponse,
    });
  }

  const updatedJob = await getGenerationJobRecordForUser(jobId, userId);
  return updatedJob ? mapJobStatus(updatedJob) : null;
}
