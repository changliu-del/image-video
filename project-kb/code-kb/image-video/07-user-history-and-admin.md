# User History and Admin

Updated: 2026-06-08

`library_assets` has been removed from the active product surface. The project no
longer maintains an official reusable material table, public library asset API,
or Admin Library Assets tab. Reusable official-looking content now belongs to
either templates, the model catalog, or future ingestion work with a clear owner.

## Active Material Surfaces

| Surface | Purpose | Owner |
|---|---|---|
| `templates` | Public image-to-video template recipes with thumbnail/preview asset IDs and prompt | Admin operators |
| `model_catalog_assets` | Model choices for virtual try-on | Model catalog workflow |
| `user_media_history` | Private per-user upload and generation history for support/workbench reuse | Current user, inspected by Admin |
| `assets` | Technical media substrate for uploads, generated outputs, template media, and model media | System |

`assets` is not an operator-facing catalog. Admin should inspect user material
through User History and manage public browsing content through Templates or the
model catalog.

## Removed Surface

The following paths should stay deleted:

- `app/api/library-assets/route.ts`
- `app/api/admin/library-assets/**`
- `components/admin/library-assets-panel.tsx`
- `lib/library-assets/**`
- `lib/admin/services/library-assets.ts`

The schema no longer exports `libraryAssets`, `LIBRARY_ASSET_CATEGORIES`, or a
`user_media_history.library_asset_id` relation. `user_media_history.source`
allows only `user_upload`, `generated_image`, and `generated_video`.

## Workbench Behavior

- `/create/video` uses templates plus the user's private history.
- `/create/apparel` uses templates plus the user's private history.
- `/create/try-on` uses `model_catalog_assets` for model selection plus the user's private garment/history items.

Workbench copy should refer to history when selecting user-owned previous media.
Do not restore "official material" and "my history" source tabs until the team
has a staffed content ingestion and quality workflow.

## Admin Behavior

Admin tabs intentionally exclude Library Assets. Keep the management registry,
Admin search fields, and Help copy aligned with these active areas:

- Overview
- Templates
- User History
- Users
- Generation Jobs
- Credit Ledger
- Help

User History is private support data. It must use current-user scoped APIs and
`Cache-Control: no-store`; it should never be served through public catalog
headers.

## Migration Notes

Historical migration filenames `0009_library_assets.sql`,
`0013_simplify_library_assets.sql`, and `0014_library_assets_category_unique.sql`
are no-ops to preserve migration ordering. `0025_remove_library_assets.sql`
drops the stale table/column if they exist and rewrites old `ops_library_used`
source values before tightening the source check constraint.

## Validation

Useful checks after touching this area:

```bash
pnpm test tests/user-media-backend.test.ts tests/admin-search.test.ts tests/admin-help-tab.test.ts
pnpm typecheck
```
