import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import postgres from 'postgres';
import {
  buildModelTemplateLocalization,
  stripModelAgePrefix,
} from '../lib/model-assets/localization';
import { buildTemplateMediaUrl } from '../lib/templates/media-url';

const DEFAULT_SOURCE =
  '/Users/changliu/workspace/src/github.com/image-video/.tmp/wanxiang-models-europe-usa-20260609/models-europe-us.json';
const DEFAULT_OWNER_EMAIL = 'codex-admin@local.test';
const TEMPLATE_TYPE = 'model';
const R2_CONCURRENCY = 8;

type MediaMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

type CliArgs = {
  apply: boolean;
  ownerEmail: string;
  ownerUserId?: number;
  replace: boolean;
  skipUpload: boolean;
  source: string;
};

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

type CrawledWanxiangModel = {
  id: number | string;
  index?: number;
  name: string;
  age?: string;
  gender?: string;
  area?: string;
  style?: string;
  expression?: string;
  hairStyle?: string;
  featureText?: string;
  detailText?: string;
  prompt?: string;
  thumbnailUrl?: string;
  detailImageUrl?: string;
  coverUrl?: string;
  avatarUrl?: string;
  refUrl?: string;
  isNew?: boolean;
  favorite?: boolean;
  external?: boolean;
  localThumbnailPath?: string;
  localDetailImagePath?: string;
};

type CrawlFile = {
  counts?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  models?: CrawledWanxiangModel[];
  sourceUrl?: string;
};

type ImportAsset = {
  mimeType: MediaMimeType;
  publicUrl: string;
  sizeBytes: number;
  sourcePath: string;
  storageKey: string;
};

type NormalizedModelImportItem = {
  category: string;
  detailAsset: ImportAsset;
  model: CrawledWanxiangModel;
  modelId: string;
  prompt: string;
  promptTranslations: Record<'pt', string>;
  sourceTitle: string;
  sortOrder: number;
  thumbnailAsset: ImportAsset;
  title: string;
  titleTranslations: Record<'pt', string>;
};

type ScanIssue = {
  message: string;
  path: string;
  type:
    | 'empty_name'
    | 'invalid_json'
    | 'invalid_media'
    | 'missing_file'
    | 'missing_id'
    | 'missing_models'
    | 'unexpected_media_type';
};

type ScanResult = {
  duplicateCount: number;
  issues: ScanIssue[];
  items: NormalizedModelImportItem[];
  rowsSeen: number;
  source: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    apply: false,
    ownerEmail: DEFAULT_OWNER_EMAIL,
    replace: false,
    skipUpload: false,
    source: DEFAULT_SOURCE,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--apply') {
      args.apply = true;
      continue;
    }

    if (arg === '--dry-run') {
      args.apply = false;
      continue;
    }

    if (arg === '--replace') {
      args.replace = true;
      continue;
    }

    if (arg === '--skip-upload') {
      args.skipUpload = true;
      continue;
    }

    if (arg === '--source' && next) {
      args.source = next;
      i += 1;
      continue;
    }

    if (arg.startsWith('--source=')) {
      args.source = arg.slice('--source='.length);
      continue;
    }

    if (arg === '--owner-email' && next) {
      args.ownerEmail = next;
      i += 1;
      continue;
    }

    if (arg.startsWith('--owner-email=')) {
      args.ownerEmail = arg.slice('--owner-email='.length);
      continue;
    }

    if (arg === '--owner-user-id' && next) {
      args.ownerUserId = parseOwnerUserId(next);
      i += 1;
      continue;
    }

    if (arg.startsWith('--owner-user-id=')) {
      args.ownerUserId = parseOwnerUserId(arg.slice('--owner-user-id='.length));
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  args.source = path.resolve(args.source);
  return args;
}

function parseOwnerUserId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid --owner-user-id value: ${value}`);
  }

  return parsed;
}

function printUsage() {
  console.log(`Usage:
  pnpm templates:import-wanxiang-models
  pnpm templates:import-wanxiang-models --apply
  pnpm templates:import-wanxiang-models --apply --replace

Options:
  --source <path>         Wanxiang model crawl JSON. Default: ${DEFAULT_SOURCE}
  --apply                 Upload media to R2 and write DB rows.
  --dry-run               Scan only. This is the default.
  --replace               Remove rows for model ids present in this source before import.
  --skip-upload           With --apply, skip R2 upload and only write DB rows.
  --owner-email <email>   Asset owner lookup email. Default: ${DEFAULT_OWNER_EMAIL}
  --owner-user-id <id>    Asset owner user id. Overrides --owner-email.
`);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function publicUrlFor(storageKey: string, publicBaseUrl: string) {
  return `${publicBaseUrl.replace(/\/+$/, '')}/${storageKey}`;
}

function templateStorageKey(modelId: string, assetKind: 'detail' | 'thumbnail', mimeType: MediaMimeType) {
  const extension =
    mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
  return `templates/models/${modelId}/${assetKind}.${extension}`;
}

async function detectImageMimeType(filePath: string): Promise<MediaMimeType | null> {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const header = buffer.subarray(0, bytesRead);

    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return 'image/jpeg';
    }

    if (
      header.length >= 12 &&
      header.subarray(0, 4).toString('ascii') === 'RIFF' &&
      header.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    if (
      header.length >= 8 &&
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47
    ) {
      return 'image/png';
    }

    return null;
  } finally {
    await handle.close();
  }
}

async function buildImportAsset(input: {
  assetKind: 'detail' | 'thumbnail';
  issues: ScanIssue[];
  modelId: string;
  sourcePath: string;
}) {
  const pathForIssue = `${input.sourcePath}`;
  if (!input.sourcePath) {
    input.issues.push({
      type: 'missing_file',
      path: pathForIssue,
      message: `${input.assetKind} local path is required.`,
    });
    return null;
  }

  let stat;
  try {
    stat = await fs.stat(input.sourcePath);
  } catch {
    input.issues.push({
      type: 'missing_file',
      path: pathForIssue,
      message: `${input.assetKind} image file does not exist.`,
    });
    return null;
  }

  if (!stat.isFile() || stat.size <= 0) {
    input.issues.push({
      type: 'invalid_media',
      path: pathForIssue,
      message: `${input.assetKind} image must be a non-empty file.`,
    });
    return null;
  }

  const mimeType = await detectImageMimeType(input.sourcePath);
  if (!mimeType) {
    input.issues.push({
      type: 'unexpected_media_type',
      path: pathForIssue,
      message: `${input.assetKind} image must be PNG, JPEG, or WebP.`,
    });
    return null;
  }

  return {
    mimeType,
    publicUrl: '',
    sizeBytes: stat.size,
    sourcePath: input.sourcePath,
    storageKey: templateStorageKey(input.modelId, input.assetKind, mimeType),
  } satisfies ImportAsset;
}

function buildModelCategory(model: CrawledWanxiangModel) {
  const parts = [
    readString(model.gender),
    readString(model.age),
    readString(model.expression),
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join('/');
  }

  return (
    [readString(model.area), readString(model.style)].filter(Boolean).join('/') ||
    'model'
  );
}

function buildDescription(model: CrawledWanxiangModel) {
  const detailText =
    readString(model.detailText) ||
    [
      `风格：${readString(model.style)}`,
      `特征：${readString(model.featureText)}`,
    ]
      .filter((line) => line.replace(/[：:]/g, '').trim())
      .join('\n');
  const prompt = readString(model.prompt);
  return [detailText, prompt].filter(Boolean).join('\n\n');
}

async function normalizeModel(input: {
  index: number;
  issues: ScanIssue[];
  model: CrawledWanxiangModel;
  source: string;
}) {
  const modelId = String(input.model.id ?? '').trim();
  const name = readString(input.model.name);
  const pathForIssue = `${input.source}#${input.index + 1}`;

  if (!modelId) {
    input.issues.push({
      type: 'missing_id',
      path: pathForIssue,
      message: 'Wanxiang model id is required.',
    });
    return null;
  }

  if (!name) {
    input.issues.push({
      type: 'empty_name',
      path: pathForIssue,
      message: 'Wanxiang model name is required.',
    });
    return null;
  }

  const title = stripModelAgePrefix(name);
  const thumbnailAsset = await buildImportAsset({
    assetKind: 'thumbnail',
    issues: input.issues,
    modelId,
    sourcePath: readString(input.model.localThumbnailPath),
  });
  const detailAsset = await buildImportAsset({
    assetKind: 'detail',
    issues: input.issues,
    modelId,
    sourcePath: readString(input.model.localDetailImagePath),
  });

  if (!thumbnailAsset || !detailAsset) return null;

  const sortOrder = Number(input.model.index ?? input.index + 1);
  const category = buildModelCategory(input.model);
  const prompt = buildDescription(input.model);
  const localization = buildModelTemplateLocalization({
    category,
    prompt,
    title,
  });
  const englishTitle = localization.titleTranslations.en;
  const englishPrompt = localization.promptTranslations.en;

  return {
    category,
    detailAsset,
    model: input.model,
    modelId,
    prompt: englishPrompt,
    promptTranslations: {
      pt: localization.promptTranslations.pt,
    },
    sourceTitle: name,
    sortOrder,
    thumbnailAsset,
    title: englishTitle,
    titleTranslations: {
      pt: localization.titleTranslations.pt,
    },
  } satisfies NormalizedModelImportItem;
}

async function scanWanxiangModels(args: CliArgs): Promise<ScanResult> {
  const issues: ScanIssue[] = [];
  let parsed: CrawlFile;

  try {
    parsed = JSON.parse(await fs.readFile(args.source, 'utf8')) as CrawlFile;
  } catch (error) {
    issues.push({
      type: 'invalid_json',
      path: args.source,
      message: error instanceof Error ? error.message : 'Invalid JSON.',
    });
    return {
      duplicateCount: 0,
      issues,
      items: [],
      rowsSeen: 0,
      source: args.source,
    };
  }

  if (!Array.isArray(parsed.models)) {
    issues.push({
      type: 'missing_models',
      path: args.source,
      message: 'Wanxiang model crawl JSON must contain a models array.',
    });
    return {
      duplicateCount: 0,
      issues,
      items: [],
      rowsSeen: 0,
      source: args.source,
    };
  }

  const itemsByKey = new Map<string, NormalizedModelImportItem>();
  let duplicateCount = 0;

  for (let index = 0; index < parsed.models.length; index += 1) {
    const item = await normalizeModel({
      index,
      issues,
      model: parsed.models[index],
      source: args.source,
    });
    if (!item) continue;

    const key = `${item.modelId}:${item.title}`;
    if (itemsByKey.has(key)) {
      duplicateCount += 1;
      continue;
    }

    itemsByKey.set(key, item);
  }

  const items = Array.from(itemsByKey.values()).sort(
    (left, right) => left.sortOrder - right.sortOrder
  );

  return {
    duplicateCount,
    issues,
    items,
    rowsSeen: parsed.models.length,
    source: args.source,
  };
}

function printScanSummary(result: ScanResult, args: CliArgs) {
  console.log('Wanxiang model import check');
  console.log(`Source: ${result.source}`);
  console.log(`Mode: ${args.apply ? 'apply' : 'dry-run'}`);
  console.log(`Replace source model rows: ${args.replace ? 'yes' : 'no'}`);
  console.log(`Skip R2 upload: ${args.skipUpload ? 'yes' : 'no'}`);
  console.log(`Rows seen: ${result.rowsSeen}`);
  console.log(`Model templates ready: ${result.items.length}`);
  console.log(`Template type: ${TEMPLATE_TYPE}`);
  console.log(
    `Template categories ready: ${new Set(result.items.map((item) => item.category)).size}`
  );
  console.log(`Image assets ready: ${result.items.length * 2}`);
  console.log(`Duplicates skipped: ${result.duplicateCount}`);

  if (result.issues.length === 0) {
    console.log('Issues: none');
  } else {
    console.log(`Issues: ${result.issues.length}`);
    for (const issue of result.issues) {
      console.log(`  - [${issue.type}] ${issue.path}: ${issue.message}`);
    }
  }

  if (!args.apply) {
    console.log('Dry-run only. Re-run with --apply to upload R2 objects and write DB rows.');
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is required for --apply.`);
  }

  return value;
}

function getR2Config(): R2Config {
  return {
    accountId: getRequiredEnv('R2_ACCOUNT_ID'),
    accessKeyId: getRequiredEnv('R2_ACCESS_KEY_ID'),
    secretAccessKey: getRequiredEnv('R2_SECRET_ACCESS_KEY'),
    bucket: getRequiredEnv('R2_BUCKET'),
    publicBaseUrl: getRequiredEnv('R2_PUBLIC_BASE_URL').replace(/\/+$/, ''),
  };
}

function createR2Client(config: R2Config) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      await worker(items[index], index);
    }
  });

  await Promise.all(workers);
}

async function uploadAsset(client: S3Client, bucket: string, asset: ImportAsset) {
  const body = await fs.readFile(asset.sourcePath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: asset.storageKey,
      Body: body,
      ContentType: asset.mimeType,
      ContentLength: asset.sizeBytes,
    })
  );
}

function uniqueAssets(items: NormalizedModelImportItem[]) {
  const assets = new Map<string, ImportAsset>();
  for (const item of items) {
    assets.set(item.thumbnailAsset.storageKey, item.thumbnailAsset);
    assets.set(item.detailAsset.storageKey, item.detailAsset);
  }

  return Array.from(assets.values()).sort((left, right) =>
    left.storageKey.localeCompare(right.storageKey)
  );
}

async function ensureImportSchema(sql: postgres.Sql) {
  const templateColumns = await sql<{ column_name: string }[]>`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'templates'
  `;
  const templateColumnNames = new Set(templateColumns.map((row) => row.column_name));
  const requiredTemplateColumns = [
    'id',
    'type',
    'title',
    'title_translations_json',
    'category',
    'thumbnail_asset_id',
    'preview_asset_id',
    'thumbnail_url',
    'preview_url',
    'thumbnail_mime_type',
    'preview_mime_type',
    'prompt',
    'prompt_translations_json',
    'sort_order',
    'created_at',
    'updated_at',
  ];
  const missingTemplateColumns = requiredTemplateColumns.filter(
    (column) => !templateColumnNames.has(column)
  );

  if (missingTemplateColumns.length > 0) {
    throw new Error(
      `Target database is not on the template media snapshot schema. Missing templates columns: ${missingTemplateColumns.join(
        ', '
      )}`
    );
  }

  const constraints = await sql<{ definition: string; name: string }[]>`
    select conname as name, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'templates'::regclass
      and conname = 'templates_type_check'
  `;
  const typeConstraint = constraints[0]?.definition ?? '';
  if (typeConstraint && !typeConstraint.includes("'model'")) {
    throw new Error(
      'templates_type_check does not allow model. Run pnpm db:migrate first.'
    );
  }
}

async function resolveOwnerUserId(sql: postgres.Sql, args: CliArgs) {
  if (args.ownerUserId !== undefined) {
    return args.ownerUserId;
  }

  const rows = await sql<{ id: number }[]>`
    select id
    from users
    where email = ${args.ownerEmail}
    limit 1
  `;

  if (!rows[0]) {
    throw new Error(
      `Asset owner user not found for ${args.ownerEmail}. Run pnpm db:seed or pass --owner-user-id.`
    );
  }

  return rows[0].id;
}

async function applyImport(result: ScanResult, args: CliArgs) {
  if (result.issues.length > 0) {
    throw new Error('Refusing to apply import while scan issues are present.');
  }

  dotenv.config();
  const postgresUrl = getRequiredEnv('POSTGRES_URL');
  const r2Config = getR2Config();
  for (const asset of uniqueAssets(result.items)) {
    asset.publicUrl = publicUrlFor(asset.storageKey, r2Config.publicBaseUrl);
  }

  const sql = postgres(postgresUrl, { max: 3 });
  try {
    await ensureImportSchema(sql);
    const ownerUserId = await resolveOwnerUserId(sql, args);
    const r2Client = createR2Client(r2Config);
    const assetRows = uniqueAssets(result.items);

    if (args.skipUpload) {
      console.log(`Skipping R2 upload for ${assetRows.length} model images...`);
    } else {
      console.log(`Uploading ${assetRows.length} model images to R2...`);
      await runWithConcurrency(assetRows, R2_CONCURRENCY, (asset) =>
        uploadAsset(r2Client, r2Config.bucket, asset)
      );
    }

    const now = new Date();
    const dbAssetRows = assetRows.map((asset) => ({
      user_id: ownerUserId,
      type: 'upload',
      status: 'uploaded',
      storage_key: asset.storageKey,
      public_url: asset.publicUrl,
      mime_type: asset.mimeType,
      size_bytes: asset.sizeBytes,
      created_at: now,
      updated_at: now,
    }));

    await sql.begin(async (tx) => {
      if (args.replace) {
        const titles = result.items.map((item) => item.title);
        if (titles.length > 0) {
          await tx`
            delete from templates
            where type = ${TEMPLATE_TYPE}
              and title in ${tx(titles)}
          `;
        }
      }

      if (dbAssetRows.length > 0) {
        await tx`
          insert into assets ${tx(
            dbAssetRows,
            'user_id',
            'type',
            'status',
            'storage_key',
            'public_url',
            'mime_type',
            'size_bytes',
            'created_at',
            'updated_at'
          )}
          on conflict (storage_key) do update set
            user_id = excluded.user_id,
            type = excluded.type,
            status = excluded.status,
            public_url = excluded.public_url,
            mime_type = excluded.mime_type,
            size_bytes = excluded.size_bytes,
            updated_at = current_timestamp
        `;
      }

      const assetKeys = dbAssetRows.map((asset) => asset.storage_key);
      const persistedAssets = assetKeys.length
        ? await tx<{ id: number; storage_key: string }[]>`
            select id, storage_key
            from assets
            where storage_key in ${tx(assetKeys)}
          `
        : [];
      const assetIdByStorageKey = new Map(
        persistedAssets.map((asset) => [asset.storage_key, asset.id])
      );

      for (const item of result.items) {
        const thumbnailAssetId = assetIdByStorageKey.get(
          item.thumbnailAsset.storageKey
        );
        const detailAssetId = assetIdByStorageKey.get(item.detailAsset.storageKey);
        if (thumbnailAssetId == null || detailAssetId == null) {
          throw new Error(`Missing imported asset id for model ${item.title}`);
        }

        const existingRows = args.replace
          ? []
          : await tx<{ id: number }[]>`
            select id
            from templates
            where type = ${TEMPLATE_TYPE}
              and (
                title = ${item.title}
                or title = ${item.sourceTitle}
                or thumbnail_asset_id = ${thumbnailAssetId}
                or preview_asset_id = ${detailAssetId}
              )
              limit 1
            `;
        const existingTemplate = existingRows[0];

        if (existingTemplate) {
          await tx`
            update templates
            set
              title = ${item.title},
              title_translations_json = ${JSON.stringify(item.titleTranslations)}::jsonb,
              category = ${item.category},
              thumbnail_asset_id = ${thumbnailAssetId},
              preview_asset_id = ${detailAssetId},
              thumbnail_url = ${buildTemplateMediaUrl(thumbnailAssetId)},
              preview_url = ${buildTemplateMediaUrl(detailAssetId)},
              thumbnail_mime_type = ${item.thumbnailAsset.mimeType},
              preview_mime_type = ${item.detailAsset.mimeType},
              prompt = ${item.prompt},
              prompt_translations_json = ${JSON.stringify(item.promptTranslations)}::jsonb,
              sort_order = ${item.sortOrder},
              updated_at = current_timestamp
            where id = ${existingTemplate.id}
          `;
        } else {
          await tx`
            insert into templates (
              type,
              title,
              title_translations_json,
              category,
              thumbnail_asset_id,
              preview_asset_id,
              thumbnail_url,
              preview_url,
              thumbnail_mime_type,
              preview_mime_type,
              prompt,
              prompt_translations_json,
              sort_order,
              created_at,
              updated_at
            )
            values (
              ${TEMPLATE_TYPE},
              ${item.title},
              ${JSON.stringify(item.titleTranslations)}::jsonb,
              ${item.category},
              ${thumbnailAssetId},
              ${detailAssetId},
              ${buildTemplateMediaUrl(thumbnailAssetId)},
              ${buildTemplateMediaUrl(detailAssetId)},
              ${item.thumbnailAsset.mimeType},
              ${item.detailAsset.mimeType},
              ${item.prompt},
              ${JSON.stringify(item.promptTranslations)}::jsonb,
              ${item.sortOrder},
              ${now},
              ${now}
            )
          `;
        }
      }

    });

    console.log(
      `Applied import: ${result.items.length} model templates and ${dbAssetRows.length} image assets.`
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await scanWanxiangModels(args);
  printScanSummary(result, args);

  if (result.issues.length > 0) {
    throw new Error('Wanxiang model scan found issues. Fix them before import.');
  }

  if (args.apply) {
    await applyImport(result, args);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
