export type EdenMenuSection = {
  title: string;
  items?: string[];
};

export type EdenMenuNote = {
  label: string;
  items?: string[];
};

export type EdenMenuPercorsoKey = "terra" | "mare" | "scoperta";

export type EdenMenuPercorso = {
  key: EdenMenuPercorsoKey;
  label: string;
  title: string;
  price: number;
  priceExtra?: string;
  sections: EdenMenuSection[];
  notes?: EdenMenuNote[];
};

export type EdenGalleryCategory = "food" | "location" | "events";
export type EdenGallerySizeClass = "item-large" | "item-wide" | "item-tall";

export type EdenGalleryItem = {
  assetId?: string;
  src?: string;
  sizeClass?: EdenGallerySizeClass;
  category: EdenGalleryCategory;
  alt: string;
  tag: string;
  title: string;
};

export const EDEN_HOME_FALLBACK = {
  eden_menu: {
    percorsi: [
      {
        key: "terra",
        label: "Percorso Terra",
        title: "MENÙ TERRA",
        price: 60,
        sections: [
          {
            title: "ANTIPASTI",
            items: [
              "Friselle pugliesi",
              "Taglieri di salumi e formaggi con le sue confetture e petto line",
              "Burratine",
              "Verdure pastellate",
              "Arrosticini",
              "Gateau di patate",
              "Saltimbocca al ragù",
              "Polpettine cacio e pepe",
            ],
          },
          { title: "PRIMO DA SCEGLIERE" },
          { title: "SECONDO DA SCEGLIERE" },
          { title: "FRUTTA" },
        ],
        notes: [
          {
            label: "BEVANDE ANALCOLICHE INCLUSE",
            items: ["2 Bottiglie di Prosecco", "2 Caraffe di vino locale"],
          },
          { label: "OMAGGIO OGNI 10 PERSONE" },
        ],
      },
      {
        key: "mare",
        label: "Percorso Mare",
        title: "MENÙ MARE",
        price: 70,
        sections: [
          {
            title: "ANTIPASTI",
            items: [
              "Bruschette con stracciatella e alici del Cantabrico e pomodorino confit",
              "Carpaccio di salmone marinato alla barbabietola",
              "Tartare di tonno al lime e semi di sesamo",
              "Baccalà fritto con maionese al pepe nero",
              "Gamberi in tempura con salsa agrodolce",
              "Cestini kataifi con gamberi in salsa rosa",
              "Insalata di polpo e tagliatella con verdure",
              "Moscardini in “rosso” su purea di ceci",
            ],
          },
          { title: "1 PRIMO DA SCEGLIERE" },
          { title: "1 SECONDO DA SCEGLIERE" },
          { title: "EXTRA", items: ["Sorbetto al limone", "Frutta"] },
        ],
        notes: [
          { label: "1 bottiglia di prosecco o vino locale in caraffa ogni 10 persone" },
          { label: "Bevande analcoliche OMAGGIO" },
          {
            label:
              "Sala allestita con fiori freschi, oggettistica, candele e tutto ciò che l’EDEN può offrirvi per rendere la sala elegante ed accogliente…",
          },
          { label: "Sala riservata per eventi con un minimo di 40 persone, bambini esclusi" },
          { label: "Al dì sotto di quel numero la sala riservata ha un costo fitto location 300 €" },
        ],
      },
      {
        key: "scoperta",
        label: "Percorso Scoperta",
        title: "L’APERITIVO",
        price: 40,
        priceExtra: "con l’aggiunta di 10 € a persona:",
        sections: [
          {
            title: "MINITRECCE ASSORTITE",
            items: [
              "PANINETTI COLORATI FARCITI",
              "BAO FANTASIA",
              "TRAMEZZINI",
              "GAMBERI IN TEMPURA CON SALSA AGRODOLCE",
              "VERDURE IN PASTELLA",
              "ARROSTICINI DI POLLO",
              "PANZEROTTINI",
            ],
          },
          { title: "Taglieri di salumi e formaggi burratini" },
          { title: "", items: ["SALTIMBOCCA AL RAGÙ", "POLPETTINE CACIO E PEPE"] },
          { title: "Un primo piatto da scegliere" },
        ],
        notes: [
          { label: "1 bottiglia di prosecco o vino locale in caraffa ogni 10 persone — OMAGGIO" },
          { label: "Bevande analcoliche — OMAGGIO" },
          {
            label:
              "Sala allestita con fiori freschi, oggettistica, candele e tutto ciò che l’EDEN può offrirvi per rendere la sala elegante ed accogliente…",
          },
          { label: "Sala riservata per eventi con un minimo di 40 persone, bambini esclusi" },
          { label: "Al dì sotto di quel numero la sala riservata ha un costo fitto location 300 €" },
        ],
      },
    ] satisfies EdenMenuPercorso[],
  },

  eden_gallery: {
    items: [
      {
        sizeClass: "item-large",
        category: "food",
        src: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Piatto gourmet (crudo di mare)",
        tag: "Food",
        title: "Crudo di mare",
      },
      {
        sizeClass: "item-tall",
        category: "location",
        src: "https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Sala interna in pietra",
        tag: "Location",
        title: "Sala in pietra",
      },
      {
        category: "events",
        src: "https://images.pexels.com/photos/5638612/pexels-photo-5638612.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Evento privato, tavola apparecchiata",
        tag: "Eventi",
        title: "Feste private",
      },
      {
        category: "food",
        src: "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Dessert artigianale",
        tag: "Food",
        title: "Dolci artigianali",
      },
      {
        sizeClass: "item-wide",
        category: "location",
        src: "https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Dettaglio tavola, mise en place",
        tag: "Location",
        title: "Mise en place",
      },
      {
        category: "events",
        src: "https://images.pexels.com/photos/3171837/pexels-photo-3171837.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Brindisi durante evento",
        tag: "Eventi",
        title: "Brindisi speciali",
      },
      {
        category: "food",
        src: "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Antipasto mediterraneo",
        tag: "Food",
        title: "Antipasto mediterraneo",
      },
      {
        category: "food",
        src: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Pasta fresca con frutti di mare",
        tag: "Food",
        title: "Pasta fresca",
      },
      {
        category: "food",
        src: "https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Calice di vino rosso",
        tag: "Wine",
        title: "Selezione vini",
      },
      {
        category: "location",
        src: "https://images.pexels.com/photos/262047/pexels-photo-262047.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Angolo sala con luci calde",
        tag: "Location",
        title: "Luce soffusa",
      },
      {
        category: "location",
        src: "https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Dettaglio interni ristorante",
        tag: "Location",
        title: "Dettagli",
      },
      {
        sizeClass: "item-tall",
        category: "events",
        src: "https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Sala preparata per evento",
        tag: "Eventi",
        title: "Allestimenti",
      },
      {
        category: "events",
        src: "https://images.pexels.com/photos/1123262/pexels-photo-1123262.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Torta e festa",
        tag: "Eventi",
        title: "Compleanni",
      },
      {
        category: "food",
        src: "https://images.pexels.com/photos/262959/pexels-photo-262959.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Secondo piatto gourmet",
        tag: "Food",
        title: "Secondi",
      },
      {
        sizeClass: "item-wide",
        category: "location",
        src: "https://images.pexels.com/photos/696218/pexels-photo-696218.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Tavoli e atmosfera",
        tag: "Location",
        title: "Atmosfera",
      },
      {
        category: "food",
        src: "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=900",
        alt: "Cocktail o aperitivo",
        tag: "Bar",
        title: "Aperitivi",
      },
    ] satisfies EdenGalleryItem[],
  },
} as const;
