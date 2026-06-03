# Frontend Workflows

Updated: 2026-06-03

## Dashboard Shell

- `app/(dashboard)/layout.tsx` protects authenticated dashboard routes.
- `app/(dashboard)/dashboard-header.tsx` handles language menu, user menu, pricing link, and displayed credits.
- `app/(dashboard)/app-shell.tsx` provides sidebar navigation.
- `lib/dashboard/content.ts` provides pt/en/zh dashboard strings.

Known issue: header credits currently display hardcoded `510`; this should be wired to the real user credit balance.

## Workbenches

| Workbench | Route | Component |
|---|---|---|
| Image to video | `/create/video` | `components/create/image-video-workbench.tsx` |
| Apparel image | `/create/apparel` | `components/create/apparel-workbench.tsx` |
| Try-on | `/create/try-on` | `components/create/try-on-workbench.tsx` |

Each workbench handles upload, payload construction, generation submission, polling, and result rendering.

## Frontend Optimization Candidates

- Extract repeated `readResponseError`, `postJson`, `uploadAsset`, `fetchJobStatus`, image validation, and result URL selection.
- Replace hardcoded credit display/cost labels with API-backed values.
- Browser-test mobile and desktop routes after visual changes.
- Keep operational/dashboard UI restrained and task-first.

