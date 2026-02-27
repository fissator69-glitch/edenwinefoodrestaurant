import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type AdminAuthState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "authenticated"; userId: string; isAdmin: boolean };

async function checkAdmin(userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw error;
  return Boolean(data);
}

export function useAdminAuthGuard(opts?: { redirectTo?: string; requireAdmin?: boolean }) {
  const navigate = useNavigate();
  const redirectTo = opts?.redirectTo ?? "/admin/login";
  const requireAdmin = opts?.requireAdmin ?? true;

  const [state, setState] = useState<AdminAuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (!session?.user) {
        setState({ status: "anon" });
        return;
      }
      const userId = session.user.id;
      setState({ status: "authenticated", userId, isAdmin: false });
      // Admin check async
      checkAdmin(userId)
        .then((isAdmin) => {
          if (cancelled) return;
          setState({ status: "authenticated", userId, isAdmin });
        })
        .catch(() => {
          if (cancelled) return;
          setState({ status: "authenticated", userId, isAdmin: false });
        });
    });

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (cancelled) return;
        const user = data.session?.user;
        if (!user) {
          setState({ status: "anon" });
          return;
        }
        const isAdmin = await checkAdmin(user.id).catch(() => false);
        if (cancelled) return;
        setState({ status: "authenticated", userId: user.id, isAdmin });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "anon" });
      });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const shouldRedirect = useMemo(() => {
    if (state.status === "loading") return false;
    if (state.status === "anon") return true;
    if (requireAdmin && !state.isAdmin) return true;
    return false;
  }, [state, requireAdmin]);

  useEffect(() => {
    if (!shouldRedirect) return;
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, shouldRedirect]);

  return state;
}
