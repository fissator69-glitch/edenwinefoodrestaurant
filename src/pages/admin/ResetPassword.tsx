import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";

const schema = z
  .object({
    password: z.string().min(8, "Minimo 8 caratteri"),
    confirm: z.string().min(8, "Minimo 8 caratteri"),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Le password non coincidono",
    path: ["confirm"],
  });

type Values = z.infer<typeof schema>;

function isRecoveryLink() {
  // Supabase puts tokens in the URL hash; on recovery links you'll see `type=recovery`
  const hash = window.location.hash ?? "";
  return hash.includes("type=recovery");
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
  });

  const canReset = useMemo(() => isRecoveryLink(), []);

  async function onSubmit(values: Values) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      toast({ title: "Password aggiornata" });
      navigate("/admin/login", { replace: true });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Operazione fallita", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Inserisci una nuova password. Se sei arrivato qui per errore, richiedi di nuovo il reset da <code className="font-mono">/admin/login</code>.
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-4">
          {!canReset ? (
            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              Link non valido o scaduto (manca <code className="font-mono">type=recovery</code>). Torna al login e usa “Password dimenticata?”.
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuova password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conferma password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Attendere…" : "Aggiorna password"}
                </Button>
              </form>
            </Form>
          )}

          <Button variant="outline" className="w-full" onClick={() => navigate("/admin/login")} type="button">
            Torna al login
          </Button>
        </div>
      </div>
    </div>
  );
}
