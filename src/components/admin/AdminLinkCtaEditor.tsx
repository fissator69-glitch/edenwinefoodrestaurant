import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

import { getSetting, useSiteSettings } from "@/hooks/content/useSiteSettings";
import { CTA_FALLBACK, type CtaSettings } from "@/hooks/content/useCtaSettings";

function mergeCta(base: CtaSettings, patch: Partial<CtaSettings>): CtaSettings {
  return {
    whatsappTemplates: { ...base.whatsappTemplates, ...(patch.whatsappTemplates ?? {}) },
    heroButtons: {
      home: { ...base.heroButtons.home, ...(patch.heroButtons?.home ?? {}) } as any,
      locanda: { ...base.heroButtons.locanda, ...(patch.heroButtons?.locanda ?? {}) } as any,
      masseria: { ...base.heroButtons.masseria, ...(patch.heroButtons?.masseria ?? {}) } as any,
    },
  };
}

export default function AdminLinkCtaEditor() {
  const qc = useQueryClient();
  const settings = useSiteSettings();

  const ctaValue = useMemo(() => getSetting(settings.data, "cta", CTA_FALLBACK), [settings.data]);

  const [homeTpl, setHomeTpl] = useState(ctaValue.whatsappTemplates.home);
  const [locandaTpl, setLocandaTpl] = useState(ctaValue.whatsappTemplates.locanda);
  const [masseriaTpl, setMasseriaTpl] = useState(ctaValue.whatsappTemplates.masseria);

  const contact = getSetting(settings.data, "contact", {
    phone: "+390805248160",
    whatsapp: "393497152524",
    address: "Via Santa Maria della Stella, 66\n70010 Adelfia (BA)",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Via%20Santa%20Maria%20della%20Stella%2066%20Adelfia",
  });

  const [mapsUrl, setMapsUrl] = useState(String(contact.mapsUrl ?? ""));

  const [homePrimaryLabel, setHomePrimaryLabel] = useState(ctaValue.heroButtons.home.primary.label);
  const [homePrimaryHref, setHomePrimaryHref] = useState(ctaValue.heroButtons.home.primary.href);
  const [homeSecondaryLabel, setHomeSecondaryLabel] = useState(ctaValue.heroButtons.home.secondary.label);
  const [homeSecondaryHref, setHomeSecondaryHref] = useState(ctaValue.heroButtons.home.secondary.href);

  const [locPrimaryLabel, setLocPrimaryLabel] = useState(ctaValue.heroButtons.locanda.primary.label);
  const [locPrimaryHref, setLocPrimaryHref] = useState(ctaValue.heroButtons.locanda.primary.href);
  const [locSecondaryLabel, setLocSecondaryLabel] = useState(ctaValue.heroButtons.locanda.secondary.label);
  const [locSecondaryHref, setLocSecondaryHref] = useState(ctaValue.heroButtons.locanda.secondary.href);

  const [masPrimaryLabel, setMasPrimaryLabel] = useState(ctaValue.heroButtons.masseria.primary.label);
  const [masPrimaryHref, setMasPrimaryHref] = useState(ctaValue.heroButtons.masseria.primary.href);
  const [masSecondaryLabel, setMasSecondaryLabel] = useState(ctaValue.heroButtons.masseria.secondary.label);
  const [masSecondaryHref, setMasSecondaryHref] = useState(ctaValue.heroButtons.masseria.secondary.href);

  // hydrate best-effort
  useMemo(() => {
    if (!settings.data) return;
    const cta = getSetting(settings.data, "cta", CTA_FALLBACK);
    setHomeTpl(cta.whatsappTemplates.home);
    setLocandaTpl(cta.whatsappTemplates.locanda);
    setMasseriaTpl(cta.whatsappTemplates.masseria);

    const c = getSetting(settings.data, "contact", contact);
    setMapsUrl(String(c.mapsUrl ?? ""));

    setHomePrimaryLabel(cta.heroButtons.home.primary.label);
    setHomePrimaryHref(cta.heroButtons.home.primary.href);
    setHomeSecondaryLabel(cta.heroButtons.home.secondary.label);
    setHomeSecondaryHref(cta.heroButtons.home.secondary.href);

    setLocPrimaryLabel(cta.heroButtons.locanda.primary.label);
    setLocPrimaryHref(cta.heroButtons.locanda.primary.href);
    setLocSecondaryLabel(cta.heroButtons.locanda.secondary.label);
    setLocSecondaryHref(cta.heroButtons.locanda.secondary.href);

    setMasPrimaryLabel(cta.heroButtons.masseria.primary.label);
    setMasPrimaryHref(cta.heroButtons.masseria.primary.href);
    setMasSecondaryLabel(cta.heroButtons.masseria.secondary.label);
    setMasSecondaryHref(cta.heroButtons.masseria.secondary.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data]);

  async function save() {
    try {
      const nextCta: CtaSettings = mergeCta(CTA_FALLBACK, {
        whatsappTemplates: { home: homeTpl, locanda: locandaTpl, masseria: masseriaTpl },
        heroButtons: {
          home: { primary: { label: homePrimaryLabel, href: homePrimaryHref }, secondary: { label: homeSecondaryLabel, href: homeSecondaryHref } },
          locanda: { primary: { label: locPrimaryLabel, href: locPrimaryHref }, secondary: { label: locSecondaryLabel, href: locSecondaryHref } },
          masseria: { primary: { label: masPrimaryLabel, href: masPrimaryHref }, secondary: { label: masSecondaryLabel, href: masSecondaryHref } },
        } as any,
      });

      const { error } = await supabase.from("site_settings").upsert({ key: "cta", value: nextCta });
      if (error) throw error;

      const nextContact = { ...contact, mapsUrl };
      const { error: e2 } = await supabase.from("site_settings").upsert({ key: "contact", value: nextContact });
      if (e2) throw e2;

      await qc.invalidateQueries({ queryKey: ["site_settings"] });
      await qc.invalidateQueries({ queryKey: ["site_settings", "cta"] });
      toast({ title: "Link & CTA salvati" });
    } catch (e: any) {
      toast({ title: "Errore", description: e?.message ?? "Salvataggio fallito", variant: "destructive" });
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Link & CTA</h2>
          <p className="text-sm text-muted-foreground">Gestisci template WhatsApp, Maps e bottoni principali senza toccare codice.</p>
        </div>
        <Button onClick={save}>Salva</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="text-sm font-semibold">WhatsApp templates</div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Home</div>
            <Textarea value={homeTpl} onChange={(e) => setHomeTpl(e.target.value)} className="min-h-[120px]" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Locanda</div>
            <Textarea value={locandaTpl} onChange={(e) => setLocandaTpl(e.target.value)} className="min-h-[120px]" />
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Masseria</div>
            <Textarea value={masseriaTpl} onChange={(e) => setMasseriaTpl(e.target.value)} className="min-h-[120px]" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Maps</div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Link Maps (CTA Indicazioni)</div>
            <Input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} />
            <div className="text-xs text-muted-foreground">Questo aggiorna anche Contatti (contact.mapsUrl).</div>
          </div>

          <div className="pt-3 space-y-3">
            <div className="text-sm font-semibold">Bottoni Hero</div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="text-sm font-medium">Home</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={homePrimaryLabel} onChange={(e) => setHomePrimaryLabel(e.target.value)} placeholder="Label primary" />
                <Input value={homePrimaryHref} onChange={(e) => setHomePrimaryHref(e.target.value)} placeholder="Href primary (/route o https://...)" />
                <Input value={homeSecondaryLabel} onChange={(e) => setHomeSecondaryLabel(e.target.value)} placeholder="Label secondary" />
                <Input value={homeSecondaryHref} onChange={(e) => setHomeSecondaryHref(e.target.value)} placeholder="Href secondary" />
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="text-sm font-medium">Locanda</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={locPrimaryLabel} onChange={(e) => setLocPrimaryLabel(e.target.value)} placeholder="Label primary" />
                <Input value={locPrimaryHref} onChange={(e) => setLocPrimaryHref(e.target.value)} placeholder="Href primary (whatsapp | #anchor | url)" />
                <Input value={locSecondaryLabel} onChange={(e) => setLocSecondaryLabel(e.target.value)} placeholder="Label secondary" />
                <Input value={locSecondaryHref} onChange={(e) => setLocSecondaryHref(e.target.value)} placeholder="Href secondary" />
              </div>
            </div>

            <div className="rounded-md border p-4 space-y-3">
              <div className="text-sm font-medium">Masseria</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input value={masPrimaryLabel} onChange={(e) => setMasPrimaryLabel(e.target.value)} placeholder="Label primary" />
                <Input value={masPrimaryHref} onChange={(e) => setMasPrimaryHref(e.target.value)} placeholder="Href primary (whatsapp | #anchor | url)" />
                <Input value={masSecondaryLabel} onChange={(e) => setMasSecondaryLabel(e.target.value)} placeholder="Label secondary" />
                <Input value={masSecondaryHref} onChange={(e) => setMasSecondaryHref(e.target.value)} placeholder="Href secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
