# Runtime Architecture

Updated: 2026-06-03

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
- `template_tags`
- `template_assets`
- `library_assets`
- `model_catalog_assets`
- `generation_jobs`
- `user_media_history`
- `credit_ledger`

`library_assets` is the first-party reusable material layer. It references
uploaded `assets` rows and stores category, title, description, sort weight,
usage count, and creator/updater audit metadata. The public
`/api/library-assets` route returns uploaded records filtered by category for
workbench inspiration and examples.

`generation_jobs` keeps one `output_asset_id` for the final provider result.
Try-on mode, template id, prompt, duration, and similar request context stay in
`input_json`; the task table itself keeps only lifecycle, provider tracking,
credits, and input/output asset references.

## Architecture Caveat

`lib/generations/runner.ts` is a disabled legacy stub and `trigger/generate-video.ts` should not be used as the active generation path.
