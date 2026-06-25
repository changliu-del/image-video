# Runtime Architecture

Updated: 2026-06-11

## Active Generation Flow

```text
Workbench selects file and options
-> /create/video uploads the reference image through POST /api/assets/upload
   (same-origin server upload to R2, no browser-to-R2 CORS dependency)
-> direct-upload surfaces may still use POST /api/assets/presign
   -> browser uploads to signed R2 PUT URL -> POST /api/assets/complete
-> POST /api/generations
-> lib/generations/validation.ts normalizes payload
-> lib/generations/jobs.ts validates assets, limits, and credits
-> generation_jobs row created as queued with reserved credits
-> Trigger.dev generate-wanxiang worker is enqueued
-> Trigger.dev worker submits to Wanxiang and stores providerTaskId
-> Trigger.dev worker polls Wanxiang until terminal status
-> frontend polls /api/generations/[id]/status
-> status route reads generation_jobs only
-> success copies the provider result into R2, creates one output asset, stores generation_jobs.output_asset_id, records user media history, and captures credits
-> failure refunds reserved credits
```

`/api/generations` is DB-first: local job and credit reservation happen before provider submit. Provider interaction now belongs to `trigger/generate-wanxiang.ts`, so Vercel API requests are not held open by Wanxiang latency.

## Provider Files

- `lib/providers/wanxiang/img-to-video.ts`
- `lib/providers/wanxiang/cloth.ts`
- `lib/providers/wanxiang/starlink.ts`
- `trigger/generate-wanxiang.ts` is the active Trigger.dev task for Wanxiang submit/query.
- `lib/providers/video/fal.ts` remains for older runner path.

## Data Model

Key tables are defined in `lib/db/schema.ts`:

- `users`
- `assets`
- `templates`
- `generation_jobs`
- `user_media_history`
- `credit_ledger`

Active DB primary keys are integer sequences, not UUIDs. User IDs are the
exception to the zero-start rule: `users.id` starts at `1` and has a positive
ID check, so `uid = 0` must never exist. Resource IDs such as assets,
templates, jobs, history rows, credit ledger entries, and verification rows can
start at `0`. API payloads and route params still serialize these IDs as
numeric strings so frontend contracts stay string-based while DB joins and
foreign keys stay integer-based. `0029_rekey_primary_ids_to_sequences.sql` is
the destructive rekey migration for this rule; after applying it, run seed/import
flows again.

`templates` is the minimal public template catalog. Its semantic fields are
`id`, `type`, `category`, `thumbnail_asset_id`, `preview_asset_id`,
`thumbnail_url`, `preview_url`, `thumbnail_mime_type`, `preview_mime_type`,
`prompt`, `sort_order`, `created_at`, and `updated_at`. Thumbnail and preview
media are regular `assets` rows, but templates also store URL/MIME snapshots so
public and Admin list reads do not join `assets` only to render cards. `type` is
the top-level workflow selector: the homepage template gallery, public template
library, and `/create/video` image-to-video workbench should query
`/api/templates?type=image_to_video`. `category` is only a business category
inside that type. Template semantics do not include tag JSON, slugs,
publication status, direct source URLs, or negative/reverse prompts.

The template list API should return `id`, `type`, `category`, `thumbnailUrl`,
and `previewUrl` for browsing cards. Template detail adds `prompt` when the user
opens a detail view or applies a template.

Virtual try-on model choices are also template rows. Use `type = 'model'`,
store model classifications such as `男/青年/冷酷` in `category`, store the
model name in `title`, and store the style/feature/person description in
`prompt`. `/api/model-assets` is a compatibility API over these template rows;
there is no active `model_catalog_assets` table.

`user_media_history` is the private per-user material layer for uploaded and
generated media. It references owned `assets` rows and optional
`generation_jobs` rows, then stores source, generation type, role, visibility,
favorite state, usage count, and last-used time. It is not public catalog data.

`generation_jobs` keeps one `output_asset_id` for the final generated result.
The provider URL is an intermediate worker result only; successful jobs copy the
final image/video bytes into Cloudflare R2 and expose the owned asset through
the app media route wherever the app displays or records the output.
Try-on mode, template id, prompt, and similar request context stay in
`input_json`; image-to-video duration is a user-selectable 5-15s integer and is
stored there as `durationSeconds`. The task table itself keeps only lifecycle,
provider tracking, credits, and input/output asset references.

## Media URL Ownership

Do not treat `assets.public_url` as the frontend display contract. It is storage
metadata for the R2 object and may point at a bucket endpoint that is not
browser-readable.

Template media follows this pattern already: Admin upload writes regular
`assets` rows with R2 metadata, but `templates.thumbnail_url` and
`templates.preview_url` store `/api/template-media/{assetId}`. That route reads
the configured `R2_PUBLIC_BASE_URL` plus the asset `storage_key` server-side,
supports byte ranges for video, and sets public media cache headers. The
frontend still sees only the app media route; the route owns the storage-origin
fetch.

User uploads and generated outputs should follow the same app-route pattern:
status APIs, user history, Admin previews, and workbench upload completion
should return `/api/asset-media/{assetId}` for browser display. Provider-facing
payloads must not use `/api/asset-media/{assetId}` because that route is private
and requires the user's session cookie. For Wanxiang submit payloads, resolve
uploaded input assets to short-lived R2 signed GET URLs server-side; keep
`/api/asset-media/{assetId}` as the browser display contract only.

## Architecture Caveat

`lib/generations/runner.ts` is a disabled legacy stub and `trigger/generate-video.ts` should not be used as the active generation path.
