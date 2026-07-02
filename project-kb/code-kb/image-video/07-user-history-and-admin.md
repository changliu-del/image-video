# User History and Admin

Updated: 2026-07-01

`library_assets` has been removed from the active product surface. The project no
longer maintains an official reusable material table, public library asset API,
or Admin Library Assets tab. Reusable official-looking content now belongs to
either templates or future ingestion work with a clear owner. Virtual try-on
models are template rows with `type = 'model'`; do not create a separate model
catalog table.

## Active Material Surfaces

| Surface | Purpose | Owner |
|---|---|---|
| `templates` | Public template recipes with thumbnail/preview asset IDs plus URL/MIME snapshots and prompt | Admin operators |
| `templates` with `type = 'model'` | Model choices for virtual try-on, with category/title/prompt carrying model metadata | Model template import workflow |
| `user_media_history` | Private per-user upload and generation history for support/workbench reuse | Current user, inspected by Admin |
| `assets` | Technical media substrate for uploads, generated outputs, template media, and model media | System |

`assets` is not an operator-facing catalog. Admin should inspect user material
through User History and manage public browsing content through Templates or the
model template import workflow.

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

- Workbench uploads should go through the same-origin `/api/assets/upload`
  route, which uploads to R2 server-side, marks the asset uploaded, and records
  user media history. Do not reintroduce browser `PUT` uploads to presigned R2
  URLs in create workbenches; production failures show up as `assets` rows stuck
  in `pending` with no matching `generation_jobs` row.
- `/create/video` uses image-to-video templates, a single uploaded or selected
  first-frame/source image, and an optional appearing model selected from
  `/api/model-assets` (`templates.type = 'model'`). The appearing-model library
  is only shown in Wanxiang 2.7 mode. Switching the workbench back to Wanxiang
  2.6 clears the prompt and hides the model library entry; 2.6 requests must not
  submit `modelTemplateId`. With an appearing model in 2.7, the worker resolves
  the model template preview image and sends both images through the Wanxiang
  2.7 reference-to-video media array: source/product image as Image 1 and model
  image as Image 2.
- `/create/apparel` uses image-to-image templates plus the user's current uploaded product image; it does not load user history. When a template is selected, its preview media is resolved to a provider-accessible background reference image and sent to Wanxiang image edit as Image 1 before the uploaded product image. The provider prompt is prefixed with `背景图参考图1，背景图就是图1。` so the model treats Image 1 as the background.
- `/create/try-on` uses `/api/model-assets`, backed by `templates` rows where
  `type = 'model'`, for model selection plus the user's private garment/history
  items.

Workbench copy should refer to history only on surfaces that still select user-owned previous media.
Do not restore "official material" and "my history" source tabs until the team
has a staffed content ingestion and quality workflow.

## User Dashboard Behavior

The user-facing Personal -> User history page lists only the current user's
generated outputs. It uses `/api/user-media?sourceGroup=generated` for the mixed
view and source-specific filters for `generated_image` and `generated_video`.
Uploaded inputs remain available to workbenches that explicitly need user-owned
materials, but they should not appear in the Personal history page.

## Admin Behavior

Admin tabs intentionally exclude Library Assets. Keep the management registry,
Admin search fields, and Help copy aligned with these active areas:

- Overview
- Templates
- Product Analytics
- User History
- Users
- Generation Jobs
- Credit Ledger
- Help

The Templates Admin sidebar entry expands into type-scoped sub-tabs backed by
`templates.type`: image-to-video, model, image generation, and smart try-on.
Use `type` for the operational page/workbench and `category` only for the
business classification within that type. Each template sub-tab exposes
field-specific Admin filters for template ID, title, and category; avoid
collapsing those controls back into a single generic search box.

Product Analytics is the manual xlsx import surface for workspace ranking
pages. The four ranking types are `sales`, `new`, `promoted`, and
`video-products`, sourced from operator-uploaded FastMoss-style xlsx files.
Imports write a new `product_analytics_batches` row plus
`product_analytics_items`, then switch `product_analytics_active_batches` in the
same transaction and delete older batches for that rank. User-facing
`/analytics/...` pages read only the active batch through
`/api/product-analytics`, so a replacement never exposes a blank intermediate
state. The user-facing ranking API returns the current batch's distinct product
categories and supports category-chip filtering only; do not add a free-text
search surface for these imported rankings. The user-facing ranking table should
render only the imported product image plus FastMoss and TikTok source links;
do not add generic Views, Likes, Actions, or separate video-link columns unless
the workbook contract changes. The dashboard sidebar is the only user-facing
rank navigation; the ranking page header should show the current rank title
only, without Source labels, rank tabs, workbook file names, import timestamps,
or import row counts. Do not patch ranking rows manually; fix the workbook and
re-import from Admin.

Template rows keep `thumbnail_asset_id` and `preview_asset_id` for upload
integrity, but also store `thumbnail_url`, `preview_url`,
`thumbnail_mime_type`, and `preview_mime_type` as read snapshots. Admin template
lists should read these template columns directly instead of joining `assets`
just to render cards or detail previews. The stored URLs still use the stable
app media route `/api/template-media/{assetId}` for compatibility, but public
template list/detail APIs join the referenced asset rows only to resolve direct
`R2_PUBLIC_BASE_URL + storage_key` CDN URLs when the asset is uploaded and the
storage key starts with `templates/`. This keeps public template media bytes off
the Next API hot path while preserving `/api/template-media/{assetId}` as the
fallback route for historical snapshots, range checks, and explicit `external/`
media.

Admin support tables expose field-specific filters for the common operator
lookups. User History supports user email and Material ID (`assetId`) filters.
Users supports email and name filters. Generation Jobs supports a `gen_id`
filter backed by `generation_jobs.id`. Credit Ledger supports user email, job
ID, and a created date range (`createdFrom` / `createdTo`); the end date is
treated as the full selected day for date-input searches. Keep Help copy,
AdminShell filter config, API routes, and service-layer conditions aligned when
adding or renaming these filters.

Users Admin can edit `creditBalance` as an absolute target balance. Any non-zero
credit change from the Users edit form must update `users.credit_balance` and
insert a matching `credit_ledger` row with `reason = 'admin_adjust'` in the same
transaction, with metadata marking the source as `admin_user_edit`.

The runtime Admin shell is English-only. Date filters and dashboard date ranges
must not rely on native `type="date"` rendering, because browser or OS locale can
show non-English empty-state placeholders. Use the Admin `YYYY-MM-DD` text date
input pattern for operator-facing date fields while preserving the same
`YYYY-MM-DD` API query values.

User History is private support data. It must use current-user scoped APIs and
`Cache-Control: no-store`; it should never be served through public catalog
headers.

The media bytes referenced by User History and Generation Jobs should be served
through `/api/asset-media/{assetId}` for browser display. Keep list/detail APIs
private, and do not send raw `assets.public_url` values to workbenches or Admin
previews; that column is R2 storage metadata and can point at a bucket endpoint
that is not public.
`/api/asset-media/{assetId}` is also private user data: it must require the
current session user, scope the asset lookup by `assets.user_id`, and return
`Cache-Control: private, no-store`. Public cache headers belong only on public
template media routes.

Template media route failures should be fixed at the asset ownership layer, not
masked with fallback URLs. Assets whose `storage_key` starts with `templates/`
are treated as R2 template objects and should exist in R2. Historical bundled
starter examples from `public/resources/*` are homepage promo examples, not
public template catalog rows; seed cleanup should retire old
`external/starter/...` template rows instead of republishing them.

## Migration Notes

Historical migration filenames `0009_library_assets.sql`,
`0013_simplify_library_assets.sql`, and `0014_library_assets_category_unique.sql`
are no-ops to preserve migration ordering. `0025_remove_library_assets.sql`
drops the stale table/column if they exist and rewrites old `ops_library_used`
source values before tightening the source check constraint.

`0028_drop_model_catalog_assets.sql` drops the old model catalog table. Model
imports should write `templates.type = 'model'`, put model classifications such
as `男/青年/冷酷` in `category`, put the display name in `title`, and put the
style/feature description in `prompt`. Keep age or segment labels such as
`大童`, `中童`, and `小童` out of `title`; those belong in `category`, while
the title should remain the model name, for example `贝拉`.

Model category storage remains a single `templates.category` string, but the
application treats it as three virtual dimensions for operations and browsing:
gender, age, and style. User-facing try-on model selection and Admin model
template filters/edit forms should parse values such as `男/青年/冷酷` into
`男`, `青年`, and `冷酷`, then compose the same single category string when
saving Admin changes.

User-facing model-library grids should render the model detail image
(`imageUrl` / template `preview_url`) rather than the model thumbnail.
`thumbnailUrl` is only a fallback when no detail image is available.

`0029_rekey_primary_ids_to_sequences.sql` resets the active DB identity model:
`users`, `assets`, `templates`, `generation_jobs`, `user_media_history`,
`credit_ledger`, and email verification rows use integer sequences. `users.id`
starts at `1` and has a positive ID check; resource tables can start at `0`.
The migration preserves existing rows, rekeys UUID-era resource IDs to integer
sequences, updates dependent foreign keys, rewrites stored template media route
URLs, and updates JSON ID references in generation and credit metadata.

## Validation

Useful checks after touching this area:

```bash
pnpm test tests/user-media-backend.test.ts tests/admin-search.test.ts tests/admin-help-tab.test.ts
pnpm typecheck
```
