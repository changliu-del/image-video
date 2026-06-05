# Library Assets and Admin

Updated: 2026-06-05

## Purpose

`library_assets` is the first-party reusable material layer for the image-video SaaS. It turns product photos, model photos, garment references, scenes, example images, and example videos into searchable operational assets that can feed the workbenches.

Use this page when a task mentions materials, material library, example media, workbench inspiration, template coverage gaps, Admin asset management, or photo/video catalog optimization.

## Source of Truth

| Area | Files |
|---|---|
| DB schema | `lib/db/schema.ts` (`libraryAssets`, `userMediaHistory`, `LIBRARY_ASSET_CATEGORIES`) |
| Migration | `lib/db/migrations/0009_library_assets.sql`, `lib/db/migrations/0013_simplify_library_assets.sql`, `lib/db/migrations/0014_library_assets_category_unique.sql`, `lib/db/migrations/0017_user_media_history.sql` |
| Storage helpers | `lib/storage/r2.ts` (`buildLibraryAssetStorageKey`, `storageKeyMatchesLibraryAsset`) |
| Public query | `lib/library-assets/query.ts`, `app/api/library-assets/route.ts` |
| Private user history query | `lib/user-media/service.ts`, `app/api/user-media/route.ts`, `app/api/user-media/[id]/route.ts` |
| Admin service | `lib/admin/services/library-assets.ts` |
| Admin API | `app/api/admin/library-assets/**` |
| Admin UI | `components/admin/library-assets-panel.tsx`, `app/(dashboard)/admin/components/admin-shell.tsx` |
| Workbench consumers | `components/create/image-video-workbench.tsx`, `components/create/apparel-workbench.tsx`, `components/create/try-on-workbench.tsx` |

## Data Model

`library_assets` references uploaded rows in `assets` and adds operational metadata:

- `assetId`: the single API/TypeScript field for the linked `assets.id`; the database column remains `asset_id` by SQL convention. Multiple library rows may point to the same `assetId` when the same file needs to appear in different categories.
- `title` and `description`: operator-readable material context.
- `category`: the one routing field for the workbench that should show the material.
- `sortWeight` and `usageCount`: ranking and usage statistics.
- creator/updater audit fields.

Current allowed categories are `image_to_video`, `apparel_image`, and `try_on`.
The DB uniqueness rule is `(asset_id, category)`, not bare `asset_id`.

## Library vs User History

As of 2026-06-05, first-party materials and personal user history are separate product surfaces:

- `library_assets` is the ops/admin curated official library. It is public catalog data, category-routed, reusable across users, and maintained through Admin.
- `user_media_history` is the private per-user history layer. It references uploaded/generated rows in `assets`, can optionally point back to a `library_assets` row or `generation_jobs` row, and stores user-specific state such as visibility, favorite, usage count, and last-used time.

Do not merge these two concepts into one public material table. Workbenches should expose them as separate source tabs, for example official materials and my history. Official material APIs can use the shared public catalog cache policy. User history APIs must use current-user auth and `Cache-Control: no-store`.

`user_media_history.source` values:

- `user_upload`: a user's uploaded input media.
- `generated_image`: a generated image output.
- `generated_video`: a generated video output.
- `ops_library_used`: a user-specific record of using an official library asset.

`user_media_history.role` values classify how the media is used in a workflow: `input`, `output`, `reference`, `garment`, or `model`.

## Lifecycle

1. Ops/admin requests `POST /api/admin/library-assets/presign`.
2. Browser uploads the file to R2 using the signed PUT URL.
3. Client calls `POST /api/admin/library-assets/complete`.
4. The service verifies the R2 object metadata before marking the upload asset as uploaded.
5. The service creates an `assets` upload row and a `library_assets` row.
6. Ops/admin edits title, description, category, and sort weight.
7. Workbenches fetch uploaded category-matched assets through `/api/library-assets`.
8. Admin can remove obsolete assets from the library metadata.

Role boundary: ops can create and edit library asset metadata; admin is required for delete.

Frontend visibility requires the underlying `assets` row to be `uploaded` and the
`library_assets.category` value to match the workbench query.

User history lifecycle:

1. User uploads complete through `POST /api/assets/complete`.
2. The upload remains stored in `assets`, then a best-effort `user_media_history` row is upserted with `source = user_upload`.
3. Successful generation jobs write final image/video asset IDs on `generation_jobs`, then best-effort upsert `generated_image` and/or `generated_video` history rows.
4. Workbenches fetch private history through `/api/user-media?generationType=...`.
5. Users can update title, favorite state, or visibility through `/api/user-media/[id]`; delete is a soft delete.

The history write path must not fail upload completion, job success, or credit settlement. Keep it best-effort and log failures separately.

## Workbench Consumption

Workbench libraries combine generated templates with first-party library assets:

- `/create/video`: `/api/templates?category=image_to_video` plus `/api/library-assets?category=image_to_video`.
- `/create/apparel`: `/api/templates?category=image_to_image` plus `/api/library-assets?category=apparel_image`.
- `/create/try-on`: `/api/templates?category=try_on`, `/api/model-assets`, plus `/api/library-assets?category=try_on`.

Each workbench should keep official library materials and user history visually separated:

- official tab: fetches the public template/library/model catalogs.
- history tab: fetches `/api/user-media` for the current user, uses the item's underlying `assetId` for generation payloads, and never relies on public catalog cache headers.

Keep template IDs and library asset IDs separate. Library assets are inspiration/examples unless the generation payload explicitly supports them as template inputs.

Workbench image grids must not render video URLs through `<img>`. Video assets
should either expose a real image thumbnail/poster or be omitted from image-only
grids.

2026-06-04 public catalog cache policy:

- `/api/templates`, `/api/library-assets`, and `/api/model-assets` return public,
  non-user-specific catalog data and share `publicCatalogReadHeaders` from
  `lib/http/cache-control.ts`.
- The current policy is `public, max-age=60, s-maxage=300,
  stale-while-revalidate=600`: browsers can reuse responses briefly, shared
  caches can absorb repeat catalog reads, and stale data can be served while a
  background refresh catches up.
- Do not reuse this public cache header for account, billing, credits, jobs, or
  any response containing user-specific/private data.

## Admin UX

The Admin shell exposes a dedicated `Library Assets` tab. Expected controls:

- upload file
- preview media
- search and paginate
- edit metadata
- set category and sort weight
- remove according to role

This UI is operational, so keep it dense, predictable, and task-first rather than marketing-like.

2026-06-04 Admin UX cleanup:

- Generic Admin tables should not behave like raw database browsers. Default table columns should show operator-readable fields; IDs, storage keys, Stripe identifiers, provider task IDs, and raw JSON should stay out of the main table unless they are needed for a recovery workflow.
- User management defaults to email, name, account status, role, credit balance, subscription, plan, and creation time. Admin access is role-based; soft-delete timestamps and Stripe IDs are not first-scan fields.
- Asset and generation job tables are for triage. Asset rows should start with an image/video preview, then show media type/status/format/size/timestamps. Generation rows should expose input and output media previews when available, then show generation type, status, input summary, template, credits, and timestamps; product/template summaries are derived from `inputJson`.
- Credit ledger defaults to amount, reason, resulting balance, and creation time. User ID, job ID, Stripe event ID, and metadata remain detail/filter fields.
- Library asset upload should give immediate file feedback, infer a sensible category from the file, auto-fill a readable title when empty, and keep sort weight as the only low-frequency ranking field.
- Library asset details should not expose R2 `storageKey` or long asset URLs as primary operational content; use the preview and open-link affordance instead.
- Admin Help is a practical tab-level operation manual rendered from Markdown. The Help dropdown chooses one page guide, and the renderer only displays that guide's Markdown plus referenced static images from `public/admin-help/`.
- Keep Template Help and Library Asset Help as separate Markdown documents for operators. Chinese operation manuals should follow the four-part structure: introduction, system/interface overview, feature introduction, and business operation guide. Template Help should use real UI screenshots for the Admin template list, Admin edit form, frontend templates page, and matching workbench; avoid abstract field-card/SVG explanations. It should give detailed operator-facing field meanings: why each field is filled, what frontend or generation behavior it affects, and what risk it creates when wrong. Library Asset Help should explain asset fields with cropped workbench material-entry screenshots. Do not add template explanations to the Library Asset page or library asset explanations to the Template page.

2026-06-04 Admin operational search:

- Templates and library assets serve different jobs. Templates are generation recipes: name, description, category, prompt, cost, duration, aspect ratio, tags, and preview media. Library assets are reusable media inventory that feeds one workbench category.
- Admin keyword search should be anchored on operator-facing fields. Templates search name, category, and tag labels/slugs, with ID available for exact lookup. Library assets search title, description, category, asset ID, and MIME format.
- Generic assets search upload type, status, MIME format, user/file ID, and keeps storage keys or public URLs out of default keyword search.
- Generation jobs search product/prompt summary, template ID, status, generation type, provider/status, user email/name, error text, and whitelisted input fields such as product name, headline, prompt, template ID, and aspect ratio. Do not search whole raw JSON or media URLs by default.
- Credit ledger search supports user email/name, credit reason, Stripe event/payment identifiers, job status/type, package/source metadata, and admin notes; user ID, job ID, and date remain explicit filters for reconciliation.

## Operational Notes

- Apply `0009_library_assets.sql`, `0013_simplify_library_assets.sql`, and `0014_library_assets_category_unique.sql` before using the public or Admin routes in any target database.
- Do not automatically run migrations against a remote `POSTGRES_URL` without explicit user confirmation.
- If `/api/library-assets` returns a table-not-found error in local smoke tests, the likely cause is that the target DB has not been migrated yet.
- R2 objects for library assets should use `library-assets/<assetId>.<ext>` keys via `buildLibraryAssetStorageKey`.
- `completeLibraryAsset` must verify the R2 object with `verifyUploadedObject` before marking the DB row uploaded.
- Admin "remove" currently removes the library metadata record; it is not a full R2 object deletion flow.
- The old multi-use field is intentionally removed. `category` is the single workbench routing field; migration keeps old multi-use-case records by copying them into one row per `(assetId, category)`.
- Apply `0017_user_media_history.sql` before enabling user history in a target database.
- `/api/user-media` is private account data. It must keep `getUser()` auth, `user_id` filtering, uploaded-asset filtering, and `Cache-Control: no-store`.

## Validation

For code changes that affect this area, prefer:

```bash
pnpm typecheck
pnpm test tests/user-media-backend.test.ts tests/library-item-utils.test.ts
pnpm test tests/generations-validation.test.ts
pnpm test
pnpm build
```

For frontend-visible changes, browser-smoke:

- `http://localhost:30115/create/video?locale=pt`
- `http://localhost:30115/create/apparel?locale=pt`
- `http://localhost:30115/create/try-on?locale=pt`
- `http://localhost:30115/admin?tab=library-assets`

## Next Improvements

- Add batch import/crawler support so Admin can seed many assets at once.
- Add richer review signals when needed, such as dimensions, duration, aspect ratio, background, product family, and visual risk flags.
- Add Admin affordances for intentionally adding/removing extra category rows that reuse an existing uploaded file.
- Add API route tests around admin role boundaries and public filtering.
