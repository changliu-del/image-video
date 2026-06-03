# Frontend Rendering Architecture

Updated: 2026-06-03

This note captures the default frontend architecture for the image-video SaaS after the dashboard billing/credits review. It should be loaded before broad frontend changes, dashboard route changes, workbench changes, pricing/auth flows, or any UI that mixes static controls with account/API data.

## Default Contract

- Keep the dashboard shell persistent. `app/(dashboard)/layout.tsx` owns authentication and header/sidebar account state. Child pages must not repeat `getUser()` unless they need page-specific privileged data.
- Render the primary UI immediately. Plans, credit packages, workbench controls, marketing cards, and static copy should come from local catalogs/copy modules and should not wait on account/API calls.
- Load dynamic account data through focused API routes or client fetches. Use small surfaces such as `/api/account/billing`, `/api/account/credits`, and `/api/user`; add skeleton, error, empty, and retry states where the data appears.
- Preserve locale everywhere. Use `lib/dashboard/locale-url.ts` for server redirects and shared dashboard URLs, `useDashboardLocale()` for client components, and hidden `locale` fields for server-action forms.
- Do not put broad data fetches in root layout. Public marketing pages should not trigger user/account DB calls. Dashboard layout may fetch the current user because it protects the workspace.
- Keep business numbers shared. Subscription prices live in `lib/payments/catalog.ts`; generation credit costs live in `lib/generations/credit-costs.ts`. Frontend labels must read those helpers instead of hardcoding display costs.
- Marketing pricing is acquisition UI. It should route users into workspace billing/credits. Workspace plans are the functional source of truth.

## Preferred Page Pattern

```text
server page wrapper
  - parse searchParams only
  - no redundant user/db fetch if layout already protects the route
  - render a client surface

client surface
  - render local catalog/copy immediately
  - fetch account or ledger data asynchronously
  - show scoped skeleton/error/retry states
  - keep buttons and core actions available when optional account data is still loading
```

Use this pattern for account, billing, credits, settings, and operational dashboard pages. Admin-only pages may fetch on the server when access control or first paint depends on privileged data.

## 2026-06-03 Frontend Review Results

Fixed in this pass:

- Removed global `/api/user` SWR fallback from `app/layout.tsx`; public pages no longer trigger a root-level user lookup.
- Removed redundant `getUser()` and `force-dynamic` from `/dashboard`; dashboard layout already authenticates.
- Added `lib/dashboard/locale-url.ts` and wired dashboard redirects through it.
- Preserved locale in `/pricing`, `/generate`, `/dashboard/general`, `/create`, login/signup fallback redirects, checkout handoff, and sign-out.
- Moved generation display costs to `lib/generations/credit-costs.ts`; workbench buttons now match backend credit reservation.
- Billing and credits pages already follow the async account-data pattern: catalogs render immediately, account/ledger data loads through `/api/account/*`.
- Removed unused legacy frontend surfaces: `components/create/create-workbench.tsx`, `components/video-generation/*`, `components/landing/*`, and the old `/jobs/[id]` page. The `/api/jobs/[id]` route remains only as a compatibility fallback for workbench polling.

Still watch:

- `components/create/image-video-workbench.tsx`, `apparel-workbench.tsx`, and `try-on-workbench.tsx` still duplicate request, upload, polling, image validation, item normalization, and result URL helpers. Extract a browser-safe shared workbench API helper before changing provider payloads again.
- Workbench library/model loading mostly degrades silently. Future changes should add scoped retry/error affordances without blocking the main creation form.
- Browser smoke should cover desktop and mobile for every frontend-visible change, especially dashboard shell, workbenches, billing/credits, login, and marketing-to-workspace handoff.

## Review Checklist For Future Frontend Changes

- Does the first screen render useful controls before optional data loads?
- Is every fetch scoped to the page/section that needs it?
- Does every async area have loading, error, empty, and retry states?
- Are locale-bearing links, redirects, and server-action forms preserving `locale`?
- Are prices, credits, generation costs, and plan metadata read from shared catalog/cost modules?
- Is the dashboard shell stable during route transitions?
- Did browser smoke verify the exact changed route in the relevant locale?
