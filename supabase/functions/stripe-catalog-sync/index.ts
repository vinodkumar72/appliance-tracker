// Supabase Edge Function: stripe-catalog-sync
//
// Mirrors the Stripe product catalog into the `plans` table so Stripe is the
// single source of truth for pricing tiers. Two entry points:
//
//   1. Stripe webhook (has a stripe-signature header): reacts to
//      product.created/updated/deleted and price.created/updated/deleted,
//      re-syncing the affected product. Archived/deleted products are removed
//      from `plans` and tombstoned in `deletions` so offline devices drop them.
//
//   2. Manual full sync: POST {"action":"sync-all"} with the project's
//      service-role key as the Bearer token — mirrors every active product.
//      Use once after setup, or to repair drift.
//
// Plan fields come from the Stripe product like so:
//   plans.id        = product id ("prod_...")
//   name            = product name
//   yearly_price    = active yearly recurring price ($/yr); if the product has
//                     no yearly price, monthly*12 (so paid plans never look free)
//   monthly_price   = active monthly recurring price ($/mo), null if none
//   emoji, most_popular, max_units, min_units, max_appliances_per_unit,
//   trial_days      = product METADATA keys (strings; most_popular = "true")
//
// Setup (per Supabase project) — see supabase/stripe-catalog-setup.md:
//   - Deploy with "Enforce JWT verification" OFF (Stripe can't send a JWT).
//   - Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.

import Stripe from "npm:stripe";
import { createClient } from "npm:@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const toInt = (v: string | undefined): number | null => {
  if (v === undefined || v.trim() === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

async function removePlan(productId: string) {
  await admin.from("plans").delete().eq("id", productId);
  // Tombstone so synced devices delete their local copy too.
  await admin.from("deletions").upsert(
    { entity: "plan", id: productId, deleted_at: new Date().toISOString() },
    { onConflict: "entity,id" },
  );
  return { id: productId, action: "removed" };
}

async function syncProduct(product: Stripe.Product | Stripe.DeletedProduct) {
  if ("deleted" in product && product.deleted) return removePlan(product.id);
  const p = product as Stripe.Product;
  if (!p.active) return removePlan(p.id);

  // Find the product's active recurring prices (first monthly + first yearly).
  const prices = await stripe.prices.list({ product: p.id, active: true, limit: 100 });
  let monthly: number | null = null;
  let yearly: number | null = null;
  let monthlyPriceId: string | null = null;
  let yearlyPriceId: string | null = null;
  for (const price of prices.data) {
    if (!price.recurring || price.unit_amount === null) continue;
    const amount = price.unit_amount / 100;
    if (price.recurring.interval === "month" && price.recurring.interval_count === 1 && monthly === null) {
      monthly = amount;
      monthlyPriceId = price.id;
    }
    if (price.recurring.interval === "year" && price.recurring.interval_count === 1 && yearly === null) {
      yearly = amount;
      yearlyPriceId = price.id;
    }
  }

  const m = p.metadata ?? {};
  const row = {
    id: p.id,
    name: p.name,
    emoji: m.emoji?.trim() || null,
    // The app treats yearly_price 0 as the free tier, so a monthly-only paid
    // product falls back to monthly*12 rather than looking free.
    yearly_price: yearly ?? (monthly !== null ? monthly * 12 : 0),
    monthly_price: monthly,
    most_popular: m.most_popular === "true",
    max_units: toInt(m.max_units),
    min_units: toInt(m.min_units),
    max_appliances_per_property: toInt(m.max_appliances_per_unit),
    trial_days: toInt(m.trial_days) ?? 0,
    stripe_monthly_price_id: monthlyPriceId,
    stripe_yearly_price_id: yearlyPriceId,
    created_at: new Date(p.created * 1000).toISOString().slice(0, 10),
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("plans").upsert(row);
  if (error) throw new Error(`plans upsert failed: ${error.message}`);
  // Un-archive: if this product was previously removed, clear the tombstone
  // so devices don't re-delete the restored plan.
  await admin.from("deletions").delete().eq("entity", "plan").eq("id", p.id);
  return { id: p.id, name: p.name, action: "synced" };
}

// ---------- subscription provisioning ----------

const toDate = (unix: number | null | undefined): string | null =>
  unix ? new Date(unix * 1000).toISOString().slice(0, 10) : null;

async function removeSubscriptionRow(subId: string) {
  await admin.from("subscriptions").delete().eq("id", subId);
  // Tombstone so synced devices delete their local copy too.
  await admin.from("deletions").upsert(
    { entity: "subscription", id: subId, deleted_at: new Date().toISOString() },
    { onConflict: "entity,id" },
  );
  return { id: subId, action: "subscription removed" };
}

/**
 * Writes a Stripe subscription into the app's `subscriptions` table (row id =
 * Stripe subscription id). The org is identified by the checkout session's
 * client_reference_id or the subscription's org_id metadata — both set by the
 * create-checkout function.
 */
async function upsertSubscription(sub: Stripe.Subscription, orgIdHint?: string | null) {
  const orgId = orgIdHint ?? sub.metadata?.org_id;
  if (!orgId) return { id: sub.id, action: "skipped: no org_id metadata (not created via the app)" };

  if (["canceled", "unpaid", "incomplete_expired", "incomplete"].includes(sub.status)) {
    return removeSubscriptionRow(sub.id);
  }

  const item = sub.items.data[0];
  const productId = item
    ? typeof item.price.product === "string" ? item.price.product : item.price.product.id
    : null;
  if (!productId) return { id: sub.id, action: "skipped: no line items" };

  // The plan must exist (FK). If the webhook raced the catalog mirror, mirror it now.
  const { data: planRow } = await admin.from("plans").select("id").eq("id", productId).maybeSingle();
  if (!planRow) {
    const product = await stripe.products.retrieve(productId);
    await syncProduct(product);
  }

  // Newer Stripe API versions keep the billing period on the item, older on the subscription.
  const periodEnd =
    (sub as unknown as { current_period_end?: number }).current_period_end ??
    (item as unknown as { current_period_end?: number } | undefined)?.current_period_end;

  // One subscription per org: replace a pre-existing manual row (different id)
  // and tombstone it so devices drop their local copy.
  const { data: existing } = await admin
    .from("subscriptions").select("id").eq("org_id", orgId).maybeSingle();
  if (existing && existing.id !== sub.id) {
    await removeSubscriptionRow(existing.id);
  }

  const row = {
    id: sub.id,
    org_id: orgId,
    plan_id: productId,
    status: sub.status === "trialing" ? "trial" : "active",
    started_at: toDate(sub.start_date) ?? new Date().toISOString().slice(0, 10),
    trial_ends_at: toDate(sub.trial_end),
    current_period_end: toDate(periodEnd),
    updated_at: new Date().toISOString(),
  };
  const { error } = await admin.from("subscriptions").upsert(row);
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);
  await admin.from("deletions").delete().eq("entity", "subscription").eq("id", sub.id);
  return { id: sub.id, org: orgId, plan: productId, status: row.status, action: "subscription synced" };
}

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (signature) {
      // ----- Stripe webhook -----
      const event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
        undefined,
        cryptoProvider,
      );

      if (event.type.startsWith("product.")) {
        const result = await syncProduct(
          event.data.object as Stripe.Product | Stripe.DeletedProduct,
        );
        return jsonResponse({ received: true, result });
      }
      if (event.type.startsWith("price.")) {
        const price = event.data.object as Stripe.Price;
        const productId = typeof price.product === "string" ? price.product : price.product.id;
        const product = await stripe.products.retrieve(productId).catch(() => null);
        const result = product ? await syncProduct(product) : { id: productId, action: "product missing" };
        return jsonResponse({ received: true, result });
      }
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) {
          return jsonResponse({ received: true, ignored: "not a subscription checkout" });
        }
        const subId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        const result = await upsertSubscription(sub, session.client_reference_id);
        return jsonResponse({ received: true, result });
      }
      if (event.type.startsWith("customer.subscription.")) {
        const sub = event.data.object as Stripe.Subscription;
        const result =
          event.type === "customer.subscription.deleted"
            ? await removeSubscriptionRow(sub.id)
            : await upsertSubscription(sub);
        return jsonResponse({ received: true, result });
      }
      return jsonResponse({ received: true, ignored: event.type });
    }

    // ----- Manual full sync -----
    // Accepts the SYNC_SECRET you set on the function, or the project's
    // legacy service-role JWT (projects on the new sb_secret_* key style
    // must use SYNC_SECRET — the sb_secret key isn't visible to functions).
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const accepted = [Deno.env.get("SYNC_SECRET"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")]
      .filter((s): s is string => !!s);
    if (!token || !accepted.includes(token)) {
      return jsonResponse({ error: "Not authorized" }, 401);
    }
    let action: string | undefined;
    try {
      action = JSON.parse(body || "{}").action;
    } catch {
      // fall through to the error below
    }
    if (action !== "sync-all") {
      return jsonResponse({ error: 'Send {"action":"sync-all"}' }, 400);
    }
    const products = await stripe.products.list({ active: true, limit: 100 });
    const results = [];
    for (const p of products.data) results.push(await syncProduct(p));
    return jsonResponse({ synced: results.length, results });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
