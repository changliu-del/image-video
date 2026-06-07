---
name: image-video-studio
description: Use only when the current workspace is /Users/changliu/workspace/src/github.com/image-video, or when the user explicitly asks for this image-video SaaS project, and Codex needs project background, KB navigation, frontend/backend/QA work, or implementation across routes, workbenches, APIs, providers, credits, payments, templates, library assets, storage, or deployment docs.
---

# Image Video Studio

## Overview

This is the project-specific working mode for `/Users/changliu/workspace/src/github.com/image-video`. It gives Codex a stable KB entrypoint and a token-conscious single-agent development workflow for the personal ecommerce image/video SaaS.

For substantive development work, default to one lead agent working locally through discovery, implementation, validation, and concise handoff. Do not launch specialist subagents as the default workflow. Preserve the ability to update project KB and this skill when new durable project facts or workflow preferences are discovered.

## Canonical Paths

Use these fixed paths before running discovery commands. Do not rediscover the project skill or KB with `find`, `rg --files`, or broad home-directory scans unless one of these paths is missing.

- Project root: `/Users/changliu/workspace/src/github.com/image-video`
- Skill source root: `/Users/changliu/workspace/src/github.com/image-video/plugins/image-video-studio`
- Skill source file: `/Users/changliu/workspace/src/github.com/image-video/plugins/image-video-studio/skills/image-video-studio/SKILL.md`
- Skill cache root: `/Users/changliu/.codex/plugins/cache/personal/image-video-studio/0.1.0+codex.20260603093709`
- Skill cache file: `/Users/changliu/.codex/plugins/cache/personal/image-video-studio/0.1.0+codex.20260603093709/skills/image-video-studio/SKILL.md`
- KB root: `/Users/changliu/workspace/src/github.com/image-video/project-kb`
- KB entrypoint: `/Users/changliu/workspace/src/github.com/image-video/project-kb/README.md`
- Code KB entrypoint: `/Users/changliu/workspace/src/github.com/image-video/project-kb/code-kb/image-video/README.md`
- Latest audit: `/Users/changliu/workspace/src/github.com/image-video/docs/ecommerce-video-saas/06-implementation-progress-and-code-audit.md`

When updating this skill, edit the source under `plugins/image-video-studio/` first, then sync that plugin directory to the cache root so the installed skill sees the same instructions. If the cache version changes after reinstall, use the loaded skill path as the cache file; the source path above remains authoritative.

## Ground Rules

- Only activate this skill for `/Users/changliu/workspace/src/github.com/image-video` or when the user explicitly asks to use this image-video project mode. For Shopee/O2O enterprise repositories, prefer the SRA `development`, `ai-ops`, and `stress` skills instead.
- Do not use this skill for enterprise O2O/Shopee repositories, SRA-KB, or SRA skill/plugin maintenance. If the cwd or task target is outside `/Users/changliu/workspace/src/github.com/image-video` and belongs to O2O intelligence work, stop using this skill and switch to the appropriate SRA skill and KB.
- Treat this as a personal project. Do not import company SRA gates, Confluence workflows, release-diff stages, or dev-agent ceremony unless the user explicitly asks.
- Never write image-video project facts into SRA-KB, `sra-skills`, or `~/.codex/plugins/cache/sra-skills/...`; keep image-video context inside this repo's `project-kb/`, `docs/ecommerce-video-saas/`, and `plugins/image-video-studio/`.
- Prefer the project's existing Next.js, TypeScript, Drizzle, Vitest, R2, Stripe, Wanxiang, and template-management patterns.
- Use CodeGraph first for structural code questions, then read exact files only when needed.
- Preserve user changes. The worktree may already be dirty.
- For frontend work, default to the project frontend rendering contract: persistent dashboard shell, immediate local UI render, focused async data fetches with loading/error/retry, locale-preserving links/actions, and shared catalog/cost modules instead of hardcoded business values.
- Treat first-party materials as a core product surface: use `library_assets` and its Admin flow for reusable images/videos instead of scattering one-off sample URLs inside workbenches.
- After code changes, run the narrowest useful validation first, then expand to `pnpm typecheck`, `pnpm test`, and `pnpm build` when the change spans shared behavior.
- When project understanding changes, update `project-kb/` or `docs/ecommerce-video-saas/` so the next session starts smarter.

## Local Development

The default local development URL is `http://localhost:30115`. Use this as the canonical browser target for local smoke tests and frontend verification; do not grep or rediscover the port before opening the local app.

## Codex Admin Account

Use this admin account when Codex needs to inspect or smoke-test the local Admin console:

- Login URL: `http://localhost:30115/sign-in`
- Admin URL: `http://localhost:30115/admin`
- Email: `codex-admin@local.test`
- Password: `CodexAdmin!2026`
- Role: `admin`

The account is maintained by `pnpm db:seed`, which upserts the user with `role = 'admin'`, `is_admin = true`, `credit_balance = 0`, and `deleted_at = null`.

## KB Loading

Start with `project-kb/README.md`, then load only the section that matches the task:

- Product/business context: `project-kb/business-kb/image-video/README.md`
- Architecture and stable project decisions: `project-kb/core-kb/image-video.md`
- Code modules, API contracts, risky areas: `project-kb/code-kb/image-video/README.md`
- Feature plans and execution notes: `project-kb/td-kb/image-video/README.md`

For frontend-visible changes, also load `project-kb/code-kb/image-video/06-frontend-rendering-architecture.md` before editing routes or components.

For material-library, template, workbench inspiration, or Admin asset-management work, also load `project-kb/code-kb/image-video/07-library-assets-and-admin.md`.

Also consult `docs/ecommerce-video-saas/06-implementation-progress-and-code-audit.md` for the latest implementation audit and known risks.

## Frontend Development Defaults

Use this checklist before and after frontend edits:

- Avoid route-level backend calls for pages whose main UI can render from local copy/catalogs; let the dashboard layout handle authentication.
- Split thin server wrappers from client surfaces when a page has URL params plus async account/API data.
- Keep static controls, plans, workbench forms, and marketing cards usable while optional data loads.
- Use `lib/dashboard/locale-url.ts`, `useDashboardLocale()`, and hidden `locale` fields so links, redirects, and server actions preserve the workspace language.
- Read prices, subscription metadata, credit packages, and generation costs from shared modules such as `lib/payments/catalog.ts` and `lib/generations/credit-costs.ts`.
- Load workbench examples and inspiration through `/api/templates`, `/api/library-assets`, and `/api/model-assets` as appropriate; keep template IDs separate from library asset IDs unless a generation API explicitly supports both.
- Add scoped loading, error, empty, and retry states for every async section.
- Browser-smoke the changed route in the relevant locale after implementation.

## Agent Mode

Default to a single-agent workflow. Keep the critical path in the main thread: inspect the relevant KB/code, implement the smallest coherent patch, validate it, update durable docs when needed, and report the result.

Do not spawn multi-agent development workers merely because a task is substantive, broad, or touches frontend/backend/QA. Multi-agent work is opt-in only: use subagents only when the user explicitly asks for multi-agent/delegated work in the current turn, or after asking for confirmation with a clear token/coordination reason.

When a task would previously have used specialist agents, fold those responsibilities into the single-agent checklist:

- Case/reference pass: gather only the local or external context needed for the current change.
- Frontend/backend implementation: keep edits scoped to the affected modules and existing project patterns.
- QA pass: run focused tests, type checks, and browser smoke after implementation when the surface is user-visible.
- Product/KB pass: update `project-kb/`, `docs/ecommerce-video-saas/`, or this skill when project understanding or workflow rules change.

Keep `references/agent-mode.md` as historical guidance only. Do not follow it as the default workflow unless the user explicitly revives multi-agent mode.

## Implementation Workflow

1. Load the relevant KB pages and current git status.
2. Identify the product goal, affected modules, and validation target.
3. Implement with the smallest coherent patch; avoid speculative rewrites.
4. Validate with focused tests, then broader checks when shared code changed.
5. Update KB/docs when new facts, risks, decisions, or workflow preferences were discovered.
6. When this skill itself needs a durable workflow update, edit the source skill under `plugins/image-video-studio/` first and sync the installed cache copy.
7. Final response should include changed files, validations, and remaining risks.

## Common Validation

Use these commands from the repo root:

```bash
pnpm test tests/generations-validation.test.ts
pnpm typecheck
pnpm test
pnpm build
```

For frontend-visible changes, verify the relevant route at `http://localhost:30115` with the Browser plugin when available.

## Project References

- `references/agent-mode.md`: historical multi-agent orchestration guidance; use only when the user explicitly asks to revive multi-agent mode.
- `references/kb-navigation.md`: KB map and update rules.
- `project-kb/code-kb/image-video/07-library-assets-and-admin.md`: first-party reusable material library and Admin flow.
- `project-kb/`: project-owned knowledge base.
- `docs/ecommerce-video-saas/`: product, deployment, cost, and audit docs.
