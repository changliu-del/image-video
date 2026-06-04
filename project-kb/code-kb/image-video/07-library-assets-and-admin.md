# Library Assets and Admin

Updated: 2026-06-04

## Purpose

`library_assets` is the first-party reusable material layer for the image-video SaaS. It turns product photos, model photos, garment references, scenes, example images, and example videos into searchable operational assets that can feed the workbenches.

Use this page when a task mentions materials, material library, example media, workbench inspiration, template coverage gaps, Admin asset management, or photo/video catalog optimization.

## Source of Truth

| Area | Files |
|---|---|
| DB schema | `lib/db/schema.ts` (`libraryAssets`, `LIBRARY_ASSET_KINDS`, `LIBRARY_ASSET_STATUSES`) |
| Migration | `lib/db/migrations/0009_library_assets.sql` |
| Storage helpers | `lib/storage/r2.ts` (`buildLibraryAssetStorageKey`, `storageKeyMatchesLibraryAsset`) |
| Public query | `lib/library-assets/query.ts`, `app/api/library-assets/route.ts` |
| Admin service | `lib/admin/services/library-assets.ts` |
| Admin API | `app/api/admin/library-assets/**` |
| Admin UI | `components/admin/library-assets-panel.tsx`, `app/(dashboard)/admin/components/admin-shell.tsx` |
| Workbench consumers | `components/create/image-video-workbench.tsx`, `components/create/apparel-workbench.tsx`, `components/create/try-on-workbench.tsx` |

## Data Model

`library_assets` references uploaded rows in `assets` and adds operational metadata:

- `kind`: product image, model image, garment image, scene image, example image, or example video.
- `status`: draft, published, or archived.
- `locale`, `title`, `description`, `source`, and `licenseNote`.
- `tagsJson` and `useCasesJson` as JSON arrays.
- `qualityScore`, `sortWeight`, and `usageCount` for ranking and curation.
- creator/updater/publisher audit fields.

Current allowed workbench use cases are `image_to_video`, `apparel_image`, and `try_on`.

## Lifecycle

1. Ops/admin requests `POST /api/admin/library-assets/presign`.
2. Browser uploads the file to R2 using the signed PUT URL.
3. Client calls `POST /api/admin/library-assets/complete`.
4. The service verifies the R2 object metadata before marking the upload asset as uploaded.
5. The service creates an `assets` upload row and a draft `library_assets` row.
6. Ops edits title, description, tags, use cases, quality score, source, license note, locale, and sort weight.
7. Admin publishes the asset.
8. Workbenches fetch published assets through `/api/library-assets`.
9. Admin can archive or remove obsolete assets from the library.

Role boundary: ops can create and edit drafts; admin is required for publish, archive, and delete.

Publishing requires the underlying `assets` row to be `uploaded`. Do not allow
`library_assets.status = published` while the file is still pending or missing.

## Workbench Consumption

Workbench libraries combine generated templates with first-party library assets:

- `/create/video`: `/api/templates?type=image_to_video` plus `/api/library-assets?useCase=image_to_video`.
- `/create/apparel`: `/api/templates?type=image` plus `/api/library-assets?useCase=apparel_image`.
- `/create/try-on`: `/api/templates?type=image`, `/api/model-assets`, plus `/api/library-assets?useCase=try_on`.

Keep template IDs and library asset IDs separate. Library assets are inspiration/examples unless the generation payload explicitly supports them as template inputs.

Workbench image grids must not render video URLs through `<img>`. Published
video assets should either expose a real image thumbnail/poster or be omitted
from image-only grids.

## Admin UX

The Admin shell exposes a dedicated `Library Assets` tab. Expected controls:

- upload file
- preview media
- search and paginate
- edit metadata
- set tags and use cases
- set quality score and sort weight
- publish/archive/remove according to role

This UI is operational, so keep it dense, predictable, and task-first rather than marketing-like.

2026-06-04 Admin UX cleanup:

- Generic Admin tables should not behave like raw database browsers. Default table columns should show operator-readable fields; IDs, storage keys, Stripe identifiers, provider task IDs, and raw JSON should stay out of the main table unless they are needed for a recovery workflow.
- User management defaults to email, name, account status, role, credit balance, subscription, plan, and creation time. `is_admin`, soft-delete timestamps, and Stripe IDs are not first-scan fields.
- Asset and generation job tables are for triage. Asset rows should start with an image/video preview, then show media type/status/format/size/timestamps. Generation rows should expose input and output media previews when available, then show generation type, status, input summary, template, credits, and timestamps; product/template summaries are derived from `inputJson`.
- Credit ledger defaults to amount, reason, resulting balance, and creation time. User ID, job ID, Stripe event ID, and metadata remain detail/filter fields.
- Library asset upload should give immediate file feedback, infer a sensible material kind from the file, auto-fill a readable title when empty, and fold low-frequency fields such as sort weight, source, and license note behind advanced editing.
- Library asset details should not expose R2 `storageKey` or long asset URLs as primary operational content; use the preview and open-link affordance instead.

2026-06-04 Admin operational search:

- Templates and library assets serve different jobs. Templates are generation recipes: prompt, hook, CTA, type, cost, duration, aspect ratio, tags, and preview media. Library assets are reusable media inventory: product/model/garment/scene/example images or videos that can feed workbenches.
- Admin keyword search should be anchored on operator-facing fields. Templates search title, slug, hook, type, status, locale, CTA, and tag labels/slugs. Library assets search title, description, kind, status, locale, source, tags, use cases, and MIME format.
- Generic assets search upload type, status, MIME format, user/file ID, and keeps storage keys or public URLs out of default keyword search.
- Generation jobs search product/prompt summary, template, status, generation type, provider/status, user email/name, error text, and whitelisted input fields such as product name, headline, prompt, template slug, and aspect ratio. Do not search whole raw JSON or media URLs by default.
- Credit ledger search supports user email/name, credit reason, Stripe event/payment identifiers, job status/type, package/source metadata, and admin notes; user ID, job ID, and date remain explicit filters for reconciliation.

## Operational Notes

- Apply `0009_library_assets.sql` before using the public or Admin routes in any target database.
- Do not automatically run migrations against a remote `POSTGRES_URL` without explicit user confirmation.
- If `/api/library-assets` returns a table-not-found error in local smoke tests, the likely cause is that the target DB has not been migrated yet.
- R2 objects for library assets should use `library-assets/<assetId>.<ext>` keys via `buildLibraryAssetStorageKey`.
- `completeLibraryAsset` must verify the R2 object with `verifyUploadedObject` before marking the DB row uploaded.
- Admin "remove" currently removes the library metadata record; it is not a full R2 object deletion flow.

## Validation

For code changes that affect this area, prefer:

```bash
pnpm typecheck
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
- Add richer quality review fields, including dimensions, duration, aspect ratio, background, product category, and visual risk flags.
- Add locale-aware copy and tags for stronger search and marketplace coverage.
- Add API route tests around admin role boundaries and public filtering.
