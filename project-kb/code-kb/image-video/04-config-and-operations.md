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
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYMENTS_MOCK`
- `ADMIN_API_URL`
- `ADMIN_API_TOKEN`
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
- Template crawler: `docs/ecommerce-video-saas/05-template-crawler-runbook.md`
