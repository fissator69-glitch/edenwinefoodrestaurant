// Supabase Edge Function: admin-users
// - GET  : list users (admin only)
// - DELETE: delete user by id (admin only, cannot self-delete)

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET,DELETE,OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !anonKey || !serviceKey) {
      return json({ error: "Server misconfigured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.slice("Bearer ".length);

    const authClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }

    const requesterId = claimsData.claims.sub as string;

    const adminClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: isAdmin, error: roleErr } = await adminClient.rpc("has_role", {
      _user_id: requesterId,
      _role: "admin",
    });

    if (roleErr) return json({ error: "Role check failed" }, 500);
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    if (req.method === "GET") {
      const u = new URL(req.url);
      const page = Math.max(1, Number(u.searchParams.get("page") ?? "1"));
      const perPage = Math.min(200, Math.max(1, Number(u.searchParams.get("perPage") ?? "50")));

      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) return json({ error: error.message }, 500);

      const users = (data.users ?? []).map((user: any) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        email_confirmed_at: user.email_confirmed_at,
      }));

      return json({ users, page, perPage, total: data.total ?? null });
    }

    if (req.method === "DELETE") {
      const body = await req.json().catch(() => ({}));
      const userId = String(body?.userId ?? "").trim();
      if (!userId) return json({ error: "Missing userId" }, 400);

      if (userId === requesterId) {
        return json({ error: "Cannot delete your own account" }, 400);
      }

      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 500);

      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e: any) {
    return json({ error: e?.message ?? "Unexpected error" }, 500);
  }
});
