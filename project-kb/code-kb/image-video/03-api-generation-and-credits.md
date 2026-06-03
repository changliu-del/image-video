# API, Generation, and Credits

Updated: 2026-06-03

## Request Validation

`lib/generations/validation.ts` owns API request normalization. It currently supports:

- Upload validation for png/jpeg/webp up to 10 MB.
- Generation types: `image_to_video`, `apparel_image`, `try_on`.
- Legacy `image-to-video` alias.
- Optional workbench fields: `templateId`, `templateSlug`.
- Empty prompt strings as omitted prompt.
- Apparel controls: `strength`, `variants`.
- Try-on modes: `single`, `multi`.

## Credits

`lib/credits.ts` supports:

- reserve
- capture
- refund
- purchased credits
- signup free credits
- admin adjustments

## Pricing and Mock Payments

Updated: 2026-06-03

- `lib/payments/catalog.ts` is the shared source of truth for subscription plans and one-time credit packages.
- Subscription plans are Basic, Plus, and Pro across `month` and `year` intervals.
- `lib/payments/mock.ts` derives mock Stripe products/prices from the catalog and still exposes `MOCK_MONTHLY_PLANS` for compatibility.
- `lib/payments/stripe.ts` routes mock subscription checkout through the same local grant/update flow for monthly and annual plans.
- `/dashboard/billing` is the primary workspace Plans page; `/dashboard/credits` is the credit wallet and ledger page.
- The unlocalized `/pricing` dashboard route redirects to `/dashboard/billing`; localized marketing pricing pages remain public ads and link into workspace Plans/Credits.
- `app/(dashboard)/layout.tsx` fetches the DB user so the header can display the real credit balance instead of demo data.

Generation credit cost is currently:

- Image-to-video 5s: 10 credits.
- Image-to-video 8s: 18 credits.
- Image-to-video 10s: 25 credits.
- Apparel image: 5 credits.
- Try-on single: 5 credits.
- Try-on multi: 10 credits.

## Current Risk

`createGenerationForUser` submits to provider before inserting the local job row and reserving credits in the final transaction. If provider submit succeeds and DB write fails, a provider-side orphan task can exist. Prefer DB-first job creation for the next major backend cleanup.
