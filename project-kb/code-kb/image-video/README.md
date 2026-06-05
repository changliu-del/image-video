# Image Video Code KB

Updated: 2026-06-05

## Topic Index

- [00-repository-overview.md](00-repository-overview.md)
- [01-runtime-architecture.md](01-runtime-architecture.md)
- [02-frontend-workflows.md](02-frontend-workflows.md)
- [03-api-generation-and-credits.md](03-api-generation-and-credits.md)
- [04-config-and-operations.md](04-config-and-operations.md)
- [05-risky-change-areas.md](05-risky-change-areas.md)
- [06-frontend-rendering-architecture.md](06-frontend-rendering-architecture.md)
- [07-library-assets-and-admin.md](07-library-assets-and-admin.md)

## Fast Topic Routing

- Material/library asset upload, category routing, workbench inspiration, and Admin UX: [07-library-assets-and-admin.md](07-library-assets-and-admin.md)
- Frontend rendering contract for dashboard/workbench routes: [06-frontend-rendering-architecture.md](06-frontend-rendering-architecture.md)
- Generation API payloads, credit reservation, and provider jobs: [03-api-generation-and-credits.md](03-api-generation-and-credits.md)
- Env, migrations, deployment, and operational caveats: [04-config-and-operations.md](04-config-and-operations.md)

## Validation Entry Points

```bash
pnpm test tests/generations-validation.test.ts
pnpm typecheck
pnpm test
pnpm build
```

## Current Audit

The latest broad audit is in [docs/ecommerce-video-saas/06-implementation-progress-and-code-audit.md](../../../docs/ecommerce-video-saas/06-implementation-progress-and-code-audit.md).
