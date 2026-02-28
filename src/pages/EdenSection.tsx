import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import EdenLanding from "@/components/eden/EdenLanding";

type Props = {
  /** ID della sezione dentro la pagina EDEN (es. "cucina", "gallery", ...) */
  sectionId: string;
};

export default function EdenSection({ sectionId }: Props) {
  const location = useLocation();

  useEffect(() => {
    // Renderizza la pagina e poi scrolla alla sezione richiesta.
    // (set hash così funziona anche il refresh/copia link)
    const hash = `#${sectionId}`;

    // Evita di riscrivere la history se già siamo sull'hash corretto.
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", `${location.pathname}${hash}`);
    }

    // Aspetta un frame per essere sicuri che il DOM sia presente.
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (!el) return;

      // Scroll "deciso" (no magie) ma con smooth se disponibile.
      try {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        el.scrollIntoView(true);
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [location.pathname, sectionId]);

  return <EdenLanding />;
}
