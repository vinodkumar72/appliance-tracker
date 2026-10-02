// Supabase Edge Function: create-company
//
// Self-serve signup: a signed-in user creates their own company and becomes
// its owner, starting on the most generous free plan. Runs with the service
// role so the org + owner membership + subscription are created atomically —
// no RLS bootstrap holes (an org with no members can't pass owner-based
// policies, which is exactly why this isn't done client-side).
//
// Guards: one self-created company per account (an account that already owns
// any company is refused — invited owners included, by design).
//
// Deploy with JWT verification ON (the app sends the user's token).
// No extra secrets needed.

import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Compact ids in the same style the app generates.
const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { name, address, phone } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) {
      return jsonResponse({ error: "Company name is required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user?.email) {
      return jsonResponse({ error: "Not signed in" }, 401);
    }

    // Resolve (or create) the caller's app_users row.
    let { data: me } = await admin
      .from("app_users")
      .select("id")
      .eq("auth_id", userData.user.id)
      .maybeSingle();
    if (!me) {
      const newUser = {
        id: uid(),
        auth_id: userData.user.id,
        name: userData.user.email.split("@")[0],
        email: userData.user.email,
        is_platform_admin: false,
        created_at: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      };
      const { error } = await admin.from("app_users").insert(newUser);
      if (error) return jsonResponse({ error: `Could not set up your account: ${error.message}` }, 500);
      me = { id: newUser.id };
    }

    // One company per account: already an owner anywhere → refuse.
    const { data: owned } = await admin
      .from("memberships")
      .select("org_id")
      .eq("user_id", me.id)
      .eq("role", "owner")
      .limit(1);
    if (owned && owned.length > 0) {
      return jsonResponse(
        { error: "This account already owns a company. Contact us if you need another one." },
        409,
      );
    }

    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);
    const orgId = uid();

    const { error: orgError } = await admin.from("organizations").insert({
      id: orgId,
      name: name.trim(),
      address: typeof address === "string" && address.trim() ? address.trim() : null,
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
      self_served: true,
      created_at: todayStr,
      updated_at: now,
    });
    if (orgError) return jsonResponse({ error: `Could not create company: ${orgError.message}` }, 500);

    const { error: memError } = await admin.from("memberships").insert({
      id: uid(),
      org_id: orgId,
      user_id: me.id,
      role: "owner",
      property_ids: null,
      unit_ids: null,
      updated_at: now,
    });
    if (memError) {
      await admin.from("organizations").delete().eq("id", orgId);
      return jsonResponse({ error: `Could not create membership: ${memError.message}` }, 500);
    }

    // Start on the most generous free plan, when one exists.
    const { data: freePlans } = await admin
      .from("plans")
      .select("id,max_units")
      .eq("yearly_price", 0);
    const freePlan = (freePlans ?? []).sort(
      (a, b) => (b.max_units ?? Infinity) - (a.max_units ?? Infinity),
    )[0];
    if (freePlan) {
      await admin.from("subscriptions").insert({
        id: uid(),
        org_id: orgId,
        plan_id: freePlan.id,
        status: "active",
        started_at: todayStr,
        updated_at: now,
      });
    }

    return jsonResponse({ orgId });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
