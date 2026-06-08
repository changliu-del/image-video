import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import postgres from 'postgres';

const DEFAULT_SOURCE_ROOT = '/private/tmp/image-jpeg';
const TEMPLATE_TYPE = 'image_to_video';
const DEFAULT_OWNER_EMAIL = 'codex-admin@local.test';
const UUID_NAMESPACE = 'image-video-template-catalog-import-v1';
const R2_CONCURRENCY = 4;

const categoryMap = {
  '3c数码': 'electronics',
  '服饰': 'fashion',
  '家居': 'home',
  '家用电器': 'appliances',
  '美妆个护': 'beauty',
  '通用': 'common',
  '运动': 'sports',
} as const;

type SourceCategoryName = keyof typeof categoryMap;
type TemplateCategory = (typeof categoryMap)[SourceCategoryName];
type MediaMimeType = 'image/jpeg' | 'video/mp4';

type CliArgs = {
  sourceRoot: string;
  apply: boolean;
  replace: boolean;
  skipUpload: boolean;
  ownerEmail: string;
  ownerUserId?: number;
};

type SourceFileSet = {
  sourceCategoryName: SourceCategoryName;
  category: TemplateCategory;
  baseName: string;
  jpgPath?: string;
  mp4Path?: string;
  txtPath?: string;
};

type TemplateImportItem = {
  id: string;
  title: string;
  titleTranslations: Record<string, string>;
  category: TemplateCategory;
  sourceCategoryName: SourceCategoryName;
  baseName: string;
  thumbnailAsset: ImportAsset;
  previewAsset: ImportAsset;
  prompt: string;
  promptTranslations: Record<string, string>;
  sortOrder: number;
};

type ImportAsset = {
  id: string;
  storageKey: string;
  publicUrl: string;
  sourcePath: string;
  mimeType: MediaMimeType;
  sizeBytes: number;
};

type ScanIssue = {
  type: 'missing' | 'invalid_mime' | 'empty_prompt' | 'unknown_category' | 'unexpected_file';
  path: string;
  message: string;
};

type ScanResult = {
  sourceRoot: string;
  items: TemplateImportItem[];
  issues: ScanIssue[];
  hiddenIgnored: number;
  filesSeen: number;
};

type TemplateTranslation = {
  title?: Record<string, string>;
  prompt?: Record<string, string>;
};

type TemplateTranslationMap = Record<string, TemplateTranslation>;

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    sourceRoot: DEFAULT_SOURCE_ROOT,
    apply: false,
    replace: false,
    skipUpload: false,
    ownerEmail: DEFAULT_OWNER_EMAIL,
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
      args.sourceRoot = next;
      i += 1;
      continue;
    }

    if (arg.startsWith('--source=')) {
      args.sourceRoot = arg.slice('--source='.length);
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

  args.sourceRoot = path.resolve(args.sourceRoot);
  return args;
}

function parseOwnerUserId(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid --owner-user-id value: ${value}`);
  }

  return parsed;
}

function printUsage() {
  console.log(`Usage:
  pnpm templates:import
  pnpm templates:import -- --apply
  pnpm templates:import -- --apply --replace

Options:
  --source <path>         Source catalog root. Default: ${DEFAULT_SOURCE_ROOT}
  --apply                 Upload media to R2 and write DB rows.
  --dry-run               Scan only. This is the default.
  --replace               With --apply, delete existing image_to_video templates first.
  --skip-upload           With --apply, skip R2 upload and only write DB rows.
  --owner-email <email>   Asset owner lookup email. Default: ${DEFAULT_OWNER_EMAIL}
  --owner-user-id <id>    Asset owner user id. Overrides --owner-email.
`);
}

function deterministicUuid(value: string) {
  const bytes = Uint8Array.from(
    createHash('sha1').update(UUID_NAMESPACE).update(':').update(value).digest()
  ).slice(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20)}`;
}

function isKnownCategoryName(name: string): name is SourceCategoryName {
  return Object.prototype.hasOwnProperty.call(categoryMap, name);
}

function storageKeyFor(templateId: string, assetId: string, mimeType: MediaMimeType) {
  const extension = mimeType === 'image/jpeg' ? 'jpg' : 'mp4';
  return `templates/${templateId}/${assetId}.${extension}`;
}

function publicUrlFor(storageKey: string, publicBaseUrl: string) {
  return `${publicBaseUrl.replace(/\/+$/, '')}/${storageKey}`;
}

async function loadTemplateTranslations(): Promise<TemplateTranslationMap> {
  const translationsPath = path.join(
    process.cwd(),
    'scripts/template-catalog-translations.json'
  );

  try {
    const raw = await fs.readFile(translationsPath, 'utf8');
    return JSON.parse(raw) as TemplateTranslationMap;
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return {};
    }

    throw error;
  }
}

async function detectMimeType(filePath: string): Promise<MediaMimeType | null> {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const header = buffer.subarray(0, bytesRead);

    if (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
      return 'image/jpeg';
    }

    if (header.length >= 12 && header.subarray(4, 8).toString('ascii') === 'ftyp') {
      return 'video/mp4';
    }

    return null;
  } finally {
    await handle.close();
  }
}

async function scanTemplateCatalog(sourceRoot: string): Promise<ScanResult> {
  const issues: ScanIssue[] = [];
  const groups: SourceFileSet[] = [];
  const translations = await loadTemplateTranslations();
  let hiddenIgnored = 0;
  let filesSeen = 0;

  const rootEntries = await fs.readdir(sourceRoot, { withFileTypes: true });

  for (const rootEntry of rootEntries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (rootEntry.name.startsWith('.')) {
      hiddenIgnored += 1;
      continue;
    }

    const categoryPath = path.join(sourceRoot, rootEntry.name);
    if (!rootEntry.isDirectory()) {
      issues.push({
        type: 'unexpected_file',
        path: categoryPath,
        message: 'Only category directories are expected at the source root.',
      });
      continue;
    }

    if (!isKnownCategoryName(rootEntry.name)) {
      issues.push({
        type: 'unknown_category',
        path: categoryPath,
        message: 'Directory is not mapped to a template category.',
      });
      continue;
    }

    const category = categoryMap[rootEntry.name];
    const fileGroups = new Map<string, SourceFileSet>();
    const categoryEntries = await fs.readdir(categoryPath, { withFileTypes: true });

    for (const entry of categoryEntries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) {
        hiddenIgnored += 1;
        continue;
      }

      const filePath = path.join(categoryPath, entry.name);
      if (!entry.isFile()) {
        issues.push({
          type: 'unexpected_file',
          path: filePath,
          message: 'Only files are expected inside category directories.',
        });
        continue;
      }

      filesSeen += 1;
      const extension = path.extname(entry.name).toLowerCase();
      const baseName = path.basename(entry.name, path.extname(entry.name));
      const group =
        fileGroups.get(baseName) ??
        ({
          sourceCategoryName: rootEntry.name,
          category,
          baseName,
        } satisfies SourceFileSet);

      if (extension === '.jpg') {
        group.jpgPath = filePath;
      } else if (extension === '.mp4') {
        group.mp4Path = filePath;
      } else if (extension === '.txt') {
        group.txtPath = filePath;
      } else {
        issues.push({
          type: 'unexpected_file',
          path: filePath,
          message: 'Only .jpg, .mp4, and .txt template files are supported.',
        });
      }

      fileGroups.set(baseName, group);
    }

    groups.push(...Array.from(fileGroups.values()));
  }

  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL ?? 'https://example.invalid';
  const items: TemplateImportItem[] = [];
  const sortOrderByCategory = new Map<TemplateCategory, number>();

  for (const group of groups.sort((a, b) =>
    `${a.category}:${a.baseName}`.localeCompare(`${b.category}:${b.baseName}`)
  )) {
    const missing = [
      group.jpgPath ? null : '.jpg',
      group.mp4Path ? null : '.mp4',
      group.txtPath ? null : '.txt',
    ].filter(Boolean);

    if (missing.length > 0) {
      issues.push({
        type: 'missing',
        path: path.join(sourceRoot, group.sourceCategoryName, group.baseName),
        message: `Missing required file(s): ${missing.join(', ')}`,
      });
      continue;
    }

    const jpgPath = group.jpgPath!;
    const mp4Path = group.mp4Path!;
    const txtPath = group.txtPath!;
    const [thumbnailMimeType, previewMimeType, jpgStat, mp4Stat, promptRaw] =
      await Promise.all([
        detectMimeType(jpgPath),
        detectMimeType(mp4Path),
        fs.stat(jpgPath),
        fs.stat(mp4Path),
        fs.readFile(txtPath, 'utf8'),
      ]);

    if (thumbnailMimeType !== 'image/jpeg') {
      issues.push({
        type: 'invalid_mime',
        path: jpgPath,
        message: `Expected image/jpeg but detected ${thumbnailMimeType ?? 'unknown'}.`,
      });
      continue;
    }

    if (previewMimeType !== 'video/mp4') {
      issues.push({
        type: 'invalid_mime',
        path: mp4Path,
        message: `Expected video/mp4 but detected ${previewMimeType ?? 'unknown'}.`,
      });
      continue;
    }

    const prompt = promptRaw.trim();
    if (!prompt) {
      issues.push({
        type: 'empty_prompt',
        path: txtPath,
        message: 'Prompt text is empty after trimming.',
      });
      continue;
    }

    const seed = `${group.sourceCategoryName}:${group.category}:${group.baseName}`;
    const sourceKey = `${group.sourceCategoryName}/${group.baseName}`;
    const translation = translations[sourceKey] ?? {};
    const templateId = deterministicUuid(`template:${seed}`);
    const thumbnailAssetId = deterministicUuid(`asset:thumbnail:${seed}`);
    const previewAssetId = deterministicUuid(`asset:preview:${seed}`);
    const thumbnailStorageKey = storageKeyFor(
      templateId,
      thumbnailAssetId,
      'image/jpeg'
    );
    const previewStorageKey = storageKeyFor(templateId, previewAssetId, 'video/mp4');
    const sortOrder = (sortOrderByCategory.get(group.category) ?? 0) + 1;
    sortOrderByCategory.set(group.category, sortOrder);

    items.push({
      id: templateId,
      title: group.baseName,
      titleTranslations: translation.title ?? {},
      category: group.category,
      sourceCategoryName: group.sourceCategoryName,
      baseName: group.baseName,
      prompt,
      promptTranslations: translation.prompt ?? {},
      sortOrder,
      thumbnailAsset: {
        id: thumbnailAssetId,
        storageKey: thumbnailStorageKey,
        publicUrl: publicUrlFor(thumbnailStorageKey, publicBaseUrl),
        sourcePath: jpgPath,
        mimeType: 'image/jpeg',
        sizeBytes: jpgStat.size,
      },
      previewAsset: {
        id: previewAssetId,
        storageKey: previewStorageKey,
        publicUrl: publicUrlFor(previewStorageKey, publicBaseUrl),
        sourcePath: mp4Path,
        mimeType: 'video/mp4',
        sizeBytes: mp4Stat.size,
      },
    });
  }

  return {
    sourceRoot,
    items,
    issues,
    hiddenIgnored,
    filesSeen,
  };
}

function summarizeByCategory(items: TemplateImportItem[]) {
  const counts = new Map<TemplateCategory, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function printScanSummary(result: ScanResult, args: CliArgs) {
  const thumbnailCount = result.items.length;
  const previewCount = result.items.length;
  const titleTranslationCount = result.items.filter(
    (item) => Object.keys(item.titleTranslations).length > 0
  ).length;
  const promptTranslationCount = result.items.filter(
    (item) => Object.keys(item.promptTranslations).length > 0
  ).length;

  console.log('Template catalog import check');
  console.log(`Source: ${result.sourceRoot}`);
  console.log(`Mode: ${args.apply ? 'apply' : 'dry-run'}`);
  console.log(`Replace existing image_to_video templates: ${args.replace ? 'yes' : 'no'}`);
  console.log(`Skip R2 upload: ${args.skipUpload ? 'yes' : 'no'}`);
  console.log(`Files seen: ${result.filesSeen}`);
  console.log(`Hidden files ignored: ${result.hiddenIgnored}`);
  console.log(`Templates ready: ${result.items.length}`);
  console.log(`Title translations ready: ${titleTranslationCount}`);
  console.log(`Prompt translations ready: ${promptTranslationCount}`);
  console.log(`Assets ready: ${thumbnailCount + previewCount} (${thumbnailCount} jpg, ${previewCount} mp4)`);
  console.log('Categories:');

  for (const [category, count] of summarizeByCategory(result.items)) {
    const sourceName = Object.entries(categoryMap).find(([, value]) => value === category)?.[0];
    console.log(`  - ${category}${sourceName ? ` (${sourceName})` : ''}: ${count}`);
  }

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

async function ensureFinalTemplateSchema(sql: postgres.Sql) {
  const templateColumns = await sql<{ column_name: string }[]>`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'templates'
  `;
  const assetColumns = await sql<{ column_name: string }[]>`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assets'
  `;

  const templateColumnNames = new Set(templateColumns.map((row) => row.column_name));
  const assetColumnNames = new Set(assetColumns.map((row) => row.column_name));
  const requiredTemplateColumns = [
    'id',
    'type',
    'title',
    'title_translations_json',
    'category',
    'thumbnail_asset_id',
    'preview_asset_id',
    'prompt',
    'prompt_translations_json',
    'sort_order',
    'created_at',
    'updated_at',
  ];
  const requiredAssetColumns = [
    'id',
    'user_id',
    'type',
    'status',
    'storage_key',
    'public_url',
    'mime_type',
    'size_bytes',
    'created_at',
    'updated_at',
  ];
  const missingTemplateColumns = requiredTemplateColumns.filter(
    (column) => !templateColumnNames.has(column)
  );
  const missingAssetColumns = requiredAssetColumns.filter(
    (column) => !assetColumnNames.has(column)
  );
  const legacyTemplateColumns = ['thumbnail_url', 'preview_url'].filter((column) =>
    templateColumnNames.has(column)
  );

  if (
    missingTemplateColumns.length > 0 ||
    missingAssetColumns.length > 0 ||
    legacyTemplateColumns.length > 0
  ) {
    throw new Error(
      [
        'Target database is not on the final asset-backed template schema.',
        missingTemplateColumns.length
          ? `Missing templates columns: ${missingTemplateColumns.join(', ')}`
          : null,
        missingAssetColumns.length
          ? `Missing assets columns: ${missingAssetColumns.join(', ')}`
          : null,
        legacyTemplateColumns.length
          ? `Legacy templates columns still present: ${legacyTemplateColumns.join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join(' ')
    );
  }
}

async function resolveOwnerUserId(sql: postgres.Sql, args: CliArgs) {
  if (args.ownerUserId) {
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

  for (const item of result.items) {
    item.thumbnailAsset.publicUrl = publicUrlFor(
      item.thumbnailAsset.storageKey,
      r2Config.publicBaseUrl
    );
    item.previewAsset.publicUrl = publicUrlFor(item.previewAsset.storageKey, r2Config.publicBaseUrl);
  }

  const sql = postgres(postgresUrl, { max: 3 });
  try {
    await ensureFinalTemplateSchema(sql);
    const ownerUserId = await resolveOwnerUserId(sql, args);
    const r2Client = createR2Client(r2Config);
    const assetsToUpload = result.items.flatMap((item) => [
      item.thumbnailAsset,
      item.previewAsset,
    ]);

    if (args.skipUpload) {
      console.log(`Skipping R2 upload for ${assetsToUpload.length} existing objects...`);
    } else {
      console.log(`Uploading ${assetsToUpload.length} R2 objects...`);
      await runWithConcurrency(assetsToUpload, R2_CONCURRENCY, (asset) =>
        uploadAsset(r2Client, r2Config.bucket, asset)
      );
    }

    const now = new Date();
    const assetRows = assetsToUpload.map((asset) => ({
      id: asset.id,
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
    const templateRows = result.items.map((item) => ({
      id: item.id,
      type: TEMPLATE_TYPE,
      title: item.title,
      title_translations_json: item.titleTranslations,
      category: item.category,
      thumbnail_asset_id: item.thumbnailAsset.id,
      preview_asset_id: item.previewAsset.id,
      prompt: item.prompt,
      prompt_translations_json: item.promptTranslations,
      sort_order: item.sortOrder,
      created_at: now,
      updated_at: now,
    }));

    await sql.begin(async (tx) => {
      if (args.replace) {
        await tx`
          delete from templates
          where type = ${TEMPLATE_TYPE}
        `;
      }

      await tx`
        insert into assets ${tx(
          assetRows,
          'id',
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
        on conflict (id) do update set
          user_id = excluded.user_id,
          type = excluded.type,
          status = excluded.status,
          storage_key = excluded.storage_key,
          public_url = excluded.public_url,
          mime_type = excluded.mime_type,
          size_bytes = excluded.size_bytes,
          updated_at = current_timestamp
      `;

      await tx`
        insert into templates ${tx(
          templateRows,
          'id',
          'type',
          'title',
          'title_translations_json',
          'category',
          'thumbnail_asset_id',
          'preview_asset_id',
          'prompt',
          'prompt_translations_json',
          'sort_order',
          'created_at',
          'updated_at'
        )}
        on conflict (id) do update set
          type = excluded.type,
          title = excluded.title,
          title_translations_json = excluded.title_translations_json,
          category = excluded.category,
          thumbnail_asset_id = excluded.thumbnail_asset_id,
          preview_asset_id = excluded.preview_asset_id,
          prompt = excluded.prompt,
          prompt_translations_json = excluded.prompt_translations_json,
          updated_at = current_timestamp
      `;
    });

    console.log(
      `Applied import: ${templateRows.length} templates and ${assetRows.length} assets.`
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  dotenv.config();
  const result = await scanTemplateCatalog(args.sourceRoot);
  printScanSummary(result, args);

  if (result.issues.length > 0) {
    throw new Error('Template catalog scan found issues. Fix them before import.');
  }

  if (args.apply) {
    await applyImport(result, args);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
