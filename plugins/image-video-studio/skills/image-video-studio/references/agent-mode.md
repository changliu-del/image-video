# Image Video Studio Multi-Agent Mode

Use this reference when the user asks for no-token-limit development, "多 agent", broad project planning, or a change that crosses frontend/backend/QA boundaries.

## Lead Agent Responsibilities

- Own the critical path and integration.
- Read the relevant KB first.
- Keep user-facing updates concise.
- Split only independent sidecar work.
- Avoid delegating the next blocking action.
- Review returned patches before integrating them.
- Run final validation and update KB/docs.

## Agent Roles

| Role | Best for | Typical write scope |
|---|---|---|
| Product agent | MVP scope, pricing, credits, user journey, conversion risks | `project-kb/business-kb`, product docs |
| Frontend agent | Workbench UX, dashboard shell, marketing/templates pages, responsive states | `app/**`, `components/**`, frontend tests |
| Backend agent | API routes, generation jobs, providers, credits, Stripe, R2, DB schema | `app/api/**`, `lib/**`, `tests/**` |
| QA agent | Test strategy, regression checklist, build/typecheck/browser verification | `tests/**`, docs/checklists |
| KB/doc agent | Progress notes, architecture decisions, risky areas, open questions | `project-kb/**`, `docs/**` |

## Spawn Template

Use concise task prompts like:

```text
You are the Frontend agent for image-video. Workdir: /Users/changliu/workspace/src/github.com/image-video.
Use project-kb first. You are not alone in this codebase; do not revert other edits.
Scope: inspect and, if asked, edit only components/create/** and app/(dashboard)/create/**.
Goal: identify or implement the frontend slice for <task>. Return changed files, validation, and risks.
```

For backend:

```text
You are the Backend agent for image-video. Workdir: /Users/changliu/workspace/src/github.com/image-video.
Use project-kb first. You are not alone in this codebase; do not revert other edits.
Scope: app/api/**, lib/generations/**, lib/providers/**, lib/credits.ts, lib/storage/**, tests/**.
Goal: implement or analyze the API/provider/credit slice for <task>. Return changed files, validation, and risks.
```

For QA:

```text
You are the QA agent for image-video. Workdir: /Users/changliu/workspace/src/github.com/image-video.
Use project-kb first. Read the current diff and propose focused validation.
Do not modify product code unless explicitly asked. Return commands run, failures, and regression risks.
```

## Coordination Rules

- Assign disjoint write sets.
- Keep shared schema/API changes in the lead agent or a single backend agent.
- Ask QA to verify after implementation has a stable diff.
- Let KB/doc agent update docs after facts are confirmed, not before.
- If two agents return conflicting recommendations, prefer tested behavior and existing project patterns.

## Definition of Done

- The code change is implemented or the research question is answered.
- Relevant tests/build have run or the blocker is documented.
- `project-kb` is updated if architecture, workflows, risks, or decisions changed.
- Final response includes changed files, validation, and next highest-priority risk.
