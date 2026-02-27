import { useEffect } from "react";

type RevealOptions = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function useRevealOnScroll(selector: string, options: RevealOptions = {}) {
  const { threshold = 0.15, rootMargin = "0px", once = true } = options;

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;

    const applyStagger = (root: HTMLElement) => {
      // Make stagger containers visible and index their items.
      const containers = root.matches(".reveal-stagger")
        ? [root]
        : Array.from(root.querySelectorAll<HTMLElement>(".reveal-stagger"));

      containers.forEach((container) => {
        container.classList.add("visible");
        const items = Array.from(container.querySelectorAll<HTMLElement>(".stagger-item"));
        items.forEach((item, i) => {
          item.style.setProperty("--i", String(i));
        });
      });
    };

    // Reduced motion: reveal immediately, no observers.
    if (prefersReducedMotion()) {
      els.forEach((el) => {
        el.classList.add("visible");
        applyStagger(el);
      });
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          el.classList.add("visible");
          applyStagger(el);
          if (once) obs.unobserve(entry.target);
        });
      },
      { threshold, rootMargin },
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [selector, threshold, rootMargin, once]);
}
