import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Globe, MapPin, Phone, MessageCircle } from "lucide-react";

import footerLogo from "@/assets/eden-footer-logo.png";
import { useSiteFooter } from "@/hooks/content/useSiteFooter";
import { useSocialLinks } from "@/hooks/content/useSocialLinks";
import { getSetting, useSiteSettings } from "@/hooks/content/useSiteSettings";

type FooterMode = "home" | "subpage";

function iconFor(platformRaw: string) {
  const p = (platformRaw || "").toLowerCase().trim();
  if (p.includes("insta")) return Instagram;
  if (p.includes("face")) return Facebook;
  if (p.includes("youtube") || p.includes("yt")) return Youtube;
  return Globe;
}

function normalizeWhats(phone: string) {
  return (phone || "").replace(/[^0-9]/g, "");
}

export default function EdenFooter({ mode }: { mode: FooterMode }) {
  const footer = useSiteFooter();
  const socials = useSocialLinks();
  const settings = useSiteSettings();

  const [policyOpen, setPolicyOpen] = useState(false);
  const lastPolicyTriggerRef = useRef<HTMLElement | null>(null);

  const contact = getSetting(settings.data, "contact", {
    phone: "+390805248160",
    whatsapp: "393497152524",
    address: "Via Santa Maria della Stella, 66\n70010 Adelfia (BA)",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Via%20Santa%20Maria%20della%20Stella%2066%20Adelfia",
  });
  const privacy = getSetting(settings.data, "privacy", {
    text: "Contenuto placeholder (come nel sorgente GitHub). Qui potrai inserire testo completo di Privacy Policy, Cookie Policy e dettagli legali.",
  });

  const data = footer.data ?? {
    brandName: "EDEN",
    description: "Food · Wine · Restaurant. Un Eden contemporaneo nel cuore della Puglia.",
    designBy: "Giovanni Macina",
    sections:
      mode === "home"
        ? [
            { label: "L'esperienza", href: "#eden" },
            { label: "Cucina", href: "#cucina" },
            { label: "Galleria", href: "#gallery" },
            { label: "Eventi", href: "#eventi" },
            { label: "Recensioni", href: "#recensioni" },
            { label: "Contatti", href: "#contatti" },
          ]
        : [
            { label: "EDEN", href: "/" },
            { label: "Locanda", href: "/locanda-eden" },
            { label: "Masseria", href: "/masseria-petrullo" },
          ],
  };

  const year = useMemo(() => new Date().getFullYear(), []);

  // body lock + ESC handling
  useEffect(() => {
    const body = document.body;
    if (policyOpen) body.classList.add("eden-lock");
    else body.classList.remove("eden-lock");
    return () => body.classList.remove("eden-lock");
  }, [policyOpen]);

  useEffect(() => {
    if (!policyOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPolicyOpen(false);
      window.setTimeout(() => lastPolicyTriggerRef.current?.focus(), 0);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [policyOpen]);

  const whatsappDigits = normalizeWhats(contact.whatsapp);

  return (
    <>
      <footer className="footer-premium">
        <div className="footer-shell">
          <div className="f-grid">
            <div className="f-col">
              <img className="f-logo" src={footerLogo} alt="EDEN food.wine.restaurant" loading="lazy" />
              <div className="f-brand">{data.brandName ?? "EDEN"}</div>
              <p className="f-desc">{data.description}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {(socials.data ?? []).map((s) => {
                  const Icon = iconFor(s.platform);
                  return (
                    <a
                      key={s.id}
                      className="mini-link"
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.platform}
                      title={s.platform}
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="f-col">
              <div className="f-col-title">Sezioni</div>
              <div className="f-links f-links-col">
                {(data.sections ?? []).map((l) =>
                  mode === "home" ? (
                    <a key={l.href} href={l.href}>
                      {l.label}
                    </a>
                  ) : (
                    <Link key={l.href} to={l.href}>
                      {l.label}
                    </Link>
                  ),
                )}
              </div>
            </div>

            <div className="f-col">
              <div className="f-col-title">Contatti</div>
              <div className="f-links f-links-col">
                <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-2">
                  <Phone size={16} /> {String(contact.phone).replace("+39", "").trim()}
                </a>
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href={contact.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2">
                  <MapPin size={16} /> Indicazioni
                </a>
              </div>
            </div>
          </div>

          <div className="f-legal">
            <div>&copy; {year} EDEN food.wine.restaurant. Tutti i diritti riservati.</div>
            <div className="f-legal-links">
              <button
                type="button"
                className="f-legal-btn"
                onClick={(e) => {
                  lastPolicyTriggerRef.current = e.currentTarget;
                  setPolicyOpen(true);
                }}
              >
                Privacy &amp; Cookie
              </button>
              <span className="f-legal-sep" aria-hidden="true">
                ·
              </span>
              <span>
                Design by <strong>{data.designBy ?? ""}</strong>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* FAB DOCK */}
      <div className="fab-dock" aria-label="Azioni rapide">
        <a className="fab-btn" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer">
          <MessageCircle size={16} /> WhatsApp
        </a>
        <a className="fab-btn" href={`tel:${contact.phone}`}>
          <Phone size={16} /> Chiama
        </a>
        <a className="fab-btn fab-btn-primary" href={contact.mapsUrl} target="_blank" rel="noreferrer">
          <MapPin size={16} /> Indicazioni
        </a>
      </div>

      {/* POLICY MODAL */}
      <div
        className={`policy-modal ${policyOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Privacy e Cookie"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setPolicyOpen(false);
            window.setTimeout(() => lastPolicyTriggerRef.current?.focus(), 0);
          }
        }}
      >
        <div className="policy-card">
          <div className="policy-head">
            <div>
              <div className="policy-kicker">Policy</div>
              <div className="policy-title">Privacy &amp; Cookie</div>
            </div>
            <button
              type="button"
              className="policy-close"
              onClick={() => {
                setPolicyOpen(false);
                window.setTimeout(() => lastPolicyTriggerRef.current?.focus(), 0);
              }}
              aria-label="Chiudi"
            >
              ×
            </button>
          </div>
          <div className="policy-body">
            <p>{privacy.text}</p>
          </div>
        </div>
      </div>
    </>
  );
}
