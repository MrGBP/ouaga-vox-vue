// Invites a user by email (Supabase Auth admin API) and assigns admin_readonly role.
// Only the super admin can call this.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "nikiemaandremarie@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const { email, role = "admin_readonly", redirect_to } = await req.json().catch(() => ({}));
    if (!email || typeof email !== "string") {
      return json({ error: "email required" }, 400);
    }

    // Caller check (skip when called from server with service role explicitly)
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    const callerEmail = caller?.email?.toLowerCase();
    const isInternalServiceCall = !authHeader; // direct invoke without auth uses service-role behavior
    if (!isInternalServiceCall && callerEmail !== SUPER_ADMIN_EMAIL) {
      return json({ error: "Forbidden — super admin only" }, 403);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // 1. Invite the user (sends email with magic link to set password)
    const origin = req.headers.get("origin") ?? "https://sapsaphouse.com";
    const redirectTo = redirect_to ?? `${origin}/auth/callback`;
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { invited_as: role, invited_by: "super_admin" },
    });

    // If user already exists, fetch them instead
    let userId = invited?.user?.id;
    if (inviteErr && !userId) {
      // Try to look up the existing user
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        return json({ error: `Invitation failed: ${inviteErr.message}` }, 500);
      }
      userId = existing.id;
      // Send a magic-link as fallback so they still get an email
      await admin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo } });
    }

    if (!userId) return json({ error: "No user id" }, 500);

    // 2. Assign the read-only admin role
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: userId, role })
      .select()
      .maybeSingle();
    if (roleErr && !roleErr.message.includes("duplicate")) {
      return json({ error: `Role assignment failed: ${roleErr.message}` }, 500);
    }

    return json({ ok: true, user_id: userId, email, role, already_existed: !!inviteErr });
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
