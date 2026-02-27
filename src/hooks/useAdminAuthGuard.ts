import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type AdminAuthState =
  | { status: "loading" }
  | { status: "anon" }
  | { status: "authenticated"; userId: string; isAdmin: boolean | null };

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

      // Stato intermedio: autenticato ma ruolo in verifica (NON redirectare).
      setState({ status: "authenticated", userId, isAdmin: null });

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

        const userId = user.id;
        setState({ status: "authenticated", userId, isAdmin: null });

        const isAdmin = await checkAdmin(userId).catch(() => false);
        if (cancelled) return;
        setState({ status: "authenticated", userId, isAdmin });
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

    // Se sto ancora verificando il ruolo, non redirectare.
    if (state.isAdmin === null) return false;

    if (requireAdmin && !state.isAdmin) return true;
    return false;
  }, [state, requireAdmin]);

  useEffect(() => {
    if (!shouldRedirect) return;
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, shouldRedirect]);

  return state;
}
