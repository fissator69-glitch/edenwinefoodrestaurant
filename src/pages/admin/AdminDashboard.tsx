import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

import { useSiteSettings } from "@/hooks/content/useSiteSettings";
import { useSocialLinks } from "@/hooks/content/useSocialLinks";
import { useSiteFooter } from "@/hooks/content/useSiteFooter";
import { useMediaAssets } from "@/hooks/content/useMediaAssets";

function jsonSafeParse(text: string) {
  try {
    return { ok: true as const, value: JSON.parse(text) };
  } catch (e: any) {
    return { ok: false as const, error: e?.message ?? "JSON non valido" };
  }
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const settings = useSiteSettings();
  const footer = useSiteFooter();
  const socials = useSocialLinks({ includeDisabled: true });
  const media = useMediaAssets();

  const [contactPhone, setContactPhone] = useState("+390805248160");
  const [whatsPhone, setWhatsPhone] = useState("393497152524");
  const [address, setAddress] = useState("Via Santa Maria della Stella, 66\n70010 Adelfia (BA)");
  const [mapsUrl, setMapsUrl] = useState(
    "https://www.google.com/maps/search/?api=1&query=Via%20Santa%20Maria%20della%20Stella%2066%20Adelfia",
  );

  const [privacyText, setPrivacyText] = useState(
    "Contenuto placeholder. Inserisci qui Privacy Policy, Cookie Policy e dettagli legali.",
  );

  const [footerJson, setFooterJson] = useState(
    JSON.stringify(
      {
        brandName: "EDEN",
        description: "Food · Wine · Restaurant. Un Eden contemporaneo nel cuore della Puglia.",
        designBy: "Giovanni Macina",
        sections: [
          { label: "L'esperienza", href: "#eden" },
          { label: "Cucina", href: "#cucina" },
          { label: "Galleria", href: "#gallery" },
          { label: "Eventi", href: "#eventi" },
          { label: "Recensioni", href: "#recensioni" },
          { label: "Contatti", href: "#contatti" },
        ],
      },
      null,
      2,
    ),
  );

  // hydrate from backend (best-effort)
  useMemo(() => {
    if (settings.data) {
      const c = settings.data["contact"];
      if (c?.phone) setContactPhone(c.phone);
      if (c?.whatsapp) setWhatsPhone(c.whatsapp);
      if (c?.address) setAddress(c.address);
      if (c?.mapsUrl) setMapsUrl(c.mapsUrl);

      const p = settings.data["privacy"];
      if (p?.text) setPrivacyText(p.text);
    }
    if (footer.data) {
      setFooterJson(JSON.stringify(footer.data, null, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data, footer.data]);

  async function saveSettings() {
    try {
      const payload = {
        contact: { phone: contactPhone, whatsapp: whatsPhone, address, mapsUrl },
        privacy: { text: privacyText },
      };

      const { error } = await supabase.from("site_settings").upsert({ key: "contact", value: payload.contact });
      if (error) throw error;
      const { error: e2 } = await supabase.from("site_settings").upsert({ key: "privacy", value: payload.privacy });
      if (e2) throw e2;

      await qc.invalidateQueries({ queryKey: ["site_settings"] });
      toast({ title: "Salvato" });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Salvataggio fallito", variant: "destructive" });
    }
  }

  async function saveFooter() {
    const parsed = jsonSafeParse(footerJson);
    if (!parsed.ok) {
      toast({ title: "Errore", description: parsed.error, variant: "destructive" });
      return;
    }

    try {
      // singleton: keep one row (upsert by inserting new if none)
      const { data: existing, error: selErr } = await supabase.from("site_footer").select("id").limit(1).maybeSingle();
      if (selErr) throw selErr;

      if (existing?.id) {
        const { error } = await supabase.from("site_footer").update({ content: parsed.value }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_footer").insert({ content: parsed.value });
        if (error) throw error;
      }

      await qc.invalidateQueries({ queryKey: ["site_footer"] });
      toast({ title: "Footer salvato" });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Salvataggio fallito", variant: "destructive" });
    }
  }

  async function addSocial() {
    try {
      const { error } = await supabase.from("social_links").insert({ platform: "instagram", url: "https://instagram.com/", order: 0, enabled: true });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["social_links"] });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Operazione fallita", variant: "destructive" });
    }
  }

  async function updateSocial(id: string, patch: Partial<{ platform: string; url: string; order: number; enabled: boolean }>) {
    try {
      const { error } = await supabase.from("social_links").update(patch).eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["social_links"] });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Operazione fallita", variant: "destructive" });
    }
  }

  async function removeSocial(id: string) {
    try {
      const { error } = await supabase.from("social_links").delete().eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["social_links"] });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Operazione fallita", variant: "destructive" });
    }
  }

  async function uploadMedia(file: File) {
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage.from("site-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("media_assets").insert({ bucket: "site-media", path, alt: null, tags: [] });
      if (insErr) throw insErr;

      await qc.invalidateQueries({ queryKey: ["media_assets"] });
      toast({ title: "Caricato" });
    } catch (e: any) {
      toast({ title: "Errore upload", description: e?.message ?? "Upload fallito", variant: "destructive" });
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
            <p className="text-sm text-muted-foreground">Modifica contenuti, media e footer (inclusi social con icone).</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            Logout
          </Button>
        </div>

        <Tabs defaultValue="settings">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="settings">Contatti</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Telefono (tel:)</div>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+39080..." />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">WhatsApp (solo numeri)</div>
                  <Input value={whatsPhone} onChange={(e) => setWhatsPhone(e.target.value)} placeholder="39349..." />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Indirizzo</div>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Link Maps</div>
                <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
              </div>
              <Button onClick={saveSettings}>
                Salva contatti
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="text-sm font-medium">Testo Privacy & Cookie</div>
              <Textarea value={privacyText} onChange={(e) => setPrivacyText(e.target.value)} className="min-h-[180px]" />
              <Button onClick={saveSettings}>Salva privacy</Button>
            </div>
          </TabsContent>

          <TabsContent value="footer">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="text-sm text-muted-foreground">Per ora il footer è gestito come JSON (massima libertà: “TUTTO”).</div>
              <Textarea value={footerJson} onChange={(e) => setFooterJson(e.target.value)} className="min-h-[280px] font-mono text-xs" />
              <Button onClick={saveFooter}>Salva footer</Button>
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">Gestisci link social (le icone vengono scelte in base a platform).</div>
                <Button onClick={addSocial}>Aggiungi</Button>
              </div>

              <div className="space-y-3">
                {(socials.data ?? []).map((s) => (
                  <div key={s.id} className="grid gap-3 sm:grid-cols-12 items-center">
                    <div className="sm:col-span-3">
                      <Input value={s.platform} onChange={(e) => updateSocial(s.id, { platform: e.target.value })} placeholder="instagram" />
                    </div>
                    <div className="sm:col-span-6">
                      <Input value={s.url} onChange={(e) => updateSocial(s.id, { url: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="sm:col-span-1">
                      <Input
                        value={String(s.order)}
                        onChange={(e) => updateSocial(s.id, { order: Number(e.target.value || 0) })}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={(e) => updateSocial(s.id, { enabled: e.target.checked })}
                        />
                        On
                      </label>
                    </div>
                    <div className="sm:col-span-1">
                      <Button variant="destructive" size="sm" onClick={() => removeSocial(s.id)}>
                        X
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="media">
            <div className="rounded-lg border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">Carica foto (bucket: site-media) e riusale nelle pagine.</div>
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadMedia(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <Button asChild>
                    <span>Upload</span>
                  </Button>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(media.data ?? []).slice(0, 20).map((m) => (
                  <div key={m.id} className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground break-all">{m.bucket}/{m.path}</div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
