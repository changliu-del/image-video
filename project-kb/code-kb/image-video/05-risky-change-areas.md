# Risky Change Areas

Updated: 2026-06-03

## P0

- Active Wanxiang generation path is now DB-first and Trigger.dev-backed; deploy/migrate must happen together so queued jobs can be consumed.
- Legacy Trigger/fal/FFmpeg runner is disabled; keep `trigger/generate-video.ts` off the active path unless it is intentionally rebuilt on the simplified job schema.

## P1

- Workbench client utilities are duplicated across three components.
- Trigger.dev worker env and concurrency limits need production validation under realistic running-job volume.
- Stripe production webhook and price metadata need real integration verification.

## P2

- API route integration tests are thin.
- Browser smoke coverage is not yet codified.
- Admin/template empty-state behavior depends on `ADMIN_API_URL` and `ADMIN_API_TOKEN`.
