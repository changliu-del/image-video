# Project Agent Mode Plan

Date: 2026-06-03

## Goal

Create a project-specific Codex mode for this personal image-video SaaS. It should understand project background, load the project KB, and coordinate multiple specialized agents when the user wants broad development help without token-limit concerns.

## Non-Goals

- Do not implement company dev-agent workflow.
- Do not require Confluence, PRD gates, TD approval, release diff, or SRA-KB.
- Do not make plugin behavior depend on company repositories.

## Mode Shape

Lead agent:

- Loads `project-kb/README.md`.
- Chooses relevant KB files.
- Keeps critical path local.
- Delegates independent sidecar work only.
- Integrates results and validates.

Optional agents:

- Frontend
- Backend
- QA
- KB/doc
- Product

## Completion Criteria

- Repo-local plugin exists under `plugins/image-video-studio`.
- Skill exists under plugin `skills/image-video-studio`.
- KB exists under `project-kb`.
- Plugin validates.
- Skill validates.

