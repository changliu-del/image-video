import 'dotenv/config';

import { createHash, randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  assets,
  templateAssets,
  templateIngestionRuns,
  templateSourceRecords,
  templateTagRelations,
  templateTags,
  templates,
  type TemplateType,
} from '@/lib/db/schema';
import { locales, type Locale } from '@/lib/marketing/content';
import { templateTagOptions } from '@/lib/templates/catalog';
import { uploadObjectToR2 } from '@/lib/storage/r2';

type SourceConfig = {
  name: string;
  url: string;
  locale?: Locale;
  tags?: string[];
  type?: TemplateType;
  costCredits?: number;
  aspectRatios?: Array<'9:16' | '1:1' | '16:9'>;
  durationSeconds?: 5 | 8 | 10;
  licenseNote?: string;
};

type CrawlCandidate = {
  source: string;
  sourceUrl: string;
  assetUrl: string;
  title: string;
  description: string;
  prompt: string;
  promptSource: 'source' | 'generated';
  locale: Locale;
  tags: string[];
  type: TemplateType;
  costCredits: number;
  aspectRatios: Array<'9:16' | '1:1' | '16:9'>;
  durationSeconds: 5 | 8 | 10;
  licenseNote?: string;
};

type CliOptions = {
  dryRun: boolean;
  sourceFile?: string;
  limit?: number;
};

const DEFAULT_TAGS = [
  'promotion',
  'image-to-video',
  'marketplace',
  'conversion',
  'standard-video',
  'ratio-9-16',
];

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = { dryRun: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--source-file') {
      options.sourceFile = args[index + 1];
      index += 1;
    } else if (arg === '--limit') {
      const limit = Number.parseInt(args[index + 1] ?? '', 10);
      options.limit = Number.isFinite(limit) && limit > 0 ? limit : undefined;
      index += 1;
    }
  }

  return options;
}

async function loadSources(options: CliOptions): Promise<SourceConfig[]> {
  if (options.sourceFile) {
    return JSON.parse(await readFile(options.sourceFile, 'utf8'));
  }

  const raw = process.env.TEMPLATE_CRAWLER_SOURCES;
  if (!raw) {
    throw new Error(
      'Set TEMPLATE_CRAWLER_SOURCES or pass --source-file. Expected a JSON array of { name, url }.'
    );
  }

  return JSON.parse(raw);
}

function normalizeLocale(value: string | undefined): Locale {
  return value && locales.includes(value as Locale) ? (value as Locale) : 'en';
}

function absolutizeUrl(url: string, baseUrl: string) {
  return new URL(url, baseUrl).toString();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function pickMeta(html: string, names: string[]) {
  for (const name of names) {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["'][^>]*>`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        return decodeHtml(match[1].trim());
      }
    }
  }

  return null;
}

function pickTitle(html: string) {
  return (
    pickMeta(html, ['og:title', 'twitter:title']) ??
    decodeHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? '')
  );
}

function extractVideoUrls(html: string, baseUrl: string) {
  const urls = new Set<string>();
  const patterns = [
    /<meta[^>]+(?:property|name)=["'](?:og:video|og:video:url|twitter:player:stream)["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<video[^>]+src=["']([^"']+)["'][^>]*>/gi,
    /<source[^>]+src=["']([^"']+)["'][^>]*(?:type=["']video\/[^"']+["'])?[^>]*>/gi,
    /"contentUrl"\s*:\s*"([^"]+\.(?:mp4|webm)(?:\?[^"]*)?)"/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      if (match[1]) {
        urls.add(absolutizeUrl(decodeHtml(match[1]), baseUrl));
      }
    }
  }

  return Array.from(urls);
}

function generatePrompt(input: { title: string; description: string }) {
  return [
    'Create a high-performing ecommerce AI video template.',
    `Product scene: ${input.title || 'a hero product in an online store'}.`,
    input.description
      ? `Creative direction: ${input.description}.`
      : 'Creative direction: show the product clearly, add premium lighting, smooth camera motion, and a direct shopping CTA.',
    'Format: short social commerce video, clean composition, realistic product motion, strong first-second hook, marketplace-ready visual hierarchy.',
  ].join(' ');
}

function slugify(value: string) {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100) || `crawled-template-${Date.now()}`
  );
}

function mimeTypeFromUrl(url: string) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith('.webm')) {
    return 'video/webm';
  }

  return 'video/mp4';
}

async function crawlSource(source: SourceConfig): Promise<CrawlCandidate[]> {
  const response = await fetch(source.url, {
    headers: {
      'user-agent':
        'ImageVideoTemplateCrawler/1.0 (+contact: ecommerce-template-ingestion)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.url}: ${response.status}`);
  }

  const html = await response.text();
  const title = pickTitle(html) || source.name;
  const description =
    pickMeta(html, ['og:description', 'twitter:description', 'description']) ??
    '';
  const sourcePrompt =
    pickMeta(html, ['ai:prompt', 'prompt', 'template:prompt']) ??
    html.match(/data-prompt=["']([^"']+)["']/i)?.[1]?.trim() ??
    null;
  const videoUrls = extractVideoUrls(html, source.url);
  const prompt = sourcePrompt
    ? decodeHtml(sourcePrompt)
    : generatePrompt({ title, description });

  return videoUrls.map((assetUrl, index) => ({
    source: source.name,
    sourceUrl: source.url,
    assetUrl,
    title: videoUrls.length > 1 ? `${title} ${index + 1}` : title,
    description,
    prompt,
    promptSource: sourcePrompt ? 'source' : 'generated',
    locale: normalizeLocale(source.locale),
    tags: source.tags?.length ? source.tags : DEFAULT_TAGS,
    type: source.type ?? 'video',
    costCredits: source.costCredits ?? 10,
    aspectRatios: source.aspectRatios?.length ? source.aspectRatios : ['9:16'],
    durationSeconds: source.durationSeconds ?? 5,
    licenseNote: source.licenseNote,
  }));
}

async function ensureTemplateTags(tagSlugs: string[]) {
  await db
    .insert(templateTags)
    .values(
      templateTagOptions.map((tag, index) => ({
        slug: tag.slug,
        group: tag.group,
        labelPt: tag.labels.pt,
        labelEn: tag.labels.en,
        labelZh: tag.labels.zh,
        sortWeight: index,
      }))
    )
    .onConflictDoNothing();

  const rows = await db
    .select({ id: templateTags.id, slug: templateTags.slug })
    .from(templateTags)
    .where(inArray(templateTags.slug, tagSlugs));

  return rows;
}

async function downloadAsset(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    bytes,
    hash: createHash('sha256').update(bytes).digest('hex'),
    mimeType: response.headers.get('content-type')?.split(';')[0] ?? mimeTypeFromUrl(url),
  };
}

async function upsertCandidate(input: {
  candidate: CrawlCandidate;
  runId: string;
  actorUserId: number;
}) {
  const { bytes, hash, mimeType } = await downloadAsset(input.candidate.assetUrl);
  const existing = await db
    .select({ id: templateSourceRecords.id, templateId: templateSourceRecords.templateId })
    .from(templateSourceRecords)
    .where(eq(templateSourceRecords.contentHash, hash))
    .limit(1);

  if (existing[0]?.templateId) {
    await db
      .update(templateSourceRecords)
      .set({
        runId: input.runId,
        updatedAt: new Date(),
      })
      .where(eq(templateSourceRecords.id, existing[0].id));
    return { action: 'skipped_duplicate', templateId: existing[0].templateId };
  }

  const assetId = randomUUID();
  const extension = mimeType === 'video/webm' ? 'webm' : 'mp4';
  const storageKey = `templates/crawled/${input.candidate.source}/${hash}.${extension}`;
  const publicUrl = await uploadObjectToR2({
    storageKey,
    body: bytes,
    mimeType,
  });
  const slug = slugify(`${input.candidate.source}-${input.candidate.title}`);
  const tagRows = await ensureTemplateTags(input.candidate.tags);

  return db.transaction(async (tx) => {
    await tx.insert(assets).values({
      id: assetId,
      userId: input.actorUserId,
      type: 'template_asset',
      status: 'uploaded',
      storageKey,
      publicUrl,
      mimeType,
      sizeBytes: bytes.byteLength,
    });

    const [template] = await tx
      .insert(templates)
      .values({
        slug,
        locale: input.candidate.locale,
        title: input.candidate.title.slice(0, 140),
        description:
          input.candidate.description ||
          'Crawled ecommerce AI video template ready for product campaigns.',
        type: input.candidate.type,
        status: 'draft',
        hook: input.candidate.title.slice(0, 220),
        cta: 'Shop now',
        prompt: input.candidate.prompt,
        promptJson: {
          source: input.candidate.source,
          sourceUrl: input.candidate.sourceUrl,
          promptSource: input.candidate.promptSource,
        },
        defaultInputsJson: {},
        previewAssetId: assetId,
        thumbnailAssetId: null,
        costCredits: input.candidate.costCredits,
        aspectRatiosJson: input.candidate.aspectRatios,
        durationSeconds: input.candidate.durationSeconds,
        sortWeight: 0,
        createdBy: input.actorUserId,
        updatedBy: input.actorUserId,
      })
      .onConflictDoUpdate({
        target: [templates.locale, templates.slug],
        set: {
          description:
            input.candidate.description ||
            'Crawled ecommerce AI video template ready for product campaigns.',
          prompt: input.candidate.prompt,
          promptJson: {
            source: input.candidate.source,
            sourceUrl: input.candidate.sourceUrl,
            promptSource: input.candidate.promptSource,
          },
          previewAssetId: assetId,
          updatedBy: input.actorUserId,
          updatedAt: new Date(),
        },
      })
      .returning();

    await tx
      .insert(templateAssets)
      .values({
        templateId: template.id,
        assetId,
        role: 'preview',
      })
      .onConflictDoNothing();

    if (tagRows.length > 0) {
      await tx
        .delete(templateTagRelations)
        .where(eq(templateTagRelations.templateId, template.id));
      await tx
        .insert(templateTagRelations)
        .values(tagRows.map((tag) => ({ templateId: template.id, tagId: tag.id })))
        .onConflictDoNothing();
    }

    await tx
      .insert(templateSourceRecords)
      .values({
        runId: input.runId,
        templateId: template.id,
        assetId,
        source: input.candidate.source,
        sourceUrl: input.candidate.sourceUrl,
        sourceAssetUrl: input.candidate.assetUrl,
        contentHash: hash,
        prompt: input.candidate.prompt,
        promptSource: input.candidate.promptSource,
        licenseNote: input.candidate.licenseNote,
        metadataJson: {
          title: input.candidate.title,
          tags: input.candidate.tags,
          mimeType,
          storageKey,
        },
      })
      .onConflictDoUpdate({
        target: templateSourceRecords.contentHash,
        set: {
          runId: input.runId,
          templateId: template.id,
          assetId,
          updatedAt: new Date(),
        },
      });

    return { action: 'created_or_updated', templateId: template.id };
  });
}

async function main() {
  const options = parseCliOptions();
  const sources = await loadSources(options);
  const limitedSources = options.limit ? sources.slice(0, options.limit) : sources;
  const candidates = (await Promise.all(limitedSources.map(crawlSource))).flat();

  if (options.dryRun) {
    console.log(JSON.stringify({ candidates }, null, 2));
    return;
  }

  const actorUserId = Number.parseInt(process.env.TEMPLATE_CRAWLER_ACTOR_USER_ID ?? '', 10);
  if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
    throw new Error('TEMPLATE_CRAWLER_ACTOR_USER_ID must be a valid user id for DB ownership.');
  }

  const [run] = await db
    .insert(templateIngestionRuns)
    .values({
      source: limitedSources.map((source) => source.name).join(',').slice(0, 80),
      dryRun: false,
      createdBy: actorUserId,
      statsJson: { candidates: candidates.length },
    })
    .returning();

  const stats = { createdOrUpdated: 0, skippedDuplicate: 0, failed: 0 };

  try {
    for (const candidate of candidates) {
      try {
        const result = await upsertCandidate({
          candidate,
          runId: run.id,
          actorUserId,
        });
        if (result.action === 'skipped_duplicate') {
          stats.skippedDuplicate += 1;
        } else {
          stats.createdOrUpdated += 1;
        }
      } catch (error) {
        stats.failed += 1;
        console.error(`Failed to ingest ${candidate.assetUrl}`, error);
      }
    }

    await db
      .update(templateIngestionRuns)
      .set({
        status: stats.failed > 0 ? 'failed' : 'succeeded',
        finishedAt: new Date(),
        statsJson: stats,
        errorMessage: stats.failed > 0 ? `${stats.failed} candidates failed` : null,
      })
      .where(eq(templateIngestionRuns.id, run.id));
  } catch (error) {
    await db
      .update(templateIngestionRuns)
      .set({
        status: 'failed',
        finishedAt: new Date(),
        statsJson: stats,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(templateIngestionRuns.id, run.id));
    throw error;
  }

  console.log(JSON.stringify({ runId: run.id, stats }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
