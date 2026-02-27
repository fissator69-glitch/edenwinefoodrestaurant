import type { PageBlock } from "@/hooks/content/usePageContent";

export type LocandaMenuItem = { name: string; desc: string; price: string };
export type LocandaMenuSection = { title: string; items: LocandaMenuItem[] };

export type LocandaGalleryItem = {
  // Prefer internal media references (saved from Admin Media).
  assetId?: string;
  // Back-compat / fallback.
  src?: string;

  alt: string;
  tag: string;
  title: string;
  sizeClass?: string;
};

export type LocandaHeroContent = {
  description: string;
  ctaPrimary: { label: string; action: "whatsapp" | "href"; href?: string };
  ctaSecondary: { label: string; href: string };
};

export const LOCANDA_FALLBACK = {
  hero: {
    description: "Cucina mediterranea contemporanea, servizio caldo e un calice scelto bene. Il tuo tavolo ti aspetta.",
    ctaPrimary: { label: "Prenota su WhatsApp", action: "whatsapp" },
    ctaSecondary: { label: "Scopri il menù", href: "#menu" },
  } satisfies LocandaHeroContent,

  menu: {
    sections: [
      {
        title: "Antipasti",
        items: [
          {
            name: "Crudo di gambero rosso, agrumi e olio al basilico",
            desc: "Marinatura delicata, zest di limone, sale affumicato.",
            price: "€ 18",
          },
          {
            name: "Burrata, datterini confit e pane ai cereali",
            desc: "Crema di burrata, pomodoro dolce, erbe mediterranee.",
            price: "€ 14",
          },
          {
            name: "Polpo arrosto, patata schiacciata e paprika",
            desc: "Cottura lenta, finitura alla piastra.",
            price: "€ 16",
          },
        ],
      },
      {
        title: "Primi",
        items: [
          {
            name: "Spaghettone al pomodoro, basilico e stracciatella",
            desc: "Pomodoro ristretto, stracciatella fresca.",
            price: "€ 15",
          },
          {
            name: "Risotto agli asparagi, limone e parmigiano 24 mesi",
            desc: "Mantecatura cremosa e nota agrumata.",
            price: "€ 17",
          },
          {
            name: "Orecchiette, cime di rapa e crumble di tarallo",
            desc: "Tradizione pugliese con texture croccante.",
            price: "€ 14",
          },
        ],
      },
      {
        title: "Secondi",
        items: [
          {
            name: "Ricciola scottata, verdure di stagione e salsa allo zenzero",
            desc: "Cottura rapida, fondo leggero.",
            price: "€ 22",
          },
          {
            name: "Guancia di vitello brasata, crema di sedano rapa",
            desc: "Lunga cottura, riduzione al vino.",
            price: "€ 24",
          },
          {
            name: "Melanzana glassata, miso e sesamo (vegetariano)",
            desc: "Caramellizzazione e umami bilanciato.",
            price: "€ 18",
          },
        ],
      },
      {
        title: "Dessert",
        items: [
          { name: "Cheesecake al limone, crumble e meringa", desc: "Fresca e agrumata.", price: "€ 8" },
          { name: "Tiramisù della casa", desc: "Caffè, cacao e crema soffice.", price: "€ 8" },
        ],
      },
    ] as LocandaMenuSection[],
  },

  wines: {
    sections: [
      {
        title: "Bollicine",
        items: [
          { name: "Franciacorta Brut", desc: "Metodo classico, fine e secco.", price: "€ 8 calice" },
          { name: "Prosecco Extra Dry", desc: "Fruttato e delicato.", price: "€ 6 calice" },
        ],
      },
      {
        title: "Bianchi",
        items: [
          { name: "Verdeca (Puglia)", desc: "Sapido, note floreali.", price: "€ 7 calice" },
          { name: "Fiano", desc: "Strutturato, elegante.", price: "€ 8 calice" },
        ],
      },
      {
        title: "Rossi",
        items: [
          { name: "Primitivo", desc: "Caldo, morbido, spezie dolci.", price: "€ 8 calice" },
          { name: "Negroamaro", desc: "Equilibrato, frutti rossi.", price: "€ 7 calice" },
        ],
      },
      { title: "Rosati", items: [{ name: "Rosato del Salento", desc: "Fresco, fragrante.", price: "€ 7 calice" }] },
    ] as LocandaMenuSection[],
  },

  gallery: {
    items: [
      {
        src: "https://picsum.photos/seed/eden-locanda-1/1400/900",
        alt: "Sala ristorante con luci soffuse",
        tag: "Sala",
        title: "Atmosfera serale",
        sizeClass: "gallery-item--wide",
      },
      {
        src: "https://picsum.photos/seed/eden-locanda-2/1000/1200",
        alt: "Dettaglio mise en place",
        tag: "Dettagli",
        title: "Mise en place",
        sizeClass: "gallery-item--tall",
      },
      { src: "https://picsum.photos/seed/eden-locanda-3/1200/900", alt: "Piatto gourmet impiattato", tag: "Piatti", title: "Signature dish" },
      { src: "https://picsum.photos/seed/eden-locanda-4/1200/900", alt: "Calici di vino sul tavolo", tag: "Vini", title: "Selezione al calice" },
      { src: "https://picsum.photos/seed/eden-locanda-5/1200/900", alt: "Dettaglio bancone bar", tag: "Bar", title: "Corner lounge" },
      {
        src: "https://picsum.photos/seed/eden-locanda-6/1400/900",
        alt: "Tavolo apparecchiato con piatti e posate",
        tag: "Esperienza",
        title: "Convivialità",
        sizeClass: "gallery-item--wide",
      },
    ] as LocandaGalleryItem[],
  },
} as const;

export function pickLocandaSection<T>(blocks: PageBlock[] | undefined, section: string, fallback: T): T {
  if (!blocks) return fallback;
  const row = blocks.find((b) => b.section === section);
  return (row?.content as T) ?? fallback;
}
