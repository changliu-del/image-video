# Project KB Navigation

The project KB is rooted at `project-kb/`.

## Scope Boundary

This navigation file is only for `/Users/changliu/workspace/src/github.com/image-video`. For enterprise O2O/Shopee repositories, SRA-KB, or SRA skill/plugin maintenance, use the appropriate SRA skills and their KB instead. Do not write image-video project facts into SRA-KB, `sra-skills`, or `~/.codex/plugins/cache/sra-skills/...`.

## Canonical Paths

Use these paths directly before running discovery commands:

- Project root: `/Users/changliu/workspace/src/github.com/image-video`
- Skill source root: `/Users/changliu/workspace/src/github.com/image-video/plugins/image-video-studio`
- Skill source file: `/Users/changliu/workspace/src/github.com/image-video/plugins/image-video-studio/skills/image-video-studio/SKILL.md`
- Skill cache root: `/Users/changliu/.codex/plugins/cache/personal/image-video-studio/0.1.0+codex.20260603093709`
- KB root: `/Users/changliu/workspace/src/github.com/image-video/project-kb`
- KB entrypoint: `/Users/changliu/workspace/src/github.com/image-video/project-kb/README.md`
- Code KB entrypoint: `/Users/changliu/workspace/src/github.com/image-video/project-kb/code-kb/image-video/README.md`

For skill updates, edit the source plugin first and then sync it to the cache root. If the cache version changes after reinstall, use the loaded skill path as the cache file; the source path stays authoritative.

## Read Order

1. `project-kb/README.md`
2. One matching domain:
   - `core-kb/image-video.md`
   - `code-kb/image-video/README.md`
   - `td-kb/image-video/README.md`
   - `business-kb/image-video/README.md`
3. Exact topic file under that domain.
4. `docs/ecommerce-video-saas/06-implementation-progress-and-code-audit.md` for latest audit.

## Topic Shortcuts

- Frontend route, dashboard, or workbench rendering contract: `project-kb/code-kb/image-video/06-frontend-rendering-architecture.md`
- Reusable material library, Admin asset management, workbench inspiration/examples, or template-material boundaries: `project-kb/code-kb/image-video/07-library-assets-and-admin.md`
- Generation APIs, validation, credit reservation, and provider job lifecycle: `project-kb/code-kb/image-video/03-api-generation-and-credits.md`
- Deployment, env, migration, and operational checks: `project-kb/code-kb/image-video/04-config-and-operations.md`

## Update Rules

- Update `core-kb` when a stable architecture decision changes.
- Update `code-kb` when code structure, contracts, risky areas, or validation entrypoints change.
- Update `td-kb` when a feature plan, module plan, or multi-agent execution plan changes.
- Update `business-kb` when product scope, pricing, credits, or user workflows change.
- Keep docs concise and evidence-based; prefer file paths over memory.
