# Image Video Studio Opt-In Multi-Agent Mode

This is historical and opt-in guidance. Use it only when the user explicitly asks for "多 agent", multi-agent delegation, no-token-limit development, or a delegated plan in the current turn.

Default image-video work stays in the current agent. The current agent should load the relevant KB, implement the coherent patch, validate it, and update docs or KB when project facts change.

## Lead Agent Responsibilities

- Own the critical path and integration.
- Read the relevant KB first.
- Keep user-facing updates concise.
- Spawn specialist agents only after the user explicitly asks for delegated multi-agent work.
- For broad delegated work, the usual specialist set is case-search, reference-code, frontend implementation, backend implementation, and QA implementation.
- Add Product or KB/doc agents only when scope, pricing, documentation, or durable project memory needs them.
- Split only independent sidecar work with explicit write scopes.
- Avoid delegating the next blocking action.
- Review returned patches before integrating them.
- Run final validation and update KB/docs.

## Agent Roles

| Role | Best for | Typical write scope |
|---|---|---|
| Case-search agent | Competitor examples, UX/product references, implementation cases, external patterns | Research notes in handoff only; docs only if explicitly scoped |
| Reference-code agent | Existing local architecture, CodeGraph lookups, adjacent route/API/component/test conventions | Research notes in handoff only; no edits by default |
| Frontend implementation agent | Workbench UX, dashboard shell, marketing/templates pages, responsive states | `app/**`, `components/**`, frontend tests |
| Backend implementation agent | API routes, generation jobs, providers, credits, Stripe, R2, DB schema | `app/api/**`, `lib/**`, `tests/**` |
| QA implementation agent | Test implementation, regression checklist, build/typecheck/browser verification | `tests/**`, QA docs/checklists; product code only with explicit scope |
| Product agent | MVP scope, pricing, credits, user journey, conversion risks | `project-kb/business-kb`, product docs |
| KB/doc agent | Progress notes, architecture decisions, risky areas, open questions | `project-kb/**`, `docs/**` |

## Spawn Template

Use concise task prompts like:

```text
You are the Case-search agent for image-video. Workdir: /Users/changliu/workspace/src/github.com/image-video.
Use project-kb first. You are not alone in this codebase; do not revert other edits.
Scope: research only unless explicitly asked to edit docs.
Goal: find relevant external product/UX/implementation cases for <task>. Prefer reliable direct sources, cite links when browsing is used, and return applicable patterns, anti-patterns, and risks.
```

For reference code:

```text
You are the Reference-code agent for image-video. Workdir: /Users/changliu/workspace/src/github.com/image-video.
Use project-kb first and CodeGraph first for structural code questions. You are not alone in this codebase; do not revert other edits.
Scope: local code research only unless explicitly asked to edit.
Goal: identify existing routes, components, APIs, services, tests, and conventions relevant to <task>. Return file references, reusable patterns, and integration risks.
```

For frontend implementation:

```text
You are the Frontend implementation agent for image-video. Workdir: /Users/changliu/workspace/src/github.com/image-video.
Use project-kb first. You are not alone in this codebase; do not revert other edits.
Scope: inspect and, if asked, edit only components/create/** and app/(dashboard)/create/**.
Goal: identify or implement the frontend slice for <task>. Return changed files, validation, and risks.
```

For backend:

```text
You are the Backend implementation agent for image-video. Workdir: /Users/changliu/workspace/src/github.com/image-video.
Use project-kb first. You are not alone in this codebase; do not revert other edits.
Scope: app/api/**, lib/generations/**, lib/providers/**, lib/credits.ts, lib/storage/**, tests/**.
Goal: implement or analyze the API/provider/credit slice for <task>. Return changed files, validation, and risks.
```

For QA:

```text
You are the QA implementation agent for image-video. Workdir: /Users/changliu/workspace/src/github.com/image-video.
Use project-kb first. Read the current diff and propose focused validation.
Scope: tests/** and QA docs/checklists unless explicitly asked to edit product code.
Goal: implement or update focused tests for <task>, run the narrowest useful validation, and return commands run, failures, and regression risks.
```

## Coordination Rules

- Assign disjoint write sets.
- Keep shared schema/API changes in the lead agent or a single backend agent.
- If multi-agent mode is explicitly enabled, start case-search and reference-code first when the task needs discovery; their handoffs should shape frontend/backend implementation.
- Ask QA to verify after implementation has a stable diff, or to prepare tests in parallel when behavior is already clear.
- Let KB/doc agent update docs after facts are confirmed, not before.
- If two agents return conflicting recommendations, prefer tested behavior and existing project patterns.

## Definition of Done

- The code change is implemented or the research question is answered.
- Relevant tests/build have run or the blocker is documented.
- `project-kb` is updated if architecture, workflows, risks, or decisions changed.
- Final response includes changed files, validation, and next highest-priority risk.
