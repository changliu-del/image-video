# Product Context

Updated: 2026-06-26

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

- Pricing basis: Brazilian local-company/Pix MVP uses 3x provider cost markup and an exact conversion of 1 credit = R$0.10.
- Image-to-video basic mode (`wanxiang_2_6_first_frame`, Wanxiang 2.6 flash 720P no-audio): costs are derived from provider CNY/second cost, CNY->BRL rate snapshot, 3x markup, and R$0.10 credits; default 5s costs 25 credits.
- Image-to-video Pro mode (`wanxiang_2_7`, Wanxiang 2.7 720P): default 5s costs 85 credits.
- Apparel image: 25 credits.
- Try-on single: 25 credits.
- Try-on multi: 50 credits.

## Current Pricing Model

Updated: 2026-06-27

- Subscriptions are offered as Basic, Plus, and Pro.
- Each subscription tier supports monthly and annual billing.
- Annual plans keep monthly credit allowance semantics and bill the same monthly price for 12 months.
- The Brazil/Pix credit wallet uses BRL catalog prices and exact top-up conversion: 100 credits = R$10, 400 credits = R$40, 1200 credits = R$120.
- Monthly subscription allowances are Basic 480 credits / R$48, Plus 2000 credits / R$160, and Pro 6200 credits / R$372.
- Subscription tiers are credit top-ups only. All creation tools remain available independently of the selected subscription tier, so pricing cards should not describe plans as feature unlocks.
- Mock checkout is the only payment path for the current phase; it does not charge real money.
- Mock subscription checkout updates the user's plan and grants the plan's monthly credit allowance immediately.
- Users can also buy one-time top-up credit packages from the workspace credit wallet.
- The dashboard header, Plans page, Credits page, and Profile page should all surface the user's current credit balance or plan state.
