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

const schema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "Minimo 8 caratteri"),
});

type Values = z.infer<typeof schema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const title = useMemo(() => (mode === "login" ? "Admin login" : "Crea account admin"), [mode]);

  async function onSubmit(values: Values) {
    setBusy(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
        if (error) throw error;
        toast({ title: "Accesso effettuato" });
        // If user is not yet admin, dashboard will redirect back; still show user id to bootstrap.
        toast({
          title: "User ID",
          description: data.user?.id ?? "(non disponibile)",
        });
        navigate("/admin", { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "Registrazione inviata",
          description: "Conferma l'email, poi torna qui e fai login.",
        });
        toast({ title: "User ID (copialo)", description: data.user?.id ?? "(non disponibile)" });
      }
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
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Accesso riservato. Se è il primo utilizzo, crea un account e poi ti assegno il ruolo <strong>admin</strong>.
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input autoComplete="email" placeholder="nome@dominio.it" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Attendere…" : mode === "login" ? "Entra" : "Crea account"}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                {mode === "login" ? (
                  <button type="button" className="underline underline-offset-4" onClick={() => setMode("signup")}>
                    Primo accesso? Crea account
                  </button>
                ) : (
                  <button type="button" className="underline underline-offset-4" onClick={() => setMode("login")}>
                    Hai già un account? Login
                  </button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
