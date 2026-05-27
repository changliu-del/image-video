# image-video

电商图生视频 SaaS MVP，基于 Next.js SaaS Starter 构建。

## What It Does

The app lets a signed-in user upload a product image, fill ecommerce copy, spend credits, and create an image-to-video generation job. Long-running video work is handled outside Vercel by Trigger.dev, fal.ai, FFmpeg, and Cloudflare R2.

Core flow:

```text
upload product image
-> create generation job
-> reserve credits
-> Trigger.dev runs fal.ai image-to-video
-> FFmpeg adds ecommerce overlays
-> upload final video and thumbnail to R2
-> preview/download in dashboard
```

## Stack

- Next.js App Router + SaaS Starter auth/dashboard
- Drizzle ORM + Neon Postgres
- Cloudflare R2 for uploads and videos
- Trigger.dev for long-running jobs
- fal.ai for image-to-video generation
- FFmpeg for ecommerce overlays
- Stripe for credits purchase
- Sentry and PostHog for observability

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create environment variables:

```bash
cp .env.example .env
```

Run database migrations and seed starter data:

```bash
pnpm db:migrate
pnpm db:seed
```

Start the app:

```bash
pnpm dev
```

Starter test account:

```text
email: test@test.com
password: admin123
```

## Useful Commands

```bash
pnpm typecheck
pnpm build
pnpm db:generate
pnpm db:migrate
```

## Documentation

Product and deployment requirements live in `docs/ecommerce-video-saas/`.
