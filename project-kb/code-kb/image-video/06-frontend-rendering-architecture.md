# Frontend Rendering Architecture

Updated: 2026-06-27

This note captures the default frontend architecture for the image-video SaaS after the dashboard billing/credits review. It should be loaded before broad frontend changes, dashboard route changes, workbench changes, pricing/auth flows, or any UI that mixes static controls with account/API data.

## Default Contract

- Keep the dashboard shell persistent. `app/(dashboard)/layout.tsx` owns session-token access control, not full account hydration. Header/sidebar account details should load through focused client fetches such as `/api/user`.
- Render the primary UI immediately. Plans, credit packages, workbench controls, marketing cards, and static copy should come from local catalogs/copy modules and should not wait on account/API calls.
- Load dynamic account data through focused API routes or client fetches. Use small surfaces such as `/api/account/billing`, `/api/account/credits`, and `/api/user`; add skeleton, error, empty, and retry states where the data appears. Account balance, plan, and admin-link visibility should not block workspace first paint.
- Preserve supported locale everywhere. The active product locales are English
  and Brazilian Portuguese (`pt`); new code should not add Chinese (`zh`) UI,
  data, route, or test obligations. Use `lib/dashboard/locale-url.ts` for server
  redirects and shared dashboard URLs, `useDashboardLocale()` for client
  components, and hidden `locale` fields for server-action forms.
- Do not put broad data fetches in root layout. Public marketing pages should not trigger user/account DB calls. Dashboard layout should verify the session token and let account-specific DB data hydrate asynchronously.
- Keep business numbers shared. Subscription prices live in `lib/payments/catalog.ts`; generation credit costs live in `lib/generations/credit-costs.ts`. Frontend labels must read those helpers instead of hardcoding display costs.
- Marketing pricing is acquisition UI. It should route users into workspace billing/credits. Workspace plans are the functional source of truth.

## Preferred Page Pattern

```text
server page wrapper
  - parse searchParams only
  - no redundant user/db fetch if session-gated layout already protects the route
  - render a client surface

client surface
  - render local catalog/copy immediately
  - fetch account or ledger data asynchronously
  - show scoped skeleton/error/retry states
  - keep buttons and core actions available when optional account data is still loading
```

Use this pattern for account, billing, credits, settings, and operational dashboard pages. Admin surfaces should render a lightweight loading/forbidden shell and fetch `/api/user` client-side for role gating; Admin APIs still enforce ops/admin permissions server-side.

## 2026-06-04 Workspace Loading Update

Fixed in this pass:

- `/dashboard` no longer waits on a DB `getUser()` call before rendering the workspace shell. `app/(dashboard)/layout.tsx` verifies the session token through `getSessionUserId()`, then the header fetches `/api/user` for balance, plan, user menu, and admin-link state.
- `/admin` also uses session-first rendering. `app/(dashboard)/admin/page.tsx` only redirects unauthenticated sessions; `AdminShell` fetches `/api/user` client-side before showing ops/admin tabs or the forbidden state. Admin data APIs remain server-authorized.
- Marketing home template catalog refresh is deferred with `IntersectionObserver`, so users who click into the workspace immediately are not competing with `/api/templates`.
- Template catalog lists are stable public data. Cache list results by `type` and
  business `category`, render thumbnails from `thumbnailUrl`, and keep
  `previewUrl` in the list response so card hover can play the warmed template
  video without first opening detail. Fetch detail by template id only when a
  user opens or applies a template so `prompt` does not bloat the first list
  response.
- Template text is locale-aware for the supported product locales. The API
  accepts `locale` and resolves
  `title_translations_json` and `prompt_translations_json` before returning
  `title` and detail `prompt`; `category` stays a stable code and UI surfaces
  localize it through `getTemplateCategoryLabel`. Active template imports and
  refresh scripts should keep English base fields plus Brazilian Portuguese
  translations, not Chinese translation keys.
- Dashboard demo video loading now triggers closer to viewport entry to reduce first-navigation media contention.

## 2026-06-24 Auth Refresh Fix

- `proxy.ts` only checks whether a `session` cookie is present before allowing
  protected workspace paths to continue. It must not import
  `lib/auth/session`, verify JWTs, refresh JWT expiry, or delete invalid
  session cookies from the proxy runtime.
- `app/(dashboard)/layout.tsx` is `force-dynamic` and owns the real session
  token verification through `getSessionUserId()`. This keeps JWT verification
  in the Node runtime that signs the login cookie and avoids deploy-time
  proxy/edge env drift causing a fresh login to be cleared on page refresh.

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
- Are supported-locale links, redirects, and server-action forms preserving `locale`?
- Are prices, credits, generation costs, and plan metadata read from shared catalog/cost modules?
- Is the dashboard shell stable during route transitions?
- Did browser smoke verify the exact changed route in the relevant supported locale?
