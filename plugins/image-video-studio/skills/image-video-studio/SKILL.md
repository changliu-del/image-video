---
name: image-video-studio
description: Use for this personal image-video SaaS project when Codex is asked to understand project background, plan substantial changes, coordinate frontend/backend/QA subagents, update the project KB, or implement changes across Next.js routes, workbenches, API routes, generation providers, credits, payments, templates, storage, or deployment docs.
---

# Image Video Studio

## Overview

This is the project-specific working mode for `/Users/changliu/workspace/src/github.com/image-video`. It gives Codex a stable KB entrypoint and a non-corporate, no-token-friction multi-agent development workflow for the personal ecommerce image/video SaaS.

## Ground Rules

- Treat this as a personal project. Do not import company SRA gates, Confluence workflows, release-diff stages, or dev-agent ceremony unless the user explicitly asks.
- Prefer the project's existing Next.js, TypeScript, Drizzle, Vitest, R2, Stripe, Wanxiang, and template-management patterns.
- Use CodeGraph first for structural code questions, then read exact files only when needed.
- Preserve user changes. The worktree may already be dirty.
- After code changes, run the narrowest useful validation first, then expand to `pnpm typecheck`, `pnpm test`, and `pnpm build` when the change spans shared behavior.
- When project understanding changes, update `project-kb/` or `docs/ecommerce-video-saas/` so the next session starts smarter.

## KB Loading

Start with `project-kb/README.md`, then load only the section that matches the task:

- Product/business context: `project-kb/business-kb/image-video/README.md`
- Architecture and stable project decisions: `project-kb/core-kb/image-video.md`
- Code modules, API contracts, risky areas: `project-kb/code-kb/image-video/README.md`
- Feature plans and multi-agent work plans: `project-kb/td-kb/image-video/README.md`

Also consult `docs/ecommerce-video-saas/06-implementation-progress-and-code-audit.md` for the latest implementation audit and known risks.

## Multi-Agent Mode

Use this mode when the user asks for no-token-limit development, multi-agent work, broad project progress analysis, or a change that naturally spans frontend, backend, and QA. This is not `dev-agent`; it is a practical project mode.

The lead agent keeps the critical path local and delegates sidecar tasks with disjoint responsibilities:

- Frontend agent: dashboard shell, marketing pages, workbenches, UX states, browser checks.
- Backend agent: API routes, generation jobs, providers, credits, payments, storage, DB schema.
- QA agent: test plan, Vitest coverage, typecheck/build, route smoke, regression risks.
- KB/doc agent: project-kb updates, docs updates, decision records, open questions.
- Product agent: user flow, pricing/credits, MVP scope, business constraints.

Do not delegate the immediate blocker. Spawn agents only for independent work that can run while the lead agent implements or integrates another slice. Give each worker an explicit write scope and remind it not to revert other edits.

Read `references/agent-mode.md` for role contracts and handoff templates when the task is substantial.

## Implementation Workflow

1. Load the relevant KB pages and current git status.
2. Identify the product goal, affected modules, and validation target.
3. If useful, launch frontend/backend/QA/KB agents with disjoint scopes.
4. Implement with the smallest coherent patch; avoid speculative rewrites.
5. Validate with focused tests, then broader checks when shared code changed.
6. Update KB/docs when new facts, risks, or decisions were discovered.
7. Final response should include changed files, validations, and remaining risks.

## Common Validation

Use these commands from the repo root:

```bash
pnpm test tests/generations-validation.test.ts
pnpm typecheck
pnpm test
pnpm build
```

For frontend-visible changes, start a local server and verify the relevant route with the Browser plugin when available.

## Project References

- `references/agent-mode.md`: detailed multi-agent orchestration mode.
- `references/kb-navigation.md`: KB map and update rules.
- `project-kb/`: project-owned knowledge base.
- `docs/ecommerce-video-saas/`: product, deployment, cost, crawler, and audit docs.
