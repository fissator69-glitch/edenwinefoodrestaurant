export type MasseriaPolaroidItem = {
  assetId?: string;
  src?: string;

  alt: string;
  caption?: string;
  tiltClass: string;
};

export type MasseriaHeroContent = {
  description: string;
  ctaPrimary: { label: string; action: "whatsapp" | "href"; href?: string };
  ctaSecondary: { label: string; href: string };
};

export const MASSERIA_FALLBACK = {
  hero: {
    description: "Spazi aperti, luci calde e dettagli curati. Un luogo pensato per eventi privati.",
    ctaPrimary: { label: "Richiedi info su WhatsApp", action: "whatsapp" },
    ctaSecondary: { label: "Vedi galleria", href: "#gallery" },
  } satisfies MasseriaHeroContent,

  gallery: {
    items: [
      {
        src: "https://picsum.photos/seed/eden-masseria-1/1200/900",
        alt: "Vista esterna della masseria al tramonto",
        caption: "Arrivo",
        tiltClass: "tilt-1",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-2/900/1200",
        alt: "Dettaglio di luci calde su un viale",
        caption: "Percorso",
        tiltClass: "tilt-2",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-3/1200/900",
        alt: "Tavolo imperiale per evento privato",
        caption: "Allestimento",
        tiltClass: "tilt-3",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-4/1000/1200",
        alt: "Dettaglio di fiori e mise en place",
        caption: "Dettagli",
        tiltClass: "tilt-4",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-5/1400/900",
        alt: "Corte interna illuminata di sera",
        caption: "Corte",
        tiltClass: "tilt-5",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-6/1200/900",
        alt: "Calici e bottiglie su un banco",
        caption: "Brindisi",
        tiltClass: "tilt-6",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-7/1200/900",
        alt: "Angolo lounge con sedute e luci soffuse",
        caption: "Lounge",
        tiltClass: "tilt-2",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-8/900/1200",
        alt: "Dettaglio architettura in pietra",
        caption: "Pietra",
        tiltClass: "tilt-3",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-9/1200/900",
        alt: "Scorcio di giardino mediterraneo",
        caption: "Giardino",
        tiltClass: "tilt-4",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-10/1200/900",
        alt: "Area evento con luci sospese",
        caption: "Notte",
        tiltClass: "tilt-1",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-11/1400/900",
        alt: "Dettaglio di un portone antico",
        caption: "Ingresso",
        tiltClass: "tilt-5",
      },
      {
        src: "https://picsum.photos/seed/eden-masseria-12/1200/900",
        alt: "Momento conviviale con persone che brindano",
        caption: "Evento",
        tiltClass: "tilt-6",
      },
    ] as MasseriaPolaroidItem[],
  },

  note: {
    text: "Solo per eventi privati. Minimo 50 persone.",
  },
} as const;
