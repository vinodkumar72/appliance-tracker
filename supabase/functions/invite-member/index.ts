// Supabase Edge Function: invite-member
// Sends an invitation email (Supabase auth invite) to a newly added member.
// Caller must be signed in and be either the platform admin or an
// owner/admin of the org they're inviting into.
//
// Deploy: Supabase dashboard → Edge Functions → Deploy new function →
//   name it exactly "invite-member", paste this file, Deploy.
// No extra secrets needed — SUPABASE_SERVICE_ROLE_KEY is injected automatically.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { email, orgId, redirectTo } = await req.json();
    if (!email || typeof email !== "string") {
      return jsonResponse({ error: "email is required" }, 400);
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

    // Authorization: platform admin, or owner/admin of the target org.
    const { data: caller } = await admin
      .from("app_users")
      .select("id,is_platform_admin")
      .eq("auth_id", userData.user.id)
      .maybeSingle();
    let allowed = !!caller?.is_platform_admin;
    if (!allowed && caller && orgId) {
      const { data: membership } = await admin
        .from("memberships")
        .select("role")
        .eq("org_id", orgId)
        .eq("user_id", caller.id)
        .maybeSingle();
      allowed = membership?.role === "owner" || membership?.role === "admin";
    }
    if (!allowed) {
      return jsonResponse({ error: "Not authorized to invite members" }, 403);
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(
      email.trim(),
      redirectTo ? { redirectTo } : undefined,
    );
    if (error) {
      // Most common: the address already has an account — that's fine, they
      // can just sign in; surface it as a soft message.
      return jsonResponse({ error: error.message }, 400);
    }
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
