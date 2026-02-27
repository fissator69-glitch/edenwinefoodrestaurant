import { PropsWithChildren } from "react";
import { useAdminAuthGuard } from "@/hooks/useAdminAuthGuard";

export default function ProtectedAdminRoute({ children }: PropsWithChildren) {
  const state = useAdminAuthGuard({ redirectTo: "/admin/login", requireAdmin: true });

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center">
        <div className="text-sm text-muted-foreground">Caricamento…</div>
      </div>
    );
  }

  // redirect handled by hook
  if (state.status !== "authenticated" || !state.isAdmin) return null;

  return <>{children}</>;
}
