# Image Video Core KB

Updated: 2026-07-01

## Project Identity

`image-video` is a personal ecommerce creative SaaS. Its first commercial target
is helping sellers create product videos, campaign images, and virtual try-on
assets from product/model references. The public product brand used in
marketing/auth copy is `Vendeo`.

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
- Trigger.dev for long-running generation provider work.
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
-> generation_jobs queued row with reserved credits
-> Trigger.dev generate-wanxiang task submits and polls Wanxiang
-> /api/generations/[id]/status reads local DB state
-> final asset rows and capture/refund credits
```

There is also older fal.ai/FFmpeg runner code in `lib/generations/runner.ts` and `trigger/generate-video.ts`. It is a disabled legacy path and should not be used unless it is intentionally rebuilt against the active `generation_jobs` schema.

## Stable Decisions

- Keep this project personal and lightweight; do not add company release workflow unless explicitly requested.
- Do not create a new Git branch for every task. Use the current branch by
  default, and create/switch branches only when the user explicitly asks or
  when a genuinely risky change needs isolated branch review.
- Prefer hosted Vercel, Neon/Postgres, R2, Stripe, and provider APIs before renting servers.
- Keep first-party KB under `project-kb/`.
- Keep product/deployment docs under `docs/ecommerce-video-saas/`.
- Use plugin skill `image-video-studio` for project-specific Codex work.
- Do not design new code for Chinese UI/data support. Active product-facing code
  only needs English and Brazilian Portuguese (`pt`) unless the user explicitly
  asks for a one-off Chinese surface.
- Frontend dashboard pages should use a persistent shell plus async section data: render local controls/catalogs immediately, then hydrate account/API data through focused client fetches with loading/error/retry states. See `project-kb/code-kb/image-video/06-frontend-rendering-architecture.md`.

## Open Architecture Decisions

- Whether to remove/retire the disabled legacy fal.ai + FFmpeg runner, or intentionally revive it with matching migrations, worker code, docs, and frontend status/result contracts.
