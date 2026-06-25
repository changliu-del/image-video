# Product Context

Updated: 2026-06-03

## Product

The product helps ecommerce sellers produce short videos, product campaign images, and apparel try-on visuals from uploaded images and model/garment references.

## Primary User Jobs

- Turn one product photo into a short commercial clip.
- Generate campaign/product images from apparel references.
- Combine model and garment references for try-on previews.
- Reuse templates and model assets to reduce creation setup time.
- Buy credits and spend them on generation tasks.

## MVP Business Rules

- Hide raw provider cost from users; sell platform credits.
- Refund credits when generation fails.
- Limit free-user generation quota.
- Keep max upload size at 10 MB for MVP.
- Prefer hosted services until usage justifies self-hosted workers.

## Current Credit Costs

- Image-to-video 5-15s: 2 credits per second; default 5s costs 10 credits.
- Apparel image: 5 credits.
- Try-on single: 5 credits.
- Try-on multi: 10 credits.

## Current Pricing Model

Updated: 2026-06-03

- Subscriptions are offered as Basic, Plus, and Pro.
- Each subscription tier supports monthly and annual billing.
- Annual plans keep monthly credit allowance semantics and show the lower effective monthly price.
- Mock checkout is the only payment path for the current phase; it does not charge real money.
- Mock subscription checkout updates the user's plan and grants the plan's monthly credit allowance immediately.
- Users can also buy one-time top-up credit packages from the workspace credit wallet.
- The dashboard header, Plans page, Credits page, and Profile page should all surface the user's current credit balance or plan state.
