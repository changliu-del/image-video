# Runtime Architecture

Updated: 2026-06-03

## Active Generation Flow

```text
Workbench selects file and options
-> POST /api/assets/presign
-> browser uploads to signed R2 PUT URL
-> POST /api/assets/complete
-> POST /api/generations
-> lib/generations/validation.ts normalizes payload
-> lib/generations/jobs.ts validates assets, limits, and credits
-> Wanxiang submit via lib/providers/wanxiang/*
-> generation_jobs row created as running
-> frontend polls /api/generations/[id]/status
-> status route queries Wanxiang
-> success creates final_image/final_video assets and captures credits
-> failure refunds reserved credits
```

## Provider Files

- `lib/providers/wanxiang/img-to-video.ts`
- `lib/providers/wanxiang/cloth.ts`
- `lib/providers/wanxiang/starlink.ts`
- `lib/providers/wanxiang/models.ts`
- `lib/providers/video/fal.ts` remains for older runner path.

## Data Model

Key tables are defined in `lib/db/schema.ts`:

- `users`
- `assets`
- `templates`
- `template_tags`
- `template_assets`
- `model_catalog_assets`
- `generation_jobs`
- `credit_ledger`

## Architecture Caveat

`lib/generations/runner.ts` expects fields and statuses that are not currently present in active migrations/schema. Treat it as inactive or legacy until intentionally reconciled.

