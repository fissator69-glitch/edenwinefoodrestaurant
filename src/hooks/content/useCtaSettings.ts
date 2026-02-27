import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CtaSettings = {
  whatsappTemplates: {
    home: string;
    locanda: string;
    masseria: string;
  };
  heroButtons: {
    home: {
      primary: { label: string; href: string };
      secondary: { label: string; href: string };
    };
    locanda: {
      primary: { label: string; href: string };
      secondary: { label: string; href: string };
    };
    masseria: {
      primary: { label: string; href: string };
      secondary: { label: string; href: string };
    };
  };
};

export const CTA_FALLBACK: CtaSettings = {
  whatsappTemplates: {
    home: ["Ciao EDEN, vorrei prenotare.", "", "Data:", "Orario:", "Numero persone:", "Nome:"].join("\n"),
    locanda: ["Ciao EDEN, vorrei prenotare per la LOCANDA.", "", "Data:", "Orario:", "Persone:", "Nome:", "Note:"].join("\n"),
    masseria: [
      "Ciao EDEN, vorrei informazioni per un EVENTO PRIVATO presso MASSERIA PETRULLO.",
      "",
      "Data:",
      "Orario:",
      "Numero ospiti (min. 50):",
      "Nome:",
      "Note:",
    ].join("\n"),
  },
  heroButtons: {
    home: {
      primary: { label: "LOCANDA EDEN", href: "/locanda-eden" },
      secondary: { label: "MASSERIA PETRULLO", href: "/masseria-petrullo" },
    },
    locanda: {
      primary: { label: "Prenota su WhatsApp", href: "whatsapp" },
      secondary: { label: "Scopri il menù", href: "#menu" },
    },
    masseria: {
      primary: { label: "Richiedi info su WhatsApp", href: "whatsapp" },
      secondary: { label: "Vedi galleria", href: "#gallery" },
    },
  },
};

async function fetchCta() {
  const { data, error } = await supabase.from("site_settings").select("key,value").eq("key", "cta").maybeSingle();
  if (error) throw error;
  return (data?.value ?? null) as CtaSettings | null;
}

export function useCtaSettings() {
  return useQuery({
    queryKey: ["site_settings", "cta"],
    queryFn: fetchCta,
    staleTime: 30_000,
  });
}
