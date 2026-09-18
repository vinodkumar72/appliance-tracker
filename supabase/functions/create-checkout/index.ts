// Supabase Edge Function: create-checkout
//
// Starts a Stripe Checkout session so a company owner/admin can pay for a
// plan themselves. Returns { url } — the app redirects the browser there.
// The session carries the org id (client_reference_id + subscription
// metadata), which is how the stripe-catalog-sync webhook later knows which
// company the payment belongs to.
//
// Caller must be signed in and be an owner/admin of the org (or the platform
// admin). Deploy with JWT verification ON (the app sends the user's token).
// Secrets: STRIPE_SECRET_KEY (shared with stripe-catalog-sync).

import Stripe from "npm:stripe";
import { createClient } from "npm:@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { orgId, planId, interval, successUrl, cancelUrl } = await req.json();
    if (!orgId || !planId) return jsonResponse({ error: "orgId and planId are required" }, 400);
    if (interval !== "month" && interval !== "year") {
      return jsonResponse({ error: 'interval must be "month" or "year"' }, 400);
    }
    if (!/^https?:\/\//.test(successUrl ?? "") || !/^https?:\/\//.test(cancelUrl ?? "")) {
      return jsonResponse({ error: "successUrl and cancelUrl are required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identify the caller from their JWT.
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) {
      return jsonResponse({ error: "Not signed in" }, 401);
    }

    // Authorization: platform admin, or owner/admin of the org being upgraded.
    const { data: caller } = await admin
      .from("app_users")
      .select("id,is_platform_admin")
      .eq("auth_id", userData.user.id)
      .maybeSingle();
    let allowed = !!caller?.is_platform_admin;
    if (!allowed && caller) {
      const { data: membership } = await admin
        .from("memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", caller.id)
        .maybeSingle();
      allowed = membership?.role === "owner" || membership?.role === "admin";
    }
    if (!allowed) {
      return jsonResponse({ error: "Only a company owner or admin can upgrade the plan" }, 403);
    }

    // Resolve the Stripe price for the requested plan + interval.
    const { data: plan } = await admin
      .from("plans")
      .select("name,trial_days,stripe_monthly_price_id,stripe_yearly_price_id")
      .eq("id", planId)
      .maybeSingle();
    if (!plan) return jsonResponse({ error: "Plan not found" }, 404);
    const priceId =
      interval === "month" ? plan.stripe_monthly_price_id : plan.stripe_yearly_price_id;
    if (!priceId) {
      return jsonResponse(
        { error: `${plan.name} has no ${interval === "month" ? "monthly" : "yearly"} price in Stripe. Run the catalog backfill after migration 010, or add the price in Stripe.` },
        400,
      );
    }

    // Trial: the plan's trial_days apply automatically (card collected now,
    // first charge when the trial ends) — but one trial per company, EVER.
    // Any paid-plan history (an active subscription, a running trial, or an
    // expired one — including trials assigned at onboarding) means no new
    // trial: upgrading after a lapsed trial starts billing immediately.
    let trialDays = Number(plan.trial_days ?? 0);
    if (trialDays > 0) {
      const { data: currentSub } = await admin
        .from("subscriptions")
        .select("plan_id")
        .eq("org_id", orgId)
        .maybeSingle();
      if (currentSub) {
        const { data: currentPlan } = await admin
          .from("plans")
          .select("yearly_price")
          .eq("id", currentSub.plan_id)
          .maybeSingle();
        if (Number(currentPlan?.yearly_price ?? 0) > 0) trialDays = 0;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userData.user.email ?? undefined,
      client_reference_id: orgId,
      subscription_data: {
        metadata: { org_id: orgId },
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
      },
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return jsonResponse({ url: session.url });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
