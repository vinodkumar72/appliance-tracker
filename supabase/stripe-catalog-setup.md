# Stripe catalog mirror — setup

Makes Stripe the source of truth for pricing tiers. You edit products/prices
**only in the Stripe dashboard**; the `stripe-catalog-sync` edge function
mirrors them into the `plans` table, and the normal sync engine carries them
to every device. The in-app plan editor becomes unnecessary (it warns when a
plan is Stripe-managed).

Do this per Supabase project. Pair environments sensibly:
- **dev** Supabase project ↔ Stripe **test mode** (Sandbox)
- **tester/production** Supabase project ↔ Stripe **live mode** (when you go live)

## 1. Model your tiers in Stripe

For each tier, create a **Product** (Product catalog → Add product):

- **Prices**: add BOTH a monthly recurring price and a yearly recurring price
  (the yearly one is what "billed annually" shows; without it the mirror uses
  monthly × 12).
- **Metadata** (Product → Edit → Metadata) — this is where the app's
  enforcement limits live:

  | key                       | example | meaning                                   |
  |---------------------------|---------|-------------------------------------------|
  | `max_units`               | `50`    | unit limit; omit = unlimited              |
  | `min_units`               | `100`   | "Unlimited (starts at N)" display         |
  | `max_appliances_per_unit` | `10`    | appliance limit per unit; omit = unlimited|
  | `trial_days`              | `14`    | trial length; omit = 0                    |
  | `emoji`                   | `🚀`    | shown on plan lists                       |
  | `most_popular`            | `true`  | highlighted tier                          |

- **Free tier**: create it as a product too (a $0 yearly price), with
  `max_units: 3` etc. The app needs a free plan row as the fallback when a
  paid subscription lapses.

## 2. Deploy the edge function

Supabase dashboard → Edge Functions → Deploy new function:
- Name it exactly `stripe-catalog-sync`, paste
  `supabase/functions/stripe-catalog-sync/index.ts`, deploy.
- In the function's settings, turn **OFF "Enforce JWT verification"**
  (Stripe's webhook calls can't carry a Supabase JWT; the function does its
  own signature/secret checks instead).

## 3. Secrets

Edge Functions → Secrets (or Settings → Edge Functions):
- `STRIPE_SECRET_KEY` — Stripe dashboard → Developers → API keys → Secret key
  (`sk_test_...` for test mode).
- `STRIPE_WEBHOOK_SECRET` — created in step 4; come back and set it.
- `SYNC_SECRET` — a password you invent for triggering manual syncs (step 5).
  Any long random string; generate one in PowerShell with:
  `-join ((48..57)+(97..122) | Get-Random -Count 40 | % {[char]$_})`

## 4. Point a Stripe webhook at the function

Stripe dashboard → Developers → Webhooks → Add endpoint:
- Endpoint URL: `https://<project-ref>.supabase.co/functions/v1/stripe-catalog-sync`
- Events: `product.created`, `product.updated`, `product.deleted`,
  `price.created`, `price.updated`, `price.deleted` — plus, for self-serve
  subscriptions: `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`
- After creating it, copy the **Signing secret** (`whsec_...`) into the
  `STRIPE_WEBHOOK_SECRET` secret (step 3), then redeploy the function so it
  picks the secret up.

## 5. Backfill once

Mirror the catalog that already exists (webhooks only cover future edits).
PowerShell:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "https://<project-ref>.supabase.co/functions/v1/stripe-catalog-sync" `
  -Headers @{ Authorization = "Bearer <SYNC_SECRET value>" } `
  -ContentType "application/json" `
  -Body '{"action":"sync-all"}'
```

Use the `SYNC_SECRET` you set in step 3 (projects still on legacy API keys can
use the `service_role` JWT instead). It answers with the list of mirrored
products. If you get a 401: check the function's "Enforce JWT verification"
toggle is OFF, and that the secret matches exactly. To see the real error
body (PowerShell 5 hides it):

```powershell
curl.exe -s -X POST "https://<project-ref>.supabase.co/functions/v1/stripe-catalog-sync" -H "Authorization: Bearer <SYNC_SECRET value>" -H "Content-Type: application/json" -d "{\"action\":\"sync-all\"}"
```

## 6. Clean up manual plans

The old hand-made plans (ids like `plan-growth`) now duplicate the mirrored
ones (ids like `prod_...`). In the app (as platform owner): Company tab →
Plans → open each old plan → Delete. Companies subscribed to a deleted plan
fall back to the free tier — reassign them to the mirrored plan first
(their company row → Plan).

## Self-serve upgrades (Stripe Checkout)

Company owners/admins can upgrade themselves: Company tab → Upgrade plan (the
button also appears on every "plan limit reached" screen). The flow:

1. The app calls the `create-checkout` function → Stripe Checkout opens.
2. They pay; Stripe fires `checkout.session.completed` at the webhook.
3. `stripe-catalog-sync` writes the `subscriptions` row (the org id rides
   along as `client_reference_id` / subscription metadata).
4. Devices pull it on their next sync — limits lift within a minute.

Renewals extend the period automatically; a cancellation or failed payment
ends the subscription in Stripe, the webhook removes the row, and the company
falls back to free-tier limits. Setup for this piece:

- Run `migration-010-stripe-billing.sql` (adds Stripe price-id columns).
- Redeploy `stripe-catalog-sync` (subscription handling) and re-run the
  step-5 backfill (fills the price ids in).
- Deploy `create-checkout` (JWT verification ON — the app sends the user's
  token). No new secrets; it shares `STRIPE_SECRET_KEY`.
- Add the four subscription events to the webhook (step 4 list).

## How changes flow afterwards

Stripe edit → webhook → `plans` table → devices pull it (≤60s while open).
Archiving a product in Stripe removes the plan everywhere (tombstoned);
un-archiving restores it. If things ever look stale, re-run step 5 — it's
idempotent.
