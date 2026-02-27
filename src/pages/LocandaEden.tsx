import { useEffect, useMemo } from "react";
import "@/styles/eden.css";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import EdenTransitionLink from "@/components/eden/EdenTransitionLink";
import EdenFallingLeavesCanvas from "@/components/eden/EdenFallingLeavesCanvas";
import EdenFooter from "@/components/eden/EdenFooter";
import locandaTitle from "@/assets/locanda-title.png";

import { getSetting, useSiteSettings } from "@/hooks/content/useSiteSettings";
import { pickSection, usePageBlocks } from "@/hooks/content/usePageContent";
import { useMediaAssets } from "@/hooks/content/useMediaAssets";
import { buildMediaAssetMap, resolveMediaRef } from "@/lib/media";
import { CTA_FALLBACK } from "@/hooks/content/useCtaSettings";
import {
  LOCANDA_FALLBACK,
  type LocandaMenuSection as MenuSection,
  type LocandaGalleryItem as GalleryItem,
  type LocandaHeroContent,
} from "@/content/fallbackLocanda";

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

  const settings = useSiteSettings();
  const blocks = usePageBlocks("locanda");
  const media = useMediaAssets();

  const cta = getSetting(settings.data, "cta", CTA_FALLBACK);
  const contact = getSetting(settings.data, "contact", { whatsapp: "393497152524" });

  const digits = useMemo(
    () => String(contact.whatsapp ?? "").replace(/[^0-9]/g, "") || "393497152524",
    [contact.whatsapp],
  );

  const waUrl = useMemo(() => {
    const msg = cta.whatsappTemplates.locanda ?? CTA_FALLBACK.whatsappTemplates.locanda;
    return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
  }, [cta.whatsappTemplates.locanda, digits]);

  const hero = pickSection<LocandaHeroContent>(blocks.data, "hero", LOCANDA_FALLBACK.hero);
  const menu = pickSection<{ sections: MenuSection[] }>(blocks.data, "menu", LOCANDA_FALLBACK.menu);
  const wines = pickSection<{ sections: MenuSection[] }>(blocks.data, "wines", LOCANDA_FALLBACK.wines);
  const gallery = pickSection<{ items: GalleryItem[] }>(blocks.data, "gallery", LOCANDA_FALLBACK.gallery);

  const assetsById = useMemo(() => buildMediaAssetMap(media.data), [media.data]);

  const menuSections = menu.sections;
  const wineSections = wines.sections;
  const galleryItems = gallery.items;

  const heroPrimaryLabel = cta.heroButtons.locanda.primary.label;
  const heroPrimaryHref = cta.heroButtons.locanda.primary.href;
  const heroSecondaryLabel = cta.heroButtons.locanda.secondary.label;
  const heroSecondaryHref = cta.heroButtons.locanda.secondary.href;

  const primaryHref = heroPrimaryHref === "whatsapp" ? waUrl : heroPrimaryHref;

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
              <h1 id="locanda-hero-title" className="locanda-title locanda-title--image">
                <span className="sr-only">Locanda</span>
                <img className="locanda-title-image" src={locandaTitle} alt="Locanda" loading="eager" decoding="async" />
              </h1>
              <p className="locanda-desc">{hero.description}</p>

              <div className="locanda-cta-row subpage-hero-enter subpage-hero-enter--delay">
                <a className="locanda-cta" href={primaryHref} target="_blank" rel="noreferrer">
                  {heroPrimaryLabel}
                </a>
                <a className="locanda-cta locanda-cta--ghost" href={heroSecondaryHref}>
                  {heroSecondaryLabel}
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
              {galleryItems.map((item, idx) => {
                const src = resolveMediaRef(
                  item.assetId ? ({ assetId: item.assetId } as any) : item.src ? ({ src: item.src } as any) : null,
                  assetsById,
                );
                return (
                  <div
                    key={`${item.title}-${idx}`}
                    className={`gallery-item ${item.sizeClass ?? ""}`.trim()}
                    style={{ ["--i" as any]: idx }}
                  >
                    {src ? <img src={src} alt={item.alt} loading="lazy" /> : null}
                    <div className="gallery-overlay">
                      <div className="overlay-content">
                        <span className="overlay-tag">{item.tag}</span>
                        <h3>{item.title}</h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <EdenFooter mode="subpage" />
        </section>
      </main>
    </div>
  );
}
