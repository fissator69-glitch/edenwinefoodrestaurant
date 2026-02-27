import { useEffect, useMemo } from "react";
import "@/styles/eden.css";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import EdenTransitionLink from "@/components/eden/EdenTransitionLink";
import EdenFallingLeavesCanvas from "@/components/eden/EdenFallingLeavesCanvas";
import EdenFooter from "@/components/eden/EdenFooter";
import masseriaTitle from "@/assets/masseria-title.png";

import { getSetting, useSiteSettings } from "@/hooks/content/useSiteSettings";
import { pickSection, usePageBlocks } from "@/hooks/content/usePageContent";
import { useMediaAssets } from "@/hooks/content/useMediaAssets";
import { buildMediaAssetMap, resolveMediaRef } from "@/lib/media";
import { CTA_FALLBACK } from "@/hooks/content/useCtaSettings";
import { MASSERIA_FALLBACK, type MasseriaPolaroidItem as PolaroidItem, type MasseriaHeroContent } from "@/content/fallbackMasseria";

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

  const settings = useSiteSettings();
  const blocks = usePageBlocks("masseria");
  const media = useMediaAssets();
  const assetsById = useMemo(() => buildMediaAssetMap(media.data), [media.data]);

  const cta = getSetting(settings.data, "cta", CTA_FALLBACK);
  const contact = getSetting(settings.data, "contact", { whatsapp: "393497152524" });

  const digits = useMemo(
    () => String(contact.whatsapp ?? "").replace(/[^0-9]/g, "") || "393497152524",
    [contact.whatsapp],
  );

  const waUrl = useMemo(() => {
    const msg = cta.whatsappTemplates.masseria ?? CTA_FALLBACK.whatsappTemplates.masseria;
    return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  }, [cta.whatsappTemplates.masseria, digits]);

  const hero = pickSection<MasseriaHeroContent>(blocks.data, "hero", MASSERIA_FALLBACK.hero);
  const gallery = pickSection<{ items: PolaroidItem[] }>(blocks.data, "gallery", MASSERIA_FALLBACK.gallery);
  const note = pickSection<{ text: string }>(blocks.data, "note", MASSERIA_FALLBACK.note);

  const polaroids = gallery.items;

  const heroPrimaryLabel = cta.heroButtons.masseria.primary.label;
  const heroPrimaryHref = cta.heroButtons.masseria.primary.href;
  const heroSecondaryLabel = cta.heroButtons.masseria.secondary.label;
  const heroSecondaryHref = cta.heroButtons.masseria.secondary.href;

  const primaryHref = heroPrimaryHref === "whatsapp" ? waUrl : heroPrimaryHref;

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
              <p className="masseria-desc">{hero.description}</p>

              <div className="masseria-cta-row">
                <a className="masseria-cta" href={primaryHref} target="_blank" rel="noreferrer">
                  {heroPrimaryLabel}
                </a>
                <a className="masseria-cta masseria-cta--ghost" href={heroSecondaryHref}>
                  {heroSecondaryLabel}
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
              {polaroids.map((p, idx) => {
                const src = resolveMediaRef(
                  p.assetId ? ({ assetId: p.assetId } as any) : p.src ? ({ src: p.src } as any) : null,
                  assetsById,
                );
                return (
                  <figure key={`${p.alt}-${idx}`} className={`masseria-polaroid stagger-item ${p.tiltClass}`.trim()}>
                    <div className="masseria-polaroid-media">{src ? <img src={src} alt={p.alt} loading="lazy" /> : null}</div>
                    {p.caption ? <figcaption className="masseria-polaroid-caption">{p.caption}</figcaption> : null}
                  </figure>
                );
              })}
            </div>
          </div>
        </section>

        {/* NOTA */}
        <section className="masseria-note reveal-on-scroll reveal-fantasy" aria-label="Condizioni eventi">
          <div className="eden-shell">
            <p className="masseria-note-text">{note.text}</p>
          </div>
        </section>

        <section className="mt-16">
          <EdenFooter mode="subpage" />
        </section>
      </main>
    </div>
  );
}
