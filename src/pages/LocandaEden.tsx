import { useEffect, useMemo } from "react";
import "@/styles/eden.css";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import EdenTransitionLink from "@/components/eden/EdenTransitionLink";
import EdenFallingLeavesCanvas from "@/components/eden/EdenFallingLeavesCanvas";

type MenuItem = {
  name: string;
  desc: string;
  price: string;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

type GalleryItem = {
  src: string;
  alt: string;
  tag: string;
  title: string;
  sizeClass?: string;
};

export default function LocandaEden() {
  // Keep EDEN full-bleed globals even outside the landing.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("eden-html");
    body.classList.add("eden-body");
    return () => {
      html.classList.remove("eden-html");
      body.classList.remove("eden-body");
    };
  }, []);

  useRevealOnScroll(".reveal-on-scroll, .reveal-stagger, .gallery-item");

  const waUrl = useMemo(() => {
    const msg = [
      "Ciao EDEN, vorrei prenotare per la LOCANDA.",
      "",
      "Data:",
      "Orario:",
      "Persone:",
      "Nome:",
      "Note:",
    ].join("\n");

    return `https://wa.me/393497152524?text=${encodeURIComponent(msg)}`;
  }, []);

  const menuSections: MenuSection[] = useMemo(
    () => [
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
          {
            name: "Cheesecake al limone, crumble e meringa",
            desc: "Fresca e agrumata.",
            price: "€ 8",
          },
          {
            name: "Tiramisù della casa",
            desc: "Caffè, cacao e crema soffice.",
            price: "€ 8",
          },
        ],
      },
    ],
    [],
  );

  const wineSections: MenuSection[] = useMemo(
    () => [
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
      {
        title: "Rosati",
        items: [{ name: "Rosato del Salento", desc: "Fresco, fragrante.", price: "€ 7 calice" }],
      },
    ],
    [],
  );

  const galleryItems: GalleryItem[] = useMemo(
    () => [
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
      {
        src: "https://picsum.photos/seed/eden-locanda-3/1200/900",
        alt: "Piatto gourmet impiattato",
        tag: "Piatti",
        title: "Signature dish",
      },
      {
        src: "https://picsum.photos/seed/eden-locanda-4/1200/900",
        alt: "Calici di vino sul tavolo",
        tag: "Vini",
        title: "Selezione al calice",
      },
      {
        src: "https://picsum.photos/seed/eden-locanda-5/1200/900",
        alt: "Dettaglio bancone bar",
        tag: "Bar",
        title: "Corner lounge",
      },
      {
        src: "https://picsum.photos/seed/eden-locanda-6/1400/900",
        alt: "Tavolo apparecchiato con piatti e posate",
        tag: "Esperienza",
        title: "Convivialità",
        sizeClass: "gallery-item--wide",
      },
    ],
    [],
  );

  return (
    <div className="eden-theme">
      <main className="page locanda-page">
        {/* Header pagina */}
        <header className="locanda-header" aria-label="Navigazione pagina">
          <div className="locanda-header-inner">
            <EdenTransitionLink to="/" className="locanda-back">
              <span aria-hidden="true">←</span> Torna a EDEN
            </EdenTransitionLink>
            <div className="locanda-header-title" aria-hidden="true">
              Locanda Eden
            </div>
          </div>
        </header>

        <section className="locanda-hero" aria-labelledby="locanda-hero-title">
          <EdenFallingLeavesCanvas
            leafSrc="/eden/tulip-leaf-source.svg"
            petalSrcs={{ pink: "/eden/petal-pink-source.svg", yellow: "/eden/petal-yellow-source.svg" }}
            petalIntensity="medium"
          />
          <div className="locanda-hero-aurora subpage-glow-enter" aria-hidden="true" />
          <div className="locanda-hero-inner">
            <div className="locanda-hero-content subpage-hero-enter">
              <img className="hero-logo" src="/eden/eden-hero-logo.png" alt="EDEN" loading="eager" />
              <h1 id="locanda-hero-title" className="locanda-title">
                LOCANDA
              </h1>
              <p className="locanda-desc">
                Cucina mediterranea contemporanea, servizio caldo e un calice scelto bene. Il tuo tavolo ti aspetta.
              </p>

              <div className="locanda-cta-row subpage-hero-enter subpage-hero-enter--delay">
                <a className="locanda-cta" href={waUrl} target="_blank" rel="noreferrer">
                  Prenota su WhatsApp
                </a>
                <a className="locanda-cta locanda-cta--ghost" href="#menu">
                  Scopri il menù
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* MENÙ */}
        <section id="menu" className="locanda-section" aria-labelledby="locanda-menu-title">
          <div className="eden-shell">
            <div className="locanda-section-head reveal-on-scroll reveal-fantasy">
              <div className="locanda-kicker">Il menù</div>
              <h2 id="locanda-menu-title" className="eden-title locanda-h2">
                Sapori netti, ingredienti veri.
              </h2>
              <p className="eden-sub">Esempio di proposta: stagionalità, mare e terra con tocchi moderni.</p>
            </div>

            <div className="locanda-menu-grid reveal-stagger">
              {menuSections.map((section) => (
                <article key={section.title} className="locanda-card stagger-item reveal-card-fantasy" aria-label={section.title}>
                  <h3 className="locanda-card-title">{section.title}</h3>
                  <div className="locanda-list" role="list">
                    {section.items.map((it) => (
                      <div key={it.name} className="locanda-item" role="listitem">
                        <div className="locanda-item-main">
                          <div className="locanda-item-name">{it.name}</div>
                          <div className="locanda-item-desc">{it.desc}</div>
                        </div>
                        <div className="locanda-item-price">{it.price}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CARTA VINI */}
        <section className="locanda-section" aria-labelledby="locanda-wine-title">
          <div className="eden-shell">
            <div className="locanda-section-head reveal-on-scroll reveal-fantasy">
              <div className="locanda-kicker">Carta vini</div>
              <h2 id="locanda-wine-title" className="eden-title locanda-h2">
                Selezione al calice e bottiglie.
              </h2>
              <p className="eden-sub">Esempi indicativi: scegliamo etichette eleganti e bevibili.</p>
            </div>

            <div className="locanda-menu-grid reveal-stagger">
              {wineSections.map((section) => (
                <article key={section.title} className="locanda-card stagger-item reveal-card-fantasy" aria-label={section.title}>
                  <h3 className="locanda-card-title">{section.title}</h3>
                  <div className="locanda-list" role="list">
                    {section.items.map((it) => (
                      <div key={it.name} className="locanda-item" role="listitem">
                        <div className="locanda-item-main">
                          <div className="locanda-item-name">{it.name}</div>
                          <div className="locanda-item-desc">{it.desc}</div>
                        </div>
                        <div className="locanda-item-price">{it.price}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="locanda-bottom-cta">
              <a className="locanda-cta" href={waUrl} target="_blank" rel="noreferrer">
                Prenota il tuo tavolo
              </a>
            </div>
          </div>
        </section>

        {/* GALLERIA */}
        <section id="gallery" className="gallery-section" aria-labelledby="locanda-gallery-title">
          <div className="gallery-shell">
            <div className="gallery-header reveal-on-scroll reveal-fantasy">
              <div className="gallery-kicker">Galleria</div>
              <h2 id="locanda-gallery-title" className="gallery-title">
                Uno sguardo alla Locanda.
              </h2>
            </div>

            <div className="gallery-grid">
              {galleryItems.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className={`gallery-item ${item.sizeClass ?? ""}`.trim()}
                  style={{ ["--i" as any]: idx }}
                >
                  <img src={item.src} alt={item.alt} loading="lazy" />
                  <div className="gallery-overlay">
                    <div className="overlay-content">
                      <span className="overlay-tag">{item.tag}</span>
                      <h3>{item.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

