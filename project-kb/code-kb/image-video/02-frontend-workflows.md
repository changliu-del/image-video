# Frontend Workflows

Updated: 2026-06-04

## Dashboard Shell

- `app/(dashboard)/layout.tsx` protects authenticated dashboard routes with the session token only, so the workspace shell can render without waiting on a user-table read.
- `app/(dashboard)/dashboard-header.tsx` handles language menu, user menu, pricing link, and displayed credits. It starts from the session user id and hydrates account details through `/api/user`.
- `app/(dashboard)/app-shell.tsx` provides sidebar navigation.
- `lib/dashboard/content.ts` provides pt/en/zh dashboard strings.
- `lib/dashboard/locale-url.ts` is the shared server/client URL helper for preserving dashboard locale in redirects and links.

Dashboard header credits and admin visibility are async account details. Do not block the dashboard route on DB user reads just to render those header affordances.

For the default rendering contract, route/data ownership rules, and frontend review checklist, load [06-frontend-rendering-architecture.md](06-frontend-rendering-architecture.md).

## Workbenches

| Workbench | Route | Component |
|---|---|---|
| Image to video | `/create/video` | `components/create/image-video-workbench.tsx` |
| Apparel image | `/create/apparel` | `components/create/apparel-workbench.tsx` |
| Try-on | `/create/try-on` | `components/create/try-on-workbench.tsx` |

Each workbench handles upload, payload construction, generation submission, polling, and result rendering.

Workbench library loading now combines published templates with first-party
library assets:

- `/create/video` loads `image_to_video` templates plus `/api/library-assets?useCase=image_to_video`.
- `/create/apparel` loads image templates plus `/api/library-assets?useCase=apparel_image`; library assets are used for inspiration/examples while template IDs remain template-only payload fields.
- `/create/try-on` loads image templates, `/api/model-assets`, and `/api/library-assets?useCase=try_on`.

Admin has a dedicated `Library Assets` tab for reusable product, model,
garment, scene, example image, and example video materials. It supports
R2-backed upload, metadata editing, publish/archive, tags, use cases, quality
score, and sort weight.

## Frontend Optimization Candidates

- Extract repeated `readResponseError`, `postJson`, `uploadAsset`, `fetchJobStatus`, image validation, item normalization, and result URL selection from the three active workbenches.
- Keep visible pricing, credit packages, and generation cost labels backed by shared catalog/cost modules.
- Browser-test mobile and desktop routes after visual changes.
- Keep operational/dashboard UI restrained and task-first.
