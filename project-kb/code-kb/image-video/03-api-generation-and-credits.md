# API, Generation, and Credits

Updated: 2026-06-11

## Request Validation

`lib/generations/validation.ts` owns API request normalization. It currently supports:

- Upload validation for png/jpeg/webp up to 10 MB.
- Generation types: `image_to_video`, `apparel_image`, `try_on`.
- Legacy `image-to-video` alias.
- Optional workbench field: `templateId`.
- `image_to_video` uses one image input, a required prompt, and a selectable integer `durationSeconds` from 5 to 15. Missing duration defaults to 5 seconds for compatibility.
- Apparel controls: `strength`, `variants`.
- Try-on modes: `single`, `multi`.

All DB-backed resource IDs in request fields such as `inputAssetId`,
`templateId`, `modelTemplateId`, `modelAssetId`, and `garmentAssetId` are
numeric strings. Resource primary keys are integer sequences that may start at
`0`; user IDs are positive integers starting at `1`. Avoid legacy UUID-style
values such as `template_uuid` or `asset_123` in new tests and fixtures.

## Credits

`lib/credits.ts` supports:

- reserve
- capture
- refund
- purchased credits
- signup free credits
- admin adjustments

## Pricing and Mock Payments

Updated: 2026-06-27

- `lib/payments/catalog.ts` is the shared source of truth for subscription plans and one-time credit packages.
- Subscription plans are Basic, Plus, and Pro across `month` and `year` intervals.
- `lib/payments/mock.ts` derives mock Stripe products/prices from the catalog and still exposes `MOCK_MONTHLY_PLANS` for compatibility.
- `lib/payments/stripe.ts` routes mock subscription checkout through the same local grant/update flow for monthly and annual plans.
- `/dashboard/billing` is the primary workspace Plans page; `/dashboard/credits` is the credit wallet and ledger page.
- The unlocalized `/pricing` dashboard route redirects to `/dashboard/billing`; localized marketing pricing pages remain public ads and link into workspace Plans/Credits.
- `app/(dashboard)/layout.tsx` verifies the session token only. `app/(dashboard)/dashboard-header.tsx` fetches `/api/user` on the client to hydrate the real credit balance, plan/admin state, and user menu after the workspace shell renders.
- Subscription tier pricing is credit-top-up pricing, not feature gating: Basic grants 480 credits for R$48 per month, Plus grants 2000 credits for R$160 per month, and Pro grants 6200 credits for R$372 per month. Annual billing charges 12 times the monthly amount while preserving the monthly credit allowance copy.

Generation credit cost is currently:

- Brazil/Pix pricing uses `lib/payments/pricing.ts`: 1 credit = R$0.10, provider cost markup = 3x, and the Wanxiang CNY->BRL rate snapshot is centralized there.
- Image-to-video basic mode (`wanxiang_2_6_first_frame`, Wanxiang 2.6 flash 720P no-audio): default 5s costs 25 credits; 10s costs 45 credits; 15s costs 65 credits.
- Image-to-video Pro mode (`wanxiang_2_7`, Wanxiang 2.7 720P): default 5s costs 85 credits; 10s costs 170 credits; 15s costs 255 credits. The appearing-model library is only available in this mode; when selected, the provider payload uses Wanxiang 2.7 reference-to-video (`wan2.7-r2v`) so both the source/product image and the model image are sent as reference images.
- Apparel image: 15 credits. It uses Bailian Wanxiang `wan2.7-image-pro` image editing at 0.50 CNY per successful output image, converted through the shared 3x markup rule.
- Try-on single: 15 credits.
- Try-on multi: 15 credits. Current try-on requests produce one output image; provider billing is per successful output image, not per garment input.

## Current Risk

`createGenerationForUser` is DB-first: it creates a queued `generation_jobs` row, reserves credits, and enqueues the Trigger.dev `generate-wanxiang` task before returning a job id. Wanxiang submit/query, provider-result-to-R2 copy, terminal status updates, single output asset creation, `generation_jobs.output_asset_id`, user media history recording, credit capture, and refund now happen in or around the Trigger worker. The status APIs and workbench previews should use `/api/asset-media/{assetId}` display URLs, not raw provider result URLs or raw R2 `assets.public_url` values.

`generation_jobs` does not store `try_on_mode`, `template_id`, final image/video asset pairs, provider poll counters, attempt counters, or completion timestamps as separate columns. Try-on mode and template id remain in `input_json` and credit metadata for historical traceability.

Remaining watch points:

- Trigger.dev production env must include Postgres, Wanxiang, R2, Sentry/PostHog, and any email vars needed by worker-side code.
- `lib/generations/runner.ts` is disabled legacy code; `trigger/generate-video.ts` should not be used as the active path.
- API route integration tests are still thin; add DB-backed tests around queued creation, Trigger enqueue failure refund, and worker terminal transitions.
