# Ecommerce Template Crawler Runbook

## Goal

Continuously collect high-quality competitor AI ecommerce videos, preserve the source trail, upload usable video assets to R2, and create draft templates that ops/admin users can review and publish.

## Data Contract

Each crawled video must produce:

- `source`: competitor/source adapter name.
- `sourceUrl`: original page URL.
- `sourceAssetUrl`: original video URL found on the page.
- `prompt`: source prompt when available, otherwise a generated ecommerce video prompt.
- `promptSource`: `source` or `generated`.
- `contentHash`: SHA-256 of the downloaded video bytes for dedupe.
- `asset`: uploaded R2 object stored as `assets.type = template_asset`.
- `template`: draft row in `templates` with `previewAssetId` pointing at the uploaded video.
- `template_source_records`: trace record linking source, asset, prompt, run, and template.

## Source Configuration

Provide sources as JSON via `TEMPLATE_CRAWLER_SOURCES` or `--source-file`.

```json
[
  {
    "name": "competitor-a",
    "url": "https://example.com/ai-commerce-video",
    "locale": "en",
    "tags": ["promotion", "video", "marketplace", "conversion", "standard-video", "ratio-9-16"],
    "type": "video",
    "costCredits": 10,
    "aspectRatios": ["9:16"],
    "durationSeconds": 5,
    "licenseNote": "Internal competitive research. Confirm rights before publishing."
  }
]
```

## Commands

Dry-run without DB writes or R2 upload:

```bash
pnpm dlx tsx scripts/template-crawler/index.ts --source-file ./crawler-sources.json --dry-run
```

Run ingestion:

```bash
TEMPLATE_CRAWLER_ACTOR_USER_ID=1 pnpm dlx tsx scripts/template-crawler/index.ts --source-file ./crawler-sources.json
```

Limit the number of source pages during smoke tests:

```bash
TEMPLATE_CRAWLER_ACTOR_USER_ID=1 pnpm dlx tsx scripts/template-crawler/index.ts --source-file ./crawler-sources.json --limit 3
```

## Required Environment

- `POSTGRES_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `TEMPLATE_CRAWLER_ACTOR_USER_ID`

## Extraction Rules

The default adapter extracts videos from:

- Open Graph video meta tags.
- Twitter video stream meta tags.
- `<video src>` and `<source src>` tags.
- JSON-LD `contentUrl` values ending in `.mp4` or `.webm`.

Prompt extraction tries:

- `ai:prompt`
- `prompt`
- `template:prompt`
- `data-prompt`

When no prompt is available, the crawler generates a reusable ecommerce video prompt from page title and description, and stores `promptSource = generated`.

## Review Workflow

1. Run dry-run and review candidates.
2. Run ingestion into draft templates.
3. Review source records and license notes.
4. In admin templates, add thumbnails if needed.
5. Publish only approved templates.

## Adding A New Source

Start with source JSON only. If the site needs custom extraction, add a source adapter under `scripts/template-crawler/` with the same candidate contract:

```ts
type CrawlCandidate = {
  source: string;
  sourceUrl: string;
  assetUrl: string;
  title: string;
  description: string;
  prompt: string;
  promptSource: 'source' | 'generated';
};
```

Keep adapters deterministic, rate-limited, and resumable. Never bypass robots, authentication, or platform terms.

## Failure Handling

- Duplicate video content is skipped by SHA-256 hash.
- Duplicate source URLs are updated, not re-created.
- Failed candidates are counted on `template_ingestion_runs.statsJson`.
- A run with any candidate failure is marked `failed`; successful candidates from that run remain available for review.

## Publishing Standard

A crawled template is publishable only when:

- The prompt is useful without competitor-specific brand references.
- The video asset is clear and loads from R2.
- Rights/licensing has been reviewed.
- Tags, cost, type, aspect ratio, CTA, and title are appropriate for ecommerce use.
