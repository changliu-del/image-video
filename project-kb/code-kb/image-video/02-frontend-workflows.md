# Frontend Workflows

Updated: 2026-06-03

## Dashboard Shell

- `app/(dashboard)/layout.tsx` protects authenticated dashboard routes.
- `app/(dashboard)/dashboard-header.tsx` handles language menu, user menu, pricing link, and displayed credits.
- `app/(dashboard)/app-shell.tsx` provides sidebar navigation.
- `lib/dashboard/content.ts` provides pt/en/zh dashboard strings.
- `lib/dashboard/locale-url.ts` is the shared server/client URL helper for preserving dashboard locale in redirects and links.

Dashboard header credits are wired to the authenticated user balance from `app/(dashboard)/layout.tsx`.

For the default rendering contract, route/data ownership rules, and frontend review checklist, load [06-frontend-rendering-architecture.md](06-frontend-rendering-architecture.md).

## Workbenches

| Workbench | Route | Component |
|---|---|---|
| Image to video | `/create/video` | `components/create/image-video-workbench.tsx` |
| Apparel image | `/create/apparel` | `components/create/apparel-workbench.tsx` |
| Try-on | `/create/try-on` | `components/create/try-on-workbench.tsx` |

Each workbench handles upload, payload construction, generation submission, polling, and result rendering.

## Frontend Optimization Candidates

- Extract repeated `readResponseError`, `postJson`, `uploadAsset`, `fetchJobStatus`, image validation, item normalization, and result URL selection from the three active workbenches.
- Keep visible pricing, credit packages, and generation cost labels backed by shared catalog/cost modules.
- Browser-test mobile and desktop routes after visual changes.
- Keep operational/dashboard UI restrained and task-first.
