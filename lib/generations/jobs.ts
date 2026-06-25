import type postgres from 'postgres';

import { client } from '@/lib/db/drizzle';
import { dbIdSequences, reserveDbId } from '@/lib/db/ids';
import { getGenerationLimitViolation } from '@/lib/generations/limits';
import {
  getCreditCostForGeneration,
  generationRequestSchema,
  type GenerationRequest,
  type GenerationType,
  type TryOnMode,
} from '@/lib/generations/validation';
import {
  getModelTemplate,
  type ModelTemplateItem,
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
import {
  buildPublicUrl,
  createSignedGetUrl,
  uploadObjectToR2,
} from '@/lib/storage/r2';
import { buildAssetMediaUrl } from '@/lib/assets/media-url';
import { upsertUserMediaHistory } from '@/lib/user-media/service';

const DEFAULT_PROVIDER = 'wanxiang';
const PROVIDER_SUBMIT_LEASE_SECONDS = 120;
const PROVIDER_SUBMIT_LEASE_EXPIRED_MESSAGE =
  'Provider submit lease expired before a task id was recorded; refusing to resubmit.';
const PROVIDER_RESULT_FETCH_TIMEOUT_MS = 120_000;
const MAX_PROVIDER_RESULT_SIZE_BYTES = 200 * 1024 * 1024;
type QueryableSql = postgres.Sql;

type TemplateType = 'image_to_video' | 'image_to_image' | 'try_on';

const TEMPLATE_TYPE_BY_GENERATION_TYPE: Partial<Record<
  GenerationType,
  TemplateType
>> = {
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

type ProviderResultAssetType = 'final_image' | 'final_video';

type ProviderResultSource = 'generated_image' | 'generated_video';

const PROVIDER_RESULT_MIME_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
} as const;

type ProviderResultMimeType = keyof typeof PROVIDER_RESULT_MIME_EXTENSIONS;

const PROVIDER_RESULT_EXTENSION_MIME_TYPES: Record<
  string,
  ProviderResultMimeType
> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  mp4: 'video/mp4',
  png: 'image/png',
  webm: 'video/webm',
  webp: 'image/webp',
};

type ProviderResultOutput = {
  assetType: ProviderResultAssetType;
  source: ProviderResultSource;
  providerUrl: string;
};

type UploadedProviderResult = ProviderResultOutput & {
  storageKey: string;
  publicUrl: string;
  mimeType: ProviderResultMimeType;
  sizeBytes: number;
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
  templateId: string | null;
  prompt: string | null;
  inputAssetId: string;
  inputAssetIds: string[];
  inputImageUrl: string | null;
  inputImageUrls: string[];
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getProviderResultOutput(
  queryResult: WanxiangQueryResult
): ProviderResultOutput | null {
  if (queryResult.videoUrl) {
    return {
      assetType: 'final_video',
      source: 'generated_video',
      providerUrl: queryResult.videoUrl,
    };
  }

  if (queryResult.imageUrl) {
    return {
      assetType: 'final_image',
      source: 'generated_image',
      providerUrl: queryResult.imageUrl,
    };
  }

  return null;
}

function isProviderResultMimeForAssetType(
  mimeType: ProviderResultMimeType,
  assetType: ProviderResultAssetType
) {
  return assetType === 'final_video'
    ? mimeType.startsWith('video/')
    : mimeType.startsWith('image/');
}

function normalizeProviderResultMimeType(
  mimeType: string | null | undefined
): ProviderResultMimeType | null {
  const normalized = mimeType?.split(';')[0]?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === 'image/jpg') {
    return 'image/jpeg';
  }

  return normalized in PROVIDER_RESULT_MIME_EXTENSIONS
    ? (normalized as ProviderResultMimeType)
    : null;
}

function inferProviderResultMimeTypeFromUrl(providerUrl: string) {
  try {
    const extension = new URL(providerUrl).pathname
      .split('.')
      .pop()
      ?.toLowerCase();

    return extension
      ? PROVIDER_RESULT_EXTENSION_MIME_TYPES[extension] ?? null
      : null;
  } catch {
    return null;
  }
}

function bytesEqual(
  body: Uint8Array,
  offset: number,
  bytes: readonly number[]
) {
  if (body.byteLength < offset + bytes.length) {
    return false;
  }

  return bytes.every((byte, index) => body[offset + index] === byte);
}

function sniffProviderResultMimeType(body: Uint8Array) {
  if (bytesEqual(body, 0, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg' as const;
  }

  if (bytesEqual(body, 0, [0x89, 0x50, 0x4e, 0x47])) {
    return 'image/png' as const;
  }

  if (
    bytesEqual(body, 0, [0x52, 0x49, 0x46, 0x46]) &&
    bytesEqual(body, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return 'image/webp' as const;
  }

  if (bytesEqual(body, 4, [0x66, 0x74, 0x79, 0x70])) {
    return 'video/mp4' as const;
  }

  if (bytesEqual(body, 0, [0x1a, 0x45, 0xdf, 0xa3])) {
    return 'video/webm' as const;
  }

  return null;
}

function inferProviderResultMimeType(input: {
  assetType: ProviderResultAssetType;
  providerUrl: string;
  responseContentType: string | null;
  body: Uint8Array;
}) {
  const candidates = [
    normalizeProviderResultMimeType(input.responseContentType),
    inferProviderResultMimeTypeFromUrl(input.providerUrl),
    sniffProviderResultMimeType(input.body),
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      isProviderResultMimeForAssetType(candidate, input.assetType)
    ) {
      return candidate;
    }
  }

  throw new GenerationApiError(
    415,
    'provider_result_mime_unsupported',
    'Provider result MIME type is not supported'
  );
}

function buildProviderResultStorageKey(input: {
  userId: number;
  jobId: string;
  assetType: ProviderResultAssetType;
  mimeType: ProviderResultMimeType;
}) {
  const extension = PROVIDER_RESULT_MIME_EXTENSIONS[input.mimeType];
  const filename =
    input.assetType === 'final_video' ? 'final-video' : 'final-image';

  return `users/${input.userId}/generated/${input.jobId}/${filename}.${extension}`;
}

function getTryOnModeFromInput(input: Record<string, unknown>) {
  const mode = input.tryOnMode ?? input.mode;
  return mode === 'single' || mode === 'multi' ? mode : null;
}

function getStringFromInput(
  input: Record<string, unknown>,
  key: string
) {
  const value = input[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function getInputAssetIdsFromJob(job: GenerationJobRecord) {
  const ids = Array.isArray(job.inputJson.inputAssetIds)
    ? job.inputJson.inputAssetIds.filter(
        (value): value is string => typeof value === 'string' && Boolean(value)
      )
    : [];

  return ids.length ? ids : [job.inputAssetId].filter(Boolean);
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
  assetId: number;
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

async function getGenerationInputAsset(
  assetId: string,
  userId: number
) {
  return getAssetForUser(assetId, userId);
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

  if (generation.generationType === 'image_to_video') {
    for (const assetId of generation.inputAssetIds ?? []) {
      ids.add(assetId);
    }
  }

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

async function resolveModelTemplateMediaUrl(
  modelTemplate: ModelTemplateItem | null | undefined
) {
  if (modelTemplate?.imageStorageKey) {
    return createSignedGetUrl({
      storageKey: modelTemplate.imageStorageKey,
      expiresInSeconds: 3600,
    });
  }

  return (
    modelTemplate?.imageUrl ??
    modelTemplate?.thumbnailUrl ??
    modelTemplate?.videoUrl ??
    null
  );
}

function buildProviderAssetUrl(asset: AssetRecord) {
  return createSignedGetUrl({
    storageKey: asset.storageKey,
    expiresInSeconds: 3600,
  });
}

async function buildProviderInputAssets(
  generation: GenerationRequest,
  assetsById: Map<string, AssetRecord>,
  modelTemplate?: ModelTemplateItem | null
): Promise<Record<string, string | string[]>> {
  switch (generation.generationType) {
    case 'image_to_video': {
      const inputImageUrls = await Promise.all(
        (generation.inputAssetIds ?? [generation.inputAssetId]).map((assetId) =>
          buildProviderAssetUrl(assetsById.get(assetId)!)
        )
      );

      return {
        inputImageUrl: inputImageUrls[0],
        ...(inputImageUrls.length > 1 ? { inputImageUrls } : {}),
      };
    }
    case 'apparel_image':
      return {
        inputImageUrl: await buildProviderAssetUrl(
          assetsById.get(generation.inputAssetId)!
        ),
      };
    case 'try_on':
      const modelMediaUrl =
        (await resolveModelTemplateMediaUrl(modelTemplate)) ??
        (generation.modelAssetId
          ? await buildProviderAssetUrl(assetsById.get(generation.modelAssetId)!)
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
        ...(modelTemplate?.videoUrl ? { modelVideoUrl: modelTemplate.videoUrl } : {}),
        garmentImageUrls: await Promise.all(
          generation.garmentAssetIds.map((assetId) =>
            buildProviderAssetUrl(assetsById.get(assetId)!)
          )
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

  if (!/^\d+$/.test(generation.templateId)) {
    throw new GenerationApiError(
      400,
      'invalid_template_id',
      'Template ID must be a non-negative integer'
    );
  }

  const expectedType =
    TEMPLATE_TYPE_BY_GENERATION_TYPE[generation.generationType];

  if (!expectedType) {
    throw new GenerationApiError(
      400,
      'template_type_unsupported',
      'Templates are not supported for this generation type'
    );
  }

  const rows = await client`
    select id, type
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

  const actualType = toStringValue(row.type) as TemplateType;

  if (actualType !== expectedType) {
    throw new GenerationApiError(
      400,
      'template_type_mismatch',
      'Template type does not match this generation type'
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
      userId
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
  jobId: number;
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
    const limitViolation = getGenerationLimitViolation({
      activeCount: Number(limitRow?.active_count ?? 0),
      dailyCount: Number(limitRow?.daily_count ?? 0),
      totalCount: Number(limitRow?.total_count ?? 0),
      creditBalance: currentBalance,
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
  const modelTemplate =
    generation.generationType === 'try_on' && generation.modelTemplateId
      ? await getModelTemplate({ id: generation.modelTemplateId })
      : null;

  if (
    generation.generationType === 'try_on' &&
    generation.modelTemplateId &&
    !modelTemplate
  ) {
    throw new GenerationApiError(
      404,
      'model_template_not_found',
      'Model template was not found'
    );
  }

  const jobId = await reserveDbId(dbIdSequences.generationJobs);
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
        error_message = ${PROVIDER_SUBMIT_LEASE_EXPIRED_MESSAGE},
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
          reason: PROVIDER_SUBMIT_LEASE_EXPIRED_MESSAGE,
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

async function downloadProviderResult(input: ProviderResultOutput) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    PROVIDER_RESULT_FETCH_TIMEOUT_MS
  );
  let response: Response;

  try {
    response = await fetch(input.providerUrl, {
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    throw new GenerationApiError(
      502,
      'provider_result_download_failed',
      `Failed to download provider result: ${getErrorMessage(error)}`
    );
  }

  if (!response.ok) {
    clearTimeout(timeout);
    throw new GenerationApiError(
      502,
      'provider_result_download_failed',
      `Failed to download provider result: HTTP ${response.status}`
    );
  }

  const contentLength = toNullableNumber(response.headers.get('content-length'));
  if (
    contentLength != null &&
    contentLength > MAX_PROVIDER_RESULT_SIZE_BYTES
  ) {
    clearTimeout(timeout);
    throw new GenerationApiError(
      413,
      'provider_result_too_large',
      'Provider result is too large to store'
    );
  }

  let body: Buffer;

  try {
    body = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    clearTimeout(timeout);
    throw new GenerationApiError(
      502,
      'provider_result_download_failed',
      `Failed to read provider result: ${getErrorMessage(error)}`
    );
  }
  clearTimeout(timeout);

  if (body.byteLength === 0) {
    throw new GenerationApiError(
      502,
      'provider_result_empty',
      'Provider result download was empty'
    );
  }

  if (body.byteLength > MAX_PROVIDER_RESULT_SIZE_BYTES) {
    throw new GenerationApiError(
      413,
      'provider_result_too_large',
      'Provider result is too large to store'
    );
  }

  return {
    body,
    mimeType: inferProviderResultMimeType({
      assetType: input.assetType,
      providerUrl: input.providerUrl,
      responseContentType: response.headers.get('content-type'),
      body,
    }),
    sizeBytes: body.byteLength,
  };
}

async function copyProviderResultToR2(input: {
  job: GenerationJobRecord;
  queryResult: WanxiangQueryResult;
}): Promise<UploadedProviderResult> {
  const output = getProviderResultOutput(input.queryResult);

  if (!output) {
    throw new GenerationApiError(
      502,
      'provider_result_missing',
      'Generation provider succeeded without a result URL'
    );
  }

  const downloaded = await downloadProviderResult(output);
  const storageKey = buildProviderResultStorageKey({
    userId: input.job.userId,
    jobId: input.job.id,
    assetType: output.assetType,
    mimeType: downloaded.mimeType,
  });

  try {
    const publicUrl = buildPublicUrl(storageKey);
    const uploadedPublicUrl = await uploadObjectToR2({
      storageKey,
      body: downloaded.body,
      mimeType: downloaded.mimeType,
    });

    return {
      ...output,
      storageKey,
      publicUrl: uploadedPublicUrl || publicUrl,
      mimeType: downloaded.mimeType,
      sizeBytes: downloaded.sizeBytes,
    };
  } catch (error) {
    throw new GenerationApiError(
      502,
      'provider_result_upload_failed',
      `Failed to upload provider result to R2: ${getErrorMessage(error)}`
    );
  }
}

function buildSucceededOutputJson(input: {
  queryResult: WanxiangQueryResult;
  output: UploadedProviderResult;
  outputAssetId: string;
}) {
  const outputMediaUrl = buildAssetMediaUrl(input.outputAssetId);

  return {
    ...(input.queryResult.outputJson ?? {}),
    finalImageUrl:
      input.output.assetType === 'final_image' ? outputMediaUrl : null,
    finalVideoUrl:
      input.output.assetType === 'final_video' ? outputMediaUrl : null,
    outputAssetId: input.outputAssetId,
    outputStorageKey: input.output.storageKey,
    outputMimeType: input.output.mimeType,
    outputSizeBytes: input.output.sizeBytes,
    rawResponse: input.queryResult.rawResponse,
  };
}

async function createProviderResultAsset(
  input: UploadedProviderResult & {
    userId: number;
    jobId: string;
  },
  sql: QueryableSql = client
) {
  const rows = await sql`
    insert into assets (
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
      ${input.userId},
      ${input.assetType},
      'uploaded',
      ${input.storageKey},
      ${input.publicUrl},
      ${input.mimeType},
      ${input.sizeBytes},
      now(),
      now()
    )
    on conflict (storage_key) do update
    set
      user_id = excluded.user_id,
      type = excluded.type,
      status = 'uploaded',
      public_url = excluded.public_url,
      mime_type = excluded.mime_type,
      size_bytes = excluded.size_bytes,
      updated_at = now()
    returning id
  `;

  return toStringValue((rows[0] as Record<string, unknown>).id);
}

async function mapJobStatus(job: GenerationJobRecord): Promise<JobStatusRecord> {
  const rows = await client`
    select
      input_asset.id as input_asset_id,
      input_asset.mime_type as input_mime_type,
      output_asset.id as output_asset_id,
      output_asset.type as output_type,
      output_asset.mime_type as output_mime_type
    from generation_jobs
    left join assets input_asset
      on input_asset.id = generation_jobs.input_asset_id
      and input_asset.user_id = generation_jobs.user_id
    left join assets output_asset
      on output_asset.id = generation_jobs.output_asset_id
    where generation_jobs.id = ${job.id}
    limit 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  const databaseInputAssetId =
    toNullableString(row?.input_asset_id) ?? job.inputAssetId;
  const inputMimeType = toNullableString(row?.input_mime_type);
  const inputIsImage = inputMimeType?.startsWith('image/') ?? false;
  const outputAssetId = toNullableString(row?.output_asset_id) ?? job.outputAssetId;
  const outputType = toNullableString(row?.output_type);
  const outputMimeType = toNullableString(row?.output_mime_type);
  const outputIsVideo =
    outputType === 'final_video' || outputMimeType?.startsWith('video/');
  const outputIsImage =
    outputType === 'final_image' || outputMimeType?.startsWith('image/');
  const inputAssetIds = getInputAssetIdsFromJob(job);
  const primaryInputAssetId = inputAssetIds[0] ?? databaseInputAssetId;
  const inputImageUrls =
    job.generationType === 'image_to_video'
      ? inputAssetIds.map((assetId) => buildAssetMediaUrl(assetId))
      : inputIsImage && databaseInputAssetId
        ? [buildAssetMediaUrl(databaseInputAssetId)]
        : [];

  return {
    id: job.id,
    generationId: job.id,
    generationType: job.generationType,
    tryOnMode: getTryOnModeFromInput(job.inputJson),
    templateId: getStringFromInput(job.inputJson, 'templateId'),
    prompt: getStringFromInput(job.inputJson, 'prompt'),
    inputAssetId: primaryInputAssetId,
    inputAssetIds,
    inputImageUrl: inputImageUrls[0] ?? null,
    inputImageUrls,
    status: job.status,
    progressLabel: getProgressLabel(job.status),
    finalImageUrl:
      outputIsImage && outputAssetId ? buildAssetMediaUrl(outputAssetId) : null,
    finalVideoUrl:
      outputIsVideo && outputAssetId ? buildAssetMediaUrl(outputAssetId) : null,
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
  const uploadedOutput = await copyProviderResultToR2(input);
  const transitioned = await client.begin(async (sql) => {
    await sql`select pg_advisory_xact_lock(${input.job.userId})`;

    const transitionRows = await sql`
      update generation_jobs
      set
        status = 'succeeded',
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

    const outputAssetId = await createProviderResultAsset(
      {
        ...uploadedOutput,
        userId: input.job.userId,
        jobId: input.job.id,
      },
      sql
    );
    const outputJson = buildSucceededOutputJson({
      queryResult: input.queryResult,
      output: uploadedOutput,
      outputAssetId,
    });

    await sql`
      update generation_jobs
      set
        output_asset_id = ${outputAssetId},
        output_json = ${JSON.stringify(outputJson)}::jsonb,
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

    return {
      outputAssetId,
      source: uploadedOutput.source,
    };
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

  if (!job) {
    throw new Error(`generation job not found: ${payload.jobId}`);
  }

  if (job.status === 'succeeded' || job.status === 'failed') {
    return {
      jobId: job.id,
      status: job.status,
      errorMessage: job.errorMessage,
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
            errorMessage: PROVIDER_SUBMIT_LEASE_EXPIRED_MESSAGE,
          };
        }

        return {
          jobId: job.id,
          status: 'running' as const,
        };
      }

      const generation = generationRequestSchema.parse(job.inputJson);
      const assetsById = await assertInputAssetsForUser(generation, job.userId);
      const modelTemplate =
        generation.generationType === 'try_on' && generation.modelTemplateId
          ? await getModelTemplate({ id: generation.modelTemplateId })
          : null;

      if (
        generation.generationType === 'try_on' &&
        generation.modelTemplateId &&
        !modelTemplate
      ) {
        throw new GenerationApiError(
          404,
          'model_template_not_found',
          'Model template was not found'
        );
      }

      const submitResult = await submitWanxiangGeneration({
        generationType: generation.generationType,
        tryOnMode:
          generation.generationType === 'try_on' ? generation.tryOnMode : undefined,
        inputAssetUrls: await buildProviderInputAssets(
          generation,
          assetsById,
          modelTemplate
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

    if (queryResult.status === 'succeeded') {
      await markJobSucceeded({ job, queryResult });
    } else {
      const errorMessage = queryResult.errorMessage ?? 'Generation failed';
      await markJobFailed({
        job,
        errorMessage,
        rawResponse: queryResult.rawResponse,
      });
      const updatedJob = await getGenerationJobRecord(job.id);
      return {
        jobId: job.id,
        status: updatedJob?.status ?? queryResult.status,
        errorMessage: updatedJob?.errorMessage ?? errorMessage,
      };
    }

    const updatedJob = await getGenerationJobRecord(job.id);
    return {
      jobId: job.id,
      status: updatedJob?.status ?? queryResult.status,
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const latestJob = (await getGenerationJobRecord(payload.jobId)) ?? job;

    if (attemptNumber >= maxAttempts) {
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
