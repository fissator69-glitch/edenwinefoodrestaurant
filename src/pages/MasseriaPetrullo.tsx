import { useEffect, useMemo } from "react";
import "@/styles/eden.css";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import EdenTransitionLink from "@/components/eden/EdenTransitionLink";
import EdenFallingLeavesCanvas from "@/components/eden/EdenFallingLeavesCanvas";
import masseriaTitle from "@/assets/masseria-title.png";


type PolaroidItem = {
  src: string;
  alt: string;
  caption?: string;
  tiltClass: string;
};

export default function MasseriaPetrullo() {
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

  useRevealOnScroll(".reveal-on-scroll, .reveal-stagger, .masseria-polaroid");

  const waUrl = useMemo(() => {
    const msg = [
      "Ciao EDEN, vorrei informazioni per un EVENTO PRIVATO presso MASSERIA PETRULLO.",
      "",
      "Data:",
      "Orario:",
      "Numero ospiti (min. 50):",
      "Nome:",
      "Note:",
    ].join("\n");

    return `https://wa.me/393497152524?text=${encodeURIComponent(msg)}`;
  }, []);

  const polaroids: PolaroidItem[] = useMemo(
    () => [
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
    ],
    [],
  );

  return (
    <div className="eden-theme">
      <main className="page masseria-page">
        {/* Header pagina */}
        <header className="masseria-header" aria-label="Navigazione pagina">
          <div className="masseria-header-inner">
            <EdenTransitionLink to="/" className="masseria-back">
              <span aria-hidden="true">←</span> Torna a EDEN
            </EdenTransitionLink>
            <div className="masseria-header-title" aria-hidden="true">
              Masseria Petrullo
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="masseria-hero" aria-labelledby="masseria-hero-title">
          <EdenFallingLeavesCanvas
            leafSrc="/eden/wheat-leaf-source.svg"
            leafMultiplier={0.75}
            petalSrcs={{ pink: "/eden/wheat-spike-gold-source.svg", yellow: "/eden/wheat-spike-green-source.svg" }}
            petalIntensity="medium"
            petalMultiplier={1.6}
            petalCap={90}
          />
          <div className="masseria-hero-aurora subpage-glow-enter" aria-hidden="true" />
          <div className="masseria-hero-inner">
            <div className="masseria-hero-content subpage-hero-enter">
              <img className="hero-logo" src="/eden/eden-hero-logo.png" alt="EDEN" loading="eager" />
              <h1 id="masseria-hero-title" className="masseria-title masseria-title--image">
                <span className="sr-only">Masseria Petrullo</span>
                <img className="masseria-title-image" src={masseriaTitle} alt="Masseria Petrullo" loading="eager" decoding="async" />
              </h1>
              <p className="masseria-desc">Spazi aperti, luci calde e dettagli curati. Un luogo pensato per eventi privati.</p>

              <div className="masseria-cta-row">
                <a className="masseria-cta" href={waUrl} target="_blank" rel="noreferrer">
                  Richiedi info su WhatsApp
                </a>
                <a className="masseria-cta masseria-cta--ghost" href="#gallery">
                  Vedi galleria
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERIA (polaroid wall) */}
        <section id="gallery" className="masseria-gallery" aria-labelledby="masseria-gallery-title">
          <div className="eden-shell">
            <div className="masseria-section-head reveal-on-scroll reveal-fantasy">
              <div className="masseria-kicker">Galleria</div>
              <h2 id="masseria-gallery-title" className="eden-title masseria-h2">
                Uno sguardo alla Masseria.
              </h2>
            </div>

            <div className="masseria-polaroid-grid reveal-stagger">
              {polaroids.map((p, idx) => (
                <figure key={`${p.src}-${idx}`} className={`masseria-polaroid stagger-item ${p.tiltClass}`.trim()}>
                  <div className="masseria-polaroid-media">
                    <img src={p.src} alt={p.alt} loading="lazy" />
                  </div>
                  {p.caption ? <figcaption className="masseria-polaroid-caption">{p.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* NOTA */}
        <section className="masseria-note reveal-on-scroll reveal-fantasy" aria-label="Condizioni eventi">
          <div className="eden-shell">
            <p className="masseria-note-text">Solo per eventi privati. Minimo 50 persone.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
