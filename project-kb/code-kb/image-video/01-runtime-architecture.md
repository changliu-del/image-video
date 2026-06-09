# Runtime Architecture

Updated: 2026-06-08

## Active Generation Flow

```text
Workbench selects file and options
-> POST /api/assets/presign
-> browser uploads to signed R2 PUT URL
-> POST /api/assets/complete
-> POST /api/generations
-> lib/generations/validation.ts normalizes payload
-> lib/generations/jobs.ts validates assets, limits, and credits
-> generation_jobs row created as queued with reserved credits
-> Trigger.dev generate-wanxiang worker is enqueued
-> Trigger.dev worker submits to Wanxiang and stores providerTaskId
-> Trigger.dev worker polls Wanxiang until terminal status
-> frontend polls /api/generations/[id]/status
-> status route reads generation_jobs only
-> success creates one output asset, stores generation_jobs.output_asset_id, records user media history, and captures credits
-> failure refunds reserved credits
```

`/api/generations` is DB-first: local job and credit reservation happen before provider submit. Provider interaction now belongs to `trigger/generate-wanxiang.ts`, so Vercel API requests are not held open by Wanxiang latency.

## Provider Files

- `lib/providers/wanxiang/img-to-video.ts`
- `lib/providers/wanxiang/cloth.ts`
- `lib/providers/wanxiang/starlink.ts`
- `lib/providers/wanxiang/models.ts`
- `trigger/generate-wanxiang.ts` is the active Trigger.dev task for Wanxiang submit/query.
- `lib/providers/video/fal.ts` remains for older runner path.

## Data Model

Key tables are defined in `lib/db/schema.ts`:

- `users`
- `assets`
- `templates`
- `model_catalog_assets`
- `generation_jobs`
- `user_media_history`
- `credit_ledger`

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

`user_media_history` is the private per-user material layer for uploaded and
generated media. It references owned `assets` rows and optional
`generation_jobs` rows, then stores source, generation type, role, visibility,
favorite state, usage count, and last-used time. It is not public catalog data.

`generation_jobs` keeps one `output_asset_id` for the final provider result.
Try-on mode, template id, prompt, duration, and similar request context stay in
`input_json`; the task table itself keeps only lifecycle, provider tracking,
credits, and input/output asset references.

## Architecture Caveat

`lib/generations/runner.ts` is a disabled legacy stub and `trigger/generate-video.ts` should not be used as the active generation path.
