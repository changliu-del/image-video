# Image Video Core KB

Updated: 2026-06-03

## Project Identity

`image-video` is a personal ecommerce creative SaaS. Its first commercial target is helping sellers create product videos, campaign images, and virtual try-on assets from product/model references.

The project should optimize for fast commercial validation:

- Clear upload-to-generation workflow.
- Low operational overhead.
- Credits-based pricing rather than exposing provider costs.
- Hosted services before self-hosted infrastructure.

## Current Stack

- Next.js App Router with React 19 and TypeScript.
- Drizzle ORM with Postgres.
- Cloudflare R2 for user uploads and media assets.
- Wanxiang providers for image-to-video, apparel image, and try-on.
- Stripe for credits and subscriptions, with local mock payments in development.
- Sentry and PostHog for observability.
- Vitest for unit tests.

## Current Architecture Direction

Current production-facing generation code is centered on:

```text
frontend workbench
-> /api/assets/presign
-> browser PUT to R2
-> /api/assets/complete
-> /api/generations
-> Wanxiang submit
-> generation_jobs running row with reserved credits
-> /api/generations/[id]/status polls Wanxiang
-> final asset rows and capture/refund credits
```

There is also older Trigger.dev/fal.ai/FFmpeg runner code in `lib/generations/runner.ts` and `trigger/generate-video.ts`. It does not currently match the active `generation_jobs` schema and should be treated as a pending architecture decision.

## Stable Decisions

- Keep this project personal and lightweight; do not add company release workflow unless explicitly requested.
- Prefer hosted Vercel, Neon/Postgres, R2, Stripe, and provider APIs before renting servers.
- Keep first-party KB under `project-kb/`.
- Keep product/deployment docs under `docs/ecommerce-video-saas/`.
- Use plugin skill `image-video-studio` for project-specific Codex work.
- Frontend dashboard pages should use a persistent shell plus async section data: render local controls/catalogs immediately, then hydrate account/API data through focused client fetches with loading/error/retry states. See `project-kb/code-kb/image-video/06-frontend-rendering-architecture.md`.

## Open Architecture Decisions

- Whether to remove/retire Trigger.dev + fal.ai + FFmpeg runner, or revive it with matching migrations.
- Whether generation creation should become DB-first with `queued/submitting` status before provider submit.
