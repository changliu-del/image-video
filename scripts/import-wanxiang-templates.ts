import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import postgres from 'postgres';
import { buildWanxiangTemplateLocalization } from './wanxiang-template-localization';
import { buildTemplateMediaUrl } from '../lib/templates/media-url';

const DEFAULT_SOURCE = '/private/tmp';
const DEFAULT_OWNER_EMAIL = 'codex-admin@local.test';
const EXTERNAL_STORAGE_PREFIX = 'external/wanxiang/';

type TemplateType = 'image_to_image' | 'try_on';
type SourceProduct = 'goods' | 'try_on';

type CliArgs = {
  apply: boolean;
  ownerEmail: string;
  ownerUserId?: number;
  replace: boolean;
  source: string;
};

type RawWanxiangTemplate = {
  category?: unknown;
  imageUrl?: unknown;
  prompt?: unknown;
  sourceProduct?: unknown;
  title?: unknown;
  type?: unknown;
};

type NormalizedWanxiangTemplate = {
  asset: ImportAsset;
  category: string;
  imageUrl: string;
  prompt: string;
  promptTranslations: Record<'pt', string>;
  sortOrder: number;
  sourceCategory: string;
  sourceFile: string;
  sourceProduct: SourceProduct;
  title: string;
  titleTranslations: Record<'pt', string>;
  type: TemplateType;
};

type ImportAsset = {
  mimeType: string;
  publicUrl: string;
  storageKey: string;
};

type ScanIssue = {
  message: string;
  path: string;
  type:
    | 'duplicate'
    | 'empty_image'
    | 'empty_prompt'
    | 'empty_title'
    | 'invalid_category'
    | 'invalid_json'
    | 'invalid_product'
    | 'invalid_url'
    | 'unexpected_file';
};

type ScanResult = {
  duplicateCount: number;
  files: string[];
  items: NormalizedWanxiangTemplate[];
  issues: ScanIssue[];
  rowsSeen: number;
  source: string;
};

const categoryMap: Record<
  string,
  { sourceProduct: SourceProduct; slug: string; type: TemplateType }
> = {
  展台橱窗: {
    sourceProduct: 'goods',
    slug: 'goods_display_window',
    type: 'image_to_image',
  },
  自然景观: {
    sourceProduct: 'goods',
    slug: 'goods_nature',
    type: 'image_to_image',
  },
  节日氛围: {
    sourceProduct: 'goods',
    slug: 'goods_festival',
    type: 'image_to_image',
  },
  人文建筑: {
    sourceProduct: 'goods',
    slug: 'goods_architecture',
    type: 'image_to_image',
  },
  抽象概念: {
    sourceProduct: 'goods',
    slug: 'goods_abstract',
    type: 'image_to_image',
  },
  室内空间: {
    sourceProduct: 'goods',
    slug: 'goods_interior',
    type: 'image_to_image',
  },
  纯色背景: {
    sourceProduct: 'try_on',
    slug: 'tryon_solid_background',
    type: 'try_on',
  },
  户外商拍: {
    sourceProduct: 'try_on',
    slug: 'tryon_outdoor_commercial',
    type: 'try_on',
  },
  室内商拍: {
    sourceProduct: 'try_on',
    slug: 'tryon_indoor_commercial',
    type: 'try_on',
  },
  户外随拍: {
    sourceProduct: 'try_on',
    slug: 'tryon_outdoor_casual',
    type: 'try_on',
  },
  室内随拍: {
    sourceProduct: 'try_on',
    slug: 'tryon_indoor_casual',
    type: 'try_on',
  },
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    apply: false,
    ownerEmail: DEFAULT_OWNER_EMAIL,
    replace: false,
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
  pnpm templates:import-wanxiang
  pnpm templates:import-wanxiang --apply
  pnpm templates:import-wanxiang --apply --replace

Options:
  --source <path>         JSON file or directory. Default: ${DEFAULT_SOURCE}
  --apply                 Write DB rows.
  --dry-run               Scan only. This is the default.
  --replace               Delete prior external Wanxiang templates first.
  --owner-email <email>   Asset owner lookup email. Default: ${DEFAULT_OWNER_EMAIL}
  --owner-user-id <id>    Asset owner user id. Overrides --owner-email.
`);
}

function shortHash(value: string) {
  return createHash('sha1').update(value).digest('hex').slice(0, 16);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null;
  }

  url.hash = '';
  return url.toString();
}

function mimeTypeForUrl(imageUrl: string) {
  let extension = 'png';
  try {
    extension = path.extname(new URL(imageUrl).pathname).toLowerCase().slice(1);
  } catch {
    extension = 'png';
  }

  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'gif') return 'image/gif';
  return 'image/png';
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'png';
}

function normalizeSourceProduct(raw: RawWanxiangTemplate): SourceProduct | null {
  const sourceProduct = readString(raw.sourceProduct);
  const type = readString(raw.type);

  if (sourceProduct === 'goods' || type === 'image_to_image') {
    return 'goods';
  }

  if (sourceProduct === 'try_on' || type === 'try_on') {
    return 'try_on';
  }

  return null;
}

async function listSourceFiles(source: string) {
  const stat = await fs.stat(source);
  if (stat.isFile()) return [source];
  if (!stat.isDirectory()) {
    throw new Error(`Source must be a JSON file or directory: ${source}`);
  }

  const entries = await fs.readdir(source, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(source, entry.name))
    .filter((filePath) =>
      /^wanxiang-(goods|tryon)-.+\.json$/.test(path.basename(filePath))
    )
    .sort((left, right) => left.localeCompare(right));
}

async function readJsonFile(filePath: string, issues: ScanIssue[]) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    issues.push({
      type: 'invalid_json',
      path: filePath,
      message: error instanceof Error ? error.message : 'Invalid JSON.',
    });
    return [];
  }

  if (!Array.isArray(parsed)) {
    issues.push({
      type: 'invalid_json',
      path: filePath,
      message: 'Wanxiang template JSON must be an array.',
    });
    return [];
  }

  return parsed as RawWanxiangTemplate[];
}

function normalizeRawItem(input: {
  filePath: string;
  index: number;
  issues: ScanIssue[];
  raw: RawWanxiangTemplate;
}) {
  const pathForIssue = `${input.filePath}#${input.index + 1}`;
  const sourceProduct = normalizeSourceProduct(input.raw);
  if (!sourceProduct) {
    input.issues.push({
      type: 'invalid_product',
      path: pathForIssue,
      message: 'sourceProduct/type must identify goods or try_on.',
    });
    return null;
  }

  const title = readString(input.raw.title);
  const prompt = readString(input.raw.prompt);
  const sourceCategory = readString(input.raw.category);
  const rawImageUrl = readString(input.raw.imageUrl);
  const imageUrl = normalizeUrl(rawImageUrl);

  if (!title) {
    input.issues.push({
      type: 'empty_title',
      path: pathForIssue,
      message: 'Template title is required.',
    });
    return null;
  }

  if (!prompt) {
    input.issues.push({
      type: 'empty_prompt',
      path: pathForIssue,
      message: 'Template prompt is required.',
    });
    return null;
  }

  if (!rawImageUrl) {
    input.issues.push({
      type: 'empty_image',
      path: pathForIssue,
      message: 'Template imageUrl is required.',
    });
    return null;
  }

  if (!imageUrl) {
    input.issues.push({
      type: 'invalid_url',
      path: pathForIssue,
      message: `Invalid imageUrl: ${rawImageUrl}`,
    });
    return null;
  }

  const category = categoryMap[sourceCategory];
  if (!category || category.sourceProduct !== sourceProduct) {
    input.issues.push({
      type: 'invalid_category',
      path: pathForIssue,
      message: `Unsupported Wanxiang category: ${sourceCategory}`,
    });
    return null;
  }

  const mimeType = mimeTypeForUrl(imageUrl);
  const extension = extensionForMimeType(mimeType);
  const storageKey = `${EXTERNAL_STORAGE_PREFIX}${category.type}/${category.slug}/${shortHash(
    imageUrl
  )}.${extension}`;
  const localization = buildWanxiangTemplateLocalization({
    category: category.slug,
    prompt,
    sourceCategory,
    title,
    type: category.type,
  });

  const englishTitle = localization.titleTranslations.en;
  const englishPrompt = localization.promptTranslations.en;

  return {
    asset: {
      mimeType,
      publicUrl: imageUrl,
      storageKey,
    },
    category: category.slug,
    imageUrl,
    prompt: englishPrompt,
    promptTranslations: {
      pt: localization.promptTranslations.pt,
    },
    sortOrder: 0,
    sourceCategory,
    sourceFile: input.filePath,
    sourceProduct,
    title: englishTitle,
    titleTranslations: {
      pt: localization.titleTranslations.pt,
    },
    type: category.type,
  } satisfies NormalizedWanxiangTemplate;
}

async function scanWanxiangTemplates(args: CliArgs): Promise<ScanResult> {
  const issues: ScanIssue[] = [];
  const files = await listSourceFiles(args.source);
  const itemsByKey = new Map<string, NormalizedWanxiangTemplate>();
  let duplicateCount = 0;
  let rowsSeen = 0;

  for (const filePath of files) {
    const rows = await readJsonFile(filePath, issues);
    rowsSeen += rows.length;

    for (let index = 0; index < rows.length; index += 1) {
      const item = normalizeRawItem({
        filePath,
        index,
        issues,
        raw: rows[index],
      });
      if (!item) continue;

      const key = `${item.type}:${item.category}:${item.title}:${item.imageUrl}`;
      if (itemsByKey.has(key)) {
        duplicateCount += 1;
        continue;
      }

      itemsByKey.set(key, item);
    }
  }

  if (files.length === 0) {
    issues.push({
      type: 'unexpected_file',
      path: args.source,
      message: 'No wanxiang-goods-*.json or wanxiang-tryon-*.json files found.',
    });
  }

  const items = Array.from(itemsByKey.values()).sort((left, right) =>
    `${left.type}:${left.category}:${left.title}`.localeCompare(
      `${right.type}:${right.category}:${right.title}`
    )
  );
  const sortOrderByGroup = new Map<string, number>();
  for (const item of items) {
    const key = `${item.type}:${item.category}`;
    const sortOrder = (sortOrderByGroup.get(key) ?? 0) + 1;
    sortOrderByGroup.set(key, sortOrder);
    item.sortOrder = sortOrder;
  }

  return {
    duplicateCount,
    files,
    items,
    issues,
    rowsSeen,
    source: args.source,
  };
}

function summarizeByTypeAndCategory(items: NormalizedWanxiangTemplate[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = `${item.type}:${item.category}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort(([left], [right]) =>
    left.localeCompare(right)
  );
}

function printScanSummary(result: ScanResult, args: CliArgs) {
  const assetKeys = new Set(result.items.map((item) => item.asset.storageKey));

  console.log('Wanxiang template import check');
  console.log(`Source: ${result.source}`);
  console.log(`Mode: ${args.apply ? 'apply' : 'dry-run'}`);
  console.log(`Replace existing external Wanxiang templates: ${args.replace ? 'yes' : 'no'}`);
  console.log(`Files seen: ${result.files.length}`);
  console.log(`Rows seen: ${result.rowsSeen}`);
  console.log(`Templates ready: ${result.items.length}`);
  console.log(`Unique image assets ready: ${assetKeys.size}`);
  console.log(`Duplicates skipped: ${result.duplicateCount}`);
  console.log(
    `Brazilian Portuguese titles ready: ${result.items.filter((item) => item.titleTranslations.pt).length}`
  );
  console.log(
    `Brazilian Portuguese prompts ready: ${result.items.filter((item) => item.promptTranslations.pt).length}`
  );
  console.log('Categories:');

  for (const [key, count] of summarizeByTypeAndCategory(result.items)) {
    console.log(`  - ${key}: ${count}`);
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
    console.log('Dry-run only. Re-run with --apply to write DB rows.');
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is required for --apply.`);
  }

  return value;
}

async function ensureTemplateSchema(sql: postgres.Sql) {
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
  const requiredAssetColumns = [
    'id',
    'user_id',
    'type',
    'status',
    'storage_key',
    'public_url',
    'mime_type',
    'created_at',
    'updated_at',
  ];
  const missingTemplateColumns = requiredTemplateColumns.filter(
    (column) => !templateColumnNames.has(column)
  );
  const missingAssetColumns = requiredAssetColumns.filter(
    (column) => !assetColumnNames.has(column)
  );

  if (missingTemplateColumns.length > 0 || missingAssetColumns.length > 0) {
    throw new Error(
      [
        'Target database is not on the asset-backed template schema.',
        missingTemplateColumns.length
          ? `Missing templates columns: ${missingTemplateColumns.join(', ')}`
          : null,
        missingAssetColumns.length
          ? `Missing assets columns: ${missingAssetColumns.join(', ')}`
          : null,
      ]
        .filter(Boolean)
        .join(' ')
    );
  }

  const constraints = await sql<{ definition: string; name: string }[]>`
    select conname as name, pg_get_constraintdef(oid) as definition
    from pg_constraint
    where conrelid = 'templates'::regclass
      and conname = 'templates_type_check'
  `;
  const typeConstraint = constraints[0]?.definition ?? '';
  if (typeConstraint && !typeConstraint.includes('try_on')) {
    throw new Error(
      'templates_type_check does not allow try_on. Run pnpm db:migrate first.'
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

function uniqueAssets(items: NormalizedWanxiangTemplate[]) {
  const assets = new Map<string, ImportAsset>();
  for (const item of items) {
    assets.set(item.asset.storageKey, item.asset);
  }

  return Array.from(assets.values()).sort((left, right) =>
    left.storageKey.localeCompare(right.storageKey)
  );
}

async function applyImport(result: ScanResult, args: CliArgs) {
  if (result.issues.length > 0) {
    throw new Error('Refusing to apply import while scan issues are present.');
  }

  dotenv.config();
  const postgresUrl = getRequiredEnv('POSTGRES_URL');
  const sql = postgres(postgresUrl, { max: 3 });

  try {
    await ensureTemplateSchema(sql);
    const ownerUserId = await resolveOwnerUserId(sql, args);
    const now = new Date();
    const assetRows = uniqueAssets(result.items).map((asset) => ({
      user_id: ownerUserId,
      type: 'upload',
      status: 'uploaded',
      storage_key: asset.storageKey,
      public_url: asset.publicUrl,
      mime_type: asset.mimeType,
      size_bytes: null,
      created_at: now,
      updated_at: now,
    }));

    await sql.begin(async (tx) => {
      if (args.replace) {
        await tx`
          delete from templates as t
          using assets as a
          where (t.thumbnail_asset_id = a.id or t.preview_asset_id = a.id)
            and a.storage_key like ${`${EXTERNAL_STORAGE_PREFIX}%`}
            and t.type in ('image_to_image', 'try_on')
        `;
        await tx`
          delete from assets as a
          where a.storage_key like ${`${EXTERNAL_STORAGE_PREFIX}%`}
            and not exists (
              select 1
              from templates as t
              where t.thumbnail_asset_id = a.id
                or t.preview_asset_id = a.id
            )
        `;
      }

      if (assetRows.length > 0) {
        await tx`
          insert into assets ${tx(
            assetRows,
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

      const assetKeys = assetRows.map((asset) => asset.storage_key);
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
        const assetId = assetIdByStorageKey.get(item.asset.storageKey);
        if (assetId == null) {
          throw new Error(`Missing imported asset id for template ${item.title}`);
        }

        const existingRows = args.replace
          ? []
          : await tx<{ id: number }[]>`
              select id
              from templates
              where type = ${item.type}
                and category = ${item.category}
                and title = ${item.title}
              limit 1
            `;
        const existingTemplate = existingRows[0];

        if (existingTemplate) {
          await tx`
            update templates
            set
              title_translations_json = ${JSON.stringify(item.titleTranslations)}::jsonb,
              thumbnail_asset_id = ${assetId},
              preview_asset_id = ${assetId},
              thumbnail_url = ${buildTemplateMediaUrl(assetId)},
              preview_url = ${buildTemplateMediaUrl(assetId)},
              thumbnail_mime_type = ${item.asset.mimeType},
              preview_mime_type = ${item.asset.mimeType},
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
              ${item.type},
              ${item.title},
              ${JSON.stringify(item.titleTranslations)}::jsonb,
              ${item.category},
              ${assetId},
              ${assetId},
              ${buildTemplateMediaUrl(assetId)},
              ${buildTemplateMediaUrl(assetId)},
              ${item.asset.mimeType},
              ${item.asset.mimeType},
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
      `Applied import: ${result.items.length} templates and ${assetRows.length} image assets.`
    );
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = await scanWanxiangTemplates(args);
  printScanSummary(result, args);

  if (result.issues.length > 0) {
    throw new Error('Wanxiang template scan found issues. Fix them before import.');
  }

  if (args.apply) {
    await applyImport(result, args);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
