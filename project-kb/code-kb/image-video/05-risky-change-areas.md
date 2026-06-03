# Risky Change Areas

Updated: 2026-06-03

## P0

- Provider submit and DB job/credit creation are not one atomic lifecycle.
- Active Wanxiang generation path and legacy Trigger/fal/FFmpeg runner path disagree on schema/statuses.

## P1

- Dashboard header credits are hardcoded.
- Workbench client utilities are duplicated across three components.
- R2 upload complete does not verify object existence with HEAD.
- Stripe production webhook and price metadata need real integration verification.

## P2

- API route integration tests are thin.
- Browser smoke coverage is not yet codified.
- Admin/template empty-state behavior depends on `ADMIN_API_URL` and `ADMIN_API_TOKEN`.

