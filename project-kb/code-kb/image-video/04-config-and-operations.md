# Config and Operations

Updated: 2026-06-24

## Common Environment Variables

- `POSTGRES_URL`
- `AUTH_SECRET`
- `BASE_URL`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `WANXIANG_APPCODE`
- `WANXIANG_IMG_TO_VIDEO_SUBMIT_URL`
- `WANXIANG_IMG_TO_VIDEO_QUERY_URL`
- `WANXIANG_CLOTH_SUBMIT_URL`
- `WANXIANG_CLOTH_QUERY_URL`
- `WANXIANG_TRY_ON_SINGLE_SUBMIT_URL`
- `WANXIANG_TRY_ON_MULTI_SUBMIT_URL`
- `WANXIANG_TRY_ON_QUERY_URL`
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

`R2_PUBLIC_BASE_URL` is storage metadata for persisted asset rows. Frontend
media display should use app media routes instead: `/api/template-media/{assetId}`
for template media and `/api/asset-media/{assetId}` for user uploads/generated
outputs. Do not fix broken workbench previews by adding signed-URL fallback
logic to the frontend.

Do not hide app media route failures by adding public-URL or signed-URL
fallbacks. Fix the owning data/config path directly: R2-backed assets must have
real R2 `storage_key` values under the intended namespace, while bundled static
or external template assets must use a non-R2 prefix such as `external/` and a
`public_url` that the explicit external-media route branch supports. Starter
resources in `public/resources/*` are `external/starter/...` assets, not
`templates/starter/...` R2 objects.

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

`WANXIANG_APPCODE` is the Aliyun API Gateway AppCode used in the server-side
`Authorization: APPCODE <code>` header. The image-to-video adapter defaults to:

- submit: `https://imgtovideo.market.alicloudapi.com/maigc/api/imgToVideo/submit`
- query: `https://imgtovideo.market.alicloudapi.com/maigc/api/imgToVideo/query`

Only configure `WANXIANG_IMG_TO_VIDEO_SUBMIT_URL` or
`WANXIANG_IMG_TO_VIDEO_QUERY_URL` when the purchased API product provides a
different endpoint. The project-level payload is normalized before submit:
`inputImageUrl` / `prompt` become the Aliyun Cloud Market fields `imgUrl` /
`posPrompt`. The current image-to-video API is treated as fixed 5 seconds and
single-image only; reference video and audio fields are not accepted for
`image_to_video`.

The Trigger.dev `generate-wanxiang` worker also needs the R2 env vars. On a
successful provider terminal status it downloads the provider result, uploads it
to R2, and only then marks the job succeeded with an owned output asset.

- Auth route protection uses `proxy.ts`, following the current Next.js proxy convention.
- The build preloads `scripts/suppress-next-baseline-warning.cjs` to suppress only Next canary's vendored `baseline-browser-mapping` staleness warning; other warnings remain visible.

## Deployment Docs

- Deployment runbook: `docs/ecommerce-video-saas/03-deployment-runbook.md`
- Purchase checklist: `docs/ecommerce-video-saas/02-deployment-purchase-checklist.md`
- Cost path: `docs/ecommerce-video-saas/04-cost-and-growth-path.md`
