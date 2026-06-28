# Config and Operations

Updated: 2026-06-27

## Common Environment Variables

- `POSTGRES_URL`
- `AUTH_SECRET`
- `BASE_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `DASHSCOPE_API_KEY`
- `DASHSCOPE_BASE_URL` (optional, defaults to `https://dashscope.aliyuncs.com/api/v1`)
- `DASHSCOPE_VIDEO_SYNTHESIS_URL` (optional)
- `DASHSCOPE_IMAGE_GENERATION_URL` (optional)
- `DASHSCOPE_TASKS_URL` (optional)
- `WANXIANG_IMAGE_TO_VIDEO_MODEL` (optional, defaults to `wan2.6-i2v-flash`)
- `WANXIANG_IMAGE_TO_VIDEO_RESOLUTION` (optional, defaults to `720P`)
- `WANXIANG_IMAGE_TO_VIDEO_PROMPT_EXTEND` (optional, defaults to `true`)
- `WANXIANG_IMAGE_TO_VIDEO_AUDIO` (optional, defaults to `false` for `wan2.6-i2v-flash`)
- `WANXIANG_IMAGE_EDIT_MODEL` (optional, defaults to `wan2.7-image-pro`)
- `WANXIANG_MODEL_CATALOG_URL`
- `TRIGGER_GENERATION_CONCURRENCY_LIMIT`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYMENTS_MOCK`
- `ADMIN_API_URL` and `ADMIN_API_TOKEN` only for the legacy `/api/creative-templates` proxy; local Admin template/library/user-media management does not depend on them.
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

`R2_PUBLIC_BASE_URL` is the public CDN base for public R2 objects. Public
template list/detail APIs should return direct CDN URLs for uploaded template
assets whose `assets.storage_key` starts with `templates/`, so browsers fetch
template thumbnails/previews from the CDN instead of proxying every byte through
Vercel Functions. `/api/template-media/{assetId}` remains a compatibility and
fallback route for historical stored snapshots, range checks, and explicit
`external/` template media. User uploads and generated outputs must still be
displayed through `/api/asset-media/{assetId}` because they are private user
data. Do not fix broken private previews by adding signed-URL fallback logic to
the frontend.

Do not hide app media route failures by adding public-URL or signed-URL
fallbacks. Fix the owning data/config path directly: R2-backed assets must have
real R2 `storage_key` values under the intended namespace, while bundled static
or external template assets must use a non-R2 prefix such as `external/` and a
`public_url` that the explicit external-media route branch supports. Historical
starter resources in `public/resources/*` are homepage promo examples; if old
`external/starter/...` rows exist in `templates`, seed cleanup should retire
them instead of treating them as public template catalog data.

`BASE_URL` must be the externally reachable app origin for app redirects,
payments, and any cloud-worker app callbacks. Wanxiang provider input media
must not use `BASE_URL + /api/asset-media/{assetId}` because that app media route
is private and requires the user's session cookie; use short-lived R2 signed GET
URLs for provider submit payloads.

Trigger.dev keys are environment-specific. A local `TRIGGER_SECRET_KEY` starting
with `tr_dev_` enqueues runs into the Development environment; they will not
appear in the Production dashboard and need a running `trigger dev` worker. Use
the Production key only when expecting cloud-deployed `generate-wanxiang` runs
to be consumed by the Production deployment.

## Build Notes

`pnpm build` currently passes cleanly.

## Completion Deployment Workflow

For image-video development tasks, a finished implementation should normally
continue through repository and deployment verification instead of stopping at
local validation:

1. Run the narrowest useful test first, then `pnpm typecheck` and `pnpm build`
   when the change touches shared runtime, API routes, or user-visible flows.
2. Review `git status --short` and stage only files that belong to the current
   task. If unrelated user changes are present and cannot be cleanly separated,
   ask before committing.
3. Commit with a concise task summary and push the current branch to `origin`.
4. Wait 5 minutes after the successful push, then validate the affected
   production route or API directly. Treat the live route/API as the default
   acceptance signal.
5. Report the pushed branch, commit, live acceptance result, and any remaining
   risk.

If Vercel shows a failed deployment and the failure is caused by the current
change, fix it in the same workflow, validate again, commit, push, wait 5
minutes, and re-check the live route or API. If live acceptance cannot be
verified from Codex, report the exact URL and the last status that could be
verified locally.

## Wanxiang Image-to-Video

Image-to-video uses Alibaba Model Studio / Bailian DashScope, not the Alibaba
Cloud Market APPCODE endpoint. Configure `DASHSCOPE_API_KEY` in Vercel server
env and Trigger.dev Production env. The adapter sends
`Authorization: Bearer <DASHSCOPE_API_KEY>` plus `X-DashScope-Async: enable`.

Defaults:

- base URL: `https://dashscope.aliyuncs.com/api/v1`
- submit: `/services/aigc/video-generation/video-synthesis`
- query: `/tasks/{task_id}`
- model: `wan2.6-i2v-flash`
- resolution: `720P`
- prompt extend: `true`
- audio: `false` for `wan2.6-i2v-flash`

The project-level payload is normalized before submit:

- `wanxiang_2_6_first_frame` remains the legacy first-frame path and sends
  `input.img_url` plus `input.prompt`.
- `wanxiang_2_7` without an appearing model uses the newer Wanxiang media
  protocol and sends `input.media[{ type: 'first_frame', url }]`.
- `wanxiang_2_7` with an appearing model uses Wanxiang 2.7 reference-to-video
  (`wan2.7-r2v`) so the user/source image and model image are both sent as
  `reference_image` media entries. The prompt must explicitly reference Image 1
  as the primary product/source and Image 2 as the appearing model.

The selected 5-15s duration is sent through `parameters.duration`. Reference
video and audio fields are still not accepted by the current `image_to_video`
workbench.

## Wanxiang Image Editing

Apparel image and try-on both use Alibaba Model Studio / Bailian DashScope image
editing through `wan2.7-image-pro`, not the older Alibaba Cloud Market APPCODE
cloth or fitting endpoints. Configure the same `DASHSCOPE_API_KEY` in Vercel
server env and Trigger.dev Production env.

Defaults:

- base URL: `https://dashscope.aliyuncs.com/api/v1`
- submit: `/services/aigc/image-generation/generation`
- query: `/tasks/{task_id}`
- model: `wan2.7-image-pro`
- size: explicit 2K-class pixel sizes derived from the requested aspect ratio
- output count: `n = 1`
- watermark: `false`

The project-level payload is normalized before submit: apparel uses one
`inputImageUrl`, while try-on sends garment image URLs followed by the model
image URL so the model image remains the target person reference.

The Trigger.dev `generate-wanxiang` worker also needs the R2 env vars. On a
successful provider terminal status it downloads the provider result, uploads it
to R2, and only then marks the job succeeded with an owned output asset.

- Auth route protection uses `proxy.ts`, following the current Next.js proxy convention.
- The build preloads `scripts/suppress-next-baseline-warning.cjs` to suppress only Next canary's vendored `baseline-browser-mapping` staleness warning; other warnings remain visible.

## Deployment Docs

- Deployment runbook: `docs/ecommerce-video-saas/03-deployment-runbook.md`
- Purchase checklist: `docs/ecommerce-video-saas/02-deployment-purchase-checklist.md`
- Cost path: `docs/ecommerce-video-saas/04-cost-and-growth-path.md`
