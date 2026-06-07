# Config and Operations

Updated: 2026-06-04

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

## Build Notes

`pnpm build` currently passes cleanly.

- Auth route protection uses `proxy.ts`, following the current Next.js proxy convention.
- The build preloads `scripts/suppress-next-baseline-warning.cjs` to suppress only Next canary's vendored `baseline-browser-mapping` staleness warning; other warnings remain visible.

## Deployment Docs

- Deployment runbook: `docs/ecommerce-video-saas/03-deployment-runbook.md`
- Purchase checklist: `docs/ecommerce-video-saas/02-deployment-purchase-checklist.md`
- Cost path: `docs/ecommerce-video-saas/04-cost-and-growth-path.md`
