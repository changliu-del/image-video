# Frontend Workflows

Updated: 2026-06-08

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

Workbench material loading now uses templates, the model catalog, and private
user history. The standalone official material catalog has been removed.

- `/create/video` loads `/api/templates?type=image_to_video` and `/api/user-media?generationType=image_to_video` for the user's private history.
- The public homepage template gallery and public templates page reuse the same image-to-video template catalog by querying `type=image_to_video`.
- Template list responses drive browsing with `id`, `type`, `category`, `thumbnailUrl`, and `previewUrl`; detail fetches add `prompt` before applying a template.
- Template list/detail HTTP cache headers stay short (`max-age=30`, `s-maxage=60`) because Admin can edit template media and prompt. The server-side base-array cache is cleared by Admin template writes, while media bytes are served through `/api/template-media/{assetId}` with range support and a memory/R2/external fallback path.
- Template `category` is a business category inside `type`; do not use category values such as `image_to_video`, `image_to_image`, or `try_on` as the template workflow selector.
- `/create/apparel` uses templates plus `/api/user-media?generationType=apparel_image` for user-owned previous product images.
- `/create/try-on` loads `/api/model-assets` for model choices plus `/api/user-media?generationType=try_on` for user-owned garment/history items.

Admin exposes one private material support surface:

- `User History` is the private per-user material history from
  `user_media_history`. It is for support and operations inspection, not for
  replacing a public catalog.

`assets` remains a technical substrate. Do not reintroduce a generic Admin
`assets` table as a primary management surface. Do not restore official
material source tabs without a staffed content ingestion and quality workflow.

## Frontend Optimization Candidates

- Extract repeated `readResponseError`, `postJson`, `uploadAsset`, `fetchJobStatus`, image validation, item normalization, and result URL selection from the three active workbenches.
- Keep visible pricing, credit packages, and generation cost labels backed by shared catalog/cost modules.
- Browser-test mobile and desktop routes after visual changes.
- Keep operational/dashboard UI restrained and task-first.
