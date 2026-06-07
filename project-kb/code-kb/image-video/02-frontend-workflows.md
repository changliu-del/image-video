# Frontend Workflows

Updated: 2026-06-05

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

Workbench library loading separates official material catalogs from private user
history:

- `/create/video` loads `image_to_video` templates plus `/api/library-assets?category=image_to_video` for official inspiration, and `/api/user-media?generationType=image_to_video` for the user's private history.
- `/create/apparel` loads image templates plus `/api/library-assets?category=apparel_image`; library assets are used for inspiration/examples while template IDs remain template-only payload fields. The history tab uses `/api/user-media?generationType=apparel_image`.
- `/create/try-on` loads image templates, `/api/model-assets`, and `/api/library-assets?category=try_on` for official material/model choices. The history tab uses `/api/user-media?generationType=try_on`.

Admin exposes two material surfaces:

- `Library Assets` is the official reusable material library for product, model,
  garment, scene, example image, and example video materials. It supports
  R2-backed upload, metadata editing, category routing, sort weight, and admin
  removal.
- `User History` is the private per-user material history from
  `user_media_history`. It is for support and operations inspection, not for
  replacing the public official catalog.

`assets` remains a technical substrate. Do not reintroduce a generic Admin
`assets` table as a primary management surface. `category` is the single
workbench routing field for official library assets; the old multi-use field is
not a separate frontend filter.

## Frontend Optimization Candidates

- Extract repeated `readResponseError`, `postJson`, `uploadAsset`, `fetchJobStatus`, image validation, item normalization, and result URL selection from the three active workbenches.
- Keep visible pricing, credit packages, and generation cost labels backed by shared catalog/cost modules.
- Browser-test mobile and desktop routes after visual changes.
- Keep operational/dashboard UI restrained and task-first.
