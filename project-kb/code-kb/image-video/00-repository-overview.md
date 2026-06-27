# Repository Overview

Updated: 2026-06-08

## Top-Level Layout

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router pages and API routes |
| `components/` | UI, marketing, admin, creation workbench components |
| `lib/` | Auth, DB, generation jobs, providers, payments, templates, storage, observability |
| `tests/` | Vitest unit tests |
| `trigger/` | Trigger.dev task entrypoint for active Wanxiang generation worker |
| `docs/ecommerce-video-saas/` | Product, deployment, cost, and audit docs |
| `project-kb/` | Project-owned KB |
| `plugins/image-video-studio/` | Project-specific Codex plugin and skill |

## Main Product Routes

- `/`: localized marketing redirect/entry.
- `/[locale]`: localized home page.
- `/[locale]/templates`: public templates page.
- `/[locale]/pricing`: pricing page.
- `/sign-in`, `/sign-up`: auth.
- `/dashboard`: authenticated creative hub.
- `/create/video`: image-to-video workbench.
- `/create/apparel`: apparel/product image workbench.
- `/create/try-on`: virtual try-on workbench.
- `/admin`: ops/admin management.

Supported public locale values are `en` and `pt`. Do not treat `zh` or Chinese
copy as a required route, translation, test, or data-import target for future
code changes.

## Main API Routes

- `app/api/assets/presign/route.ts`
- `app/api/assets/complete/route.ts`
- `app/api/generations/route.ts`
- `app/api/generations/[id]/status/route.ts`
- `app/api/templates/route.ts`
- `app/api/templates/[id]/route.ts`
- `app/api/model-assets/route.ts`
- `app/api/user-media/route.ts`
- `app/api/user-media/[id]/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/admin/**`
