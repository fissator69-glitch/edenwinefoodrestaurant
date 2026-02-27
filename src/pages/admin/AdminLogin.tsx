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

const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "Minimo 8 caratteri"),
});

const emailOnlySchema = z.object({
  email: z.string().email("Email non valida"),
});

type LoginValues = z.infer<typeof loginSchema>;
type EmailValues = z.infer<typeof emailOnlySchema>;

type Mode = "login" | "signup" | "forgot";

function friendlyAuthError(err: any): { title: string; description?: string; showResend?: boolean } {
  const code = err?.code ?? err?.error_code;

  if (code === "email_not_confirmed") {
    return {
      title: "Email non confermata",
      description: "Controlla la casella (anche spam) oppure reinvia la mail di conferma.",
      showResend: true,
    };
  }

  if (code === "invalid_credentials") {
    return { title: "Email o password errate", description: "Ricontrolla i dati oppure usa “Password dimenticata?”." };
  }

  // fallback
  return { title: "Errore", description: err?.message ?? "Operazione fallita" };
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [lastEmail, setLastEmail] = useState<string>("");
  const [canResendConfirm, setCanResendConfirm] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  });

  const title = useMemo(() => {
    if (mode === "login") return "Admin login";
    if (mode === "signup") return "Crea account";
    return "Password dimenticata";
  }, [mode]);


  async function resendConfirmation(email?: string) {
    const target = (email ?? lastEmail).trim();
    if (!target) return;

    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email: target });
      if (error) throw error;
      toast({ title: "Email di conferma reinviata", description: "Controlla la posta (anche spam)." });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Operazione fallita", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitLogin(values: LoginValues) {
    setBusy(true);
    setLastEmail(values.email);
    setCanResendConfirm(false);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
      if (error) throw error;
      toast({ title: "Accesso effettuato" });
      toast({ title: "User ID", description: data.user?.id ?? "(non disponibile)" });
      navigate("/admin", { replace: true });
    } catch (e: any) {
      // log tecnico (utile), ma toast user-friendly
      console.error("AdminLogin error", e);
      const msg = friendlyAuthError(e);
      setCanResendConfirm(Boolean(msg.showResend));
      toast({ title: msg.title, description: msg.description, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitSignup(values: LoginValues) {
    setBusy(true);
    setLastEmail(values.email);
    setCanResendConfirm(false);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast({ title: "Registrazione inviata", description: "Conferma l'email, poi torna qui e fai login." });
      toast({ title: "User ID (copialo)", description: data.user?.id ?? "(non disponibile)" });
      setMode("login");
    } catch (e: any) {
      console.error("AdminSignup error", e);
      const msg = friendlyAuthError(e);
      setCanResendConfirm(Boolean(msg.showResend));
      toast({ title: msg.title, description: msg.description, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitForgot(values: EmailValues) {
    setBusy(true);
    setLastEmail(values.email);
    setCanResendConfirm(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Email inviata", description: "Apri il link che hai ricevuto per impostare una nuova password." });
      setMode("login");
    } catch (e: any) {
      console.error("ForgotPassword error", e);
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

        <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-5">
          {canResendConfirm && (
            <div className="rounded-md border bg-muted/30 p-4 text-sm flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">Email non confermata</div>
                <div className="text-muted-foreground">Reinvia la mail di conferma a {lastEmail || "questa email"}.</div>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => resendConfirmation()}>
                Reinvia
              </Button>
            </div>
          )}

          {mode !== "forgot" ? (
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(mode === "login" ? onSubmitLogin : onSubmitSignup)}
                className="space-y-5"
              >
                <FormField
                  control={loginForm.control}
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
                  control={loginForm.control}
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

                {mode === "login" && (
                  <button
                    type="button"
                    className="w-full text-sm text-muted-foreground underline underline-offset-4"
                    onClick={() => {
                      emailForm.setValue("email", loginForm.getValues("email"));
                      setMode("forgot");
                    }}
                  >
                    Password dimenticata?
                  </button>
                )}

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
          ) : (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onSubmitForgot)} className="space-y-5">
                <FormField
                  control={emailForm.control}
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

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Attendere…" : "Invia link reset"}
                </Button>

                <Button type="button" variant="outline" className="w-full" onClick={() => setMode("login")}>
                  Torna al login
                </Button>
              </form>
            </Form>
          )}
        </div>

        {lastEmail && mode === "login" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground underline underline-offset-4"
              disabled={busy}
              onClick={() => resendConfirmation(lastEmail)}
            >
              Non trovi la conferma? Reinvia email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
