import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import "@/styles/eden.css";
import { toast } from "@/hooks/use-toast";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { usePageBlocks, pickSection } from "@/hooks/content/usePageContent";
import { useMediaAssets } from "@/hooks/content/useMediaAssets";
import { buildMediaAssetMap, resolveMediaRef } from "@/lib/media";
import { EDEN_HOME_FALLBACK, type EdenGalleryItem as EdenGalleryItemContent, type EdenMenuPercorso } from "@/content/fallbackEdenHome";

import EdenIntroOverlay from "./EdenIntroOverlay";
import EdenTransitionLink from "./EdenTransitionLink";

import headerLogo from "@/assets/eden-header-logo.png";
import edenAdelfiaWindow from "@/assets/eden-adelfia-window.jpeg";
import EdenFooter from "@/components/eden/EdenFooter";

type EdenLeafStatus = "loading" | "loaded" | "error" | "timeout";

type EdenDebugInfo = {
  leafStatus: EdenLeafStatus;
  canvasSize: string;
  leavesCount: number;
};

type TabKey = "terra" | "mare" | "scoperta";

type MenuSection = {
  title: string;
  items?: string[];
};

type MenuNote = {
  label: string;
  items?: string[];
};

type MenuPercorso = {
  key: TabKey;
  label: string;
  title: string;
  price: number;
  priceExtra?: string;
  sections: MenuSection[];
  notes?: MenuNote[];
};

type GalleryFilter = "all" | "food" | "location" | "events";

type GalleryItem = {
  sizeClass?: "item-large" | "item-wide" | "item-tall";
  category: Exclude<GalleryFilter, "all">;
  src: string;
  alt: string;
  tag: string;
  title: string;
};

type EdenReview = {
  title: string;
  text: string;
  context: string;
  stars?: string;
  badge?: string;
};

const EDEN_REVIEWS: EdenReview[] = [
  {
    title: "Location da sogno",
    text: "Sala elegante, atmosfera calda, servizio sempre presente ma mai invadente. Il posto perfetto per una festa che resta nei ricordi di tutti.",
    context: "Evento privato in sala",
  },
  {
    title: "Cucina e accoglienza",
    text: "Dalla scelta dei piatti al brindisi finale, Miriam e lo staff ci hanno seguito con estrema attenzione. Piatti curati, porzioni giuste, tempi perfetti.",
    context: "Cena tra amici",
  },
  {
    title: "Festa impeccabile",
    text: "Abbiamo gestito tutto in anticipo. La sera dell'evento era già tutto pronto, senza imprevisti e con una magia unica per la nostra laurea.",
    context: "Festa di Laurea",
  },
  {
    title: "Qualità altissima",
    text: "Materie prime eccellenti e presentazioni curate. Ogni portata aveva un equilibrio perfetto e un gusto riconoscibile.",
    context: "Cena di coppia",
  },
  {
    title: "Atmosfera unica",
    text: "Luci soffuse, musica al punto giusto e un'energia speciale. Ci siamo sentiti coccolati dall'inizio alla fine.",
    context: "Anniversario",
  },
  {
    title: "Staff super",
    text: "Gentilezza e professionalità rare: consigli perfetti sui vini e attenzione costante senza essere invadenti.",
    context: "Cena in famiglia",
  },
  {
    title: "Menù sorprendente",
    text: "Abbinamenti originali ma sempre armoniosi. Una degustazione che ti fa venire voglia di tornare per provare tutto.",
    context: "Percorso degustazione",
  },
  {
    title: "Organizzazione top",
    text: "Per il nostro compleanno hanno curato ogni dettaglio: mise en place, tempistiche e sorprese finali. Esperienza perfetta.",
    context: "Compleanno",
  },
  {
    title: "Sapori di Puglia",
    text: "Tradizione e creatività insieme: piatti che raccontano il territorio con un tocco contemporaneo.",
    context: "Cena gourmet",
  },
  {
    title: "Eleganza vera",
    text: "Ambiente raffinato senza essere freddo. Si respira cura, gusto e una bella energia in ogni angolo.",
    context: "Serata speciale",
  },
  {
    title: "Dolci memorabili",
    text: "Chiusura pazzesca: dessert equilibrati, non troppo zuccherati, con texture incredibili. Da applausi.",
    context: "Cena romantica",
  },
  {
    title: "Torneremo presto",
    text: "Quando un posto ti fa stare bene così, lo capisci subito. Per noi Eden è diventata una certezza.",
    context: "Prima visita",
  },
].map((r) => ({
  ...r,
  stars: "★★★★★",
  badge: "Cliente verificato",
}));

// NOTE: For strict 1:1 parity with nuovo_1.html we do not apply adaptive motion changes here.

function animateCounterInt(el: HTMLElement, target: number, durationMs: number) {
  let start = 0;
  const step = target / Math.max(1, durationMs / 16);
  const timer = window.setInterval(() => {
    start += step;
    if (start >= target) {
      start = target;
      window.clearInterval(timer);
    }
    el.textContent = String(Math.floor(start));
  }, 16);
  return () => window.clearInterval(timer);
}

function animateCounterStat(el: HTMLElement, target: number) {
  const isDecimal = target < 10;
  let start = 0;
  const duration = 2000;
  const stepTime = 20;
  const steps = duration / stepTime;
  const increment = target / steps;

  const timer = window.setInterval(() => {
    start += increment;
    if (start >= target) {
      start = target;
      window.clearInterval(timer);
    }

    if (isDecimal) {
      el.textContent = start.toFixed(1).replace(".", ",");
      return;
    }

    const format = el.getAttribute("data-format");
    if (format === "plain") {
      el.textContent = `+${Math.floor(start)}`;
      return;
    }

    // legacy "k" format
    el.innerHTML = `+<span data-target="${target}">${Math.floor(start)}</span>k`;
  }, stepTime);

  return () => window.clearInterval(timer);
}

function useHeroCanvas(
canvasRef: RefObject<HTMLCanvasElement>,
opts?: {
  debug?: boolean;
  onDebug?: (patch: Partial<EdenDebugInfo>) => void;
})
{
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const debug = Boolean(opts?.debug);
    const onDebug = opts?.onDebug;

    let leaves: Array<any> = [];
    let glows: Array<any> = [];
    let heroWidth = 0;
    let heroHeight = 0;
    let raf = 0;

    // Leaf sprite (real image) — optimized + subtle tint variants (1:1 from nuovo_1-2.html)
    let leafSprites: HTMLCanvasElement[] | null = null;
    let leafAspect = 1;
    let leafReady = false;

    const LEAF_OPACITY = 0.42;
    const LEAF_TINT_HUES = [115, 123, 131, 139, 147];

    const mouse = { x: 0, y: 0, active: false };

    function clamp(n: number, a: number, b: number) {
      return Math.max(a, Math.min(b, n));
    }

    function reportCanvas() {
      onDebug?.({ canvasSize: `${heroWidth}×${heroHeight}` });
    }

    function resizeCanvas() {
      heroWidth = window.innerWidth;
      heroHeight = window.innerHeight;
      canvas.width = heroWidth;
      canvas.height = heroHeight;
      createLeaves();
      createGlows();
      reportCanvas();
    }

    function createLeaves() {
      leaves = [];
      const count = Math.floor(heroWidth * heroHeight / 22000);
      for (let i = 0; i < count; i++) {
        leaves.push({
          x: Math.random() * heroWidth,
          y: Math.random() * heroHeight,
          size: 0.5 + Math.random() * 1.2,
          speedY: 0.25 + Math.random() * 0.5,
          swayAmp: 10 + Math.random() * 18,
          swaySpeed: 0.3 + Math.random() * 0.5,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.01,
          hue: 115 + Math.random() * 30,
          time: Math.random() * 100
        });
      }
      onDebug?.({ leavesCount: count });
    }

    function createGlows() {
      glows = [];
      const count = Math.max(12, Math.floor(heroWidth * heroHeight / 90000));
      for (let i = 0; i < count; i++) {
        glows.push({
          x: Math.random() * heroWidth,
          y: Math.random() * heroHeight,
          radius: 40 + Math.random() * 80,
          alphaBase: 0.08 + Math.random() * 0.12,
          alphaVar: 0.05 + Math.random() * 0.08,
          speedY: -0.02 - Math.random() * 0.04,
          speedX: (Math.random() - 0.5) * 0.02,
          hue: 130 + Math.random() * 40,
          t: Math.random() * Math.PI * 2
        });
      }
    }

    // Remove the (baked) checkerboard background by keying out low-saturation pixels.
    // This runs ONCE on load and is then drawn as cached sprites for mobile performance.
    function buildLeafSprites(img: HTMLImageElement) {
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      if (!srcW || !srcH) return;

      // 1) Create an alpha-masked source (background removed)
      const masked = document.createElement("canvas");
      masked.width = srcW;
      masked.height = srcH;
      const mctx = masked.getContext("2d");
      if (!mctx) return;

      mctx.clearRect(0, 0, srcW, srcH);
      mctx.drawImage(img, 0, 0);

      const imageData = mctx.getImageData(0, 0, srcW, srcH);
      const d = imageData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const sat = max === 0 ? 0 : (max - min) / max; // quick HSV-like saturation

        // Background is mostly grayscale (low saturation). Leaf is green (higher saturation).
        // A slightly generous threshold avoids leaving grid artifacts.
        if (sat < 0.12) {
          d[i + 3] = 0;
        }
      }

      mctx.putImageData(imageData, 0, 0);

      // 2) Downscale to a small sprite (mobile-friendly)
      const targetH = 64;
      leafAspect = srcW / srcH;
      const targetW = Math.max(1, Math.round(targetH * leafAspect));

      const base = document.createElement("canvas");
      base.width = targetW;
      base.height = targetH;
      const bctx = base.getContext("2d");
      if (!bctx) return;

      bctx.clearRect(0, 0, targetW, targetH);
      bctx.imageSmoothingEnabled = true;
      bctx.imageSmoothingQuality = "high";
      bctx.drawImage(masked, 0, 0, targetW, targetH);

      // 3) Pre-render tinted variants (no per-frame tint work)
      leafSprites = LEAF_TINT_HUES.map((h) => {
        const c = document.createElement("canvas");
        c.width = targetW;
        c.height = targetH;
        const cctx = c.getContext("2d");
        if (!cctx) return c;

        cctx.clearRect(0, 0, targetW, targetH);
        cctx.drawImage(base, 0, 0);
        cctx.globalCompositeOperation = "source-atop";
        cctx.fillStyle = `hsla(${h},45%,55%,0.18)`;
        cctx.fillRect(0, 0, targetW, targetH);
        cctx.globalCompositeOperation = "source-over";
        return c;
      });

      leafReady = true;
    }

    function drawLeaf(l: any) {
      if (!leafReady || !leafSprites || leafSprites.length === 0) return;

      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.angle);

      // Target requested: baseH = 19.50px (absolute), keeping physics/animation identical.
      const baseH = 19.5;
      const h = baseH * l.size;
      const w = h * leafAspect;

      const t = clamp((l.hue - 115) / 30, 0, 0.999);
      const idx = clamp(Math.floor(t * leafSprites.length), 0, leafSprites.length - 1);

      ctx.globalAlpha = LEAF_OPACITY;
      ctx.drawImage(leafSprites[idx], -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    function drawGlow(g: any) {
      const alpha = g.alphaBase + Math.sin(g.t) * g.alphaVar;
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      grad.addColorStop(0, `hsla(${g.hue},80%,85%,${alpha})`);
      grad.addColorStop(1, `hsla(${g.hue},80%,40%,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function animate() {
      ctx.clearRect(0, 0, heroWidth, heroHeight);

      for (const g of glows) {
        g.t += 0.01;
        g.x += g.speedX;
        g.y += g.speedY;

        if (g.y + g.radius < -40) {
          g.y = heroHeight + g.radius + 20;
          g.x = Math.random() * heroWidth;
        }
        if (g.x < -g.radius) g.x = heroWidth + g.radius;
        if (g.x > heroWidth + g.radius) g.x = -g.radius;

        drawGlow(g);
      }

      for (const l of leaves) {
        l.time += 0.016;

        const sway = Math.sin(l.time * l.swaySpeed) * l.swayAmp;

        let wind = 0;
        if (mouse.active) {
          const dx = l.x - mouse.x;
          const dy = l.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            wind = (180 - dist) / 180 * 10 * (dx > 0 ? 1 : -1);
          }
        }

        l.x += sway * 0.03 + wind * 0.02;
        l.y += l.speedY;
        l.angle += l.rotSpeed;

        if (l.y > heroHeight + 30) {
          l.y = -30;
          l.x = Math.random() * heroWidth;
          l.time = Math.random() * 100;
        }
        if (l.x < -40) l.x = heroWidth + 40;
        if (l.x > heroWidth + 40) l.x = -40;

        drawLeaf(l);
      }

      raf = requestAnimationFrame(animate);
    }

    const onResize = () => resizeCanvas();
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    onDebug?.({ leafStatus: "loading" });

    // Preload leaf image and start only when ready (avoids blank/incorrect first frames)
    const leafImg = new Image();
    leafImg.src = "/eden/leaf-source.png";

    const start = () => {
      resizeCanvas();
      raf = requestAnimationFrame(animate);
    };

    const leafTimeout = window.setTimeout(() => {
      if (leafReady) return;
      onDebug?.({ leafStatus: "timeout" });
      console.warn("[EDEN] Leaf sprite still not ready after 2.5s. Check /eden/leaf-source.png loading.");
    }, 2500);

    leafImg.onload = () => {
      if (debug) console.info("[EDEN] Leaf sprite loaded:", leafImg.naturalWidth, leafImg.naturalHeight);
      buildLeafSprites(leafImg);
      onDebug?.({ leafStatus: "loaded" });
      window.clearTimeout(leafTimeout);
      start();
    };

    leafImg.onerror = () => {
      onDebug?.({ leafStatus: "error" });
      window.clearTimeout(leafTimeout);
      console.warn("[EDEN] Leaf sprite failed to load: /eden/leaf-source.png");

      // Fallback: run animation even if the image fails (leaves will just not draw)
      start();
    };

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.clearTimeout(leafTimeout);
      cancelAnimationFrame(raf);
    };
  }, [canvasRef, opts?.debug, opts?.onDebug]);
}

export default function EdenLanding() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const debugEnabled = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search).get("edenDebug") === "1";
    } catch {
      return false;
    }
  }, []);

  const [debugInfo, setDebugInfo] = useState<EdenDebugInfo>({
    leafStatus: "loading",
    canvasSize: "-",
    leavesCount: 0
  });

  // Match html/body globals from nuovo_1.html (smooth scroll, background, color, height)
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

  const INTRO_SEEN_KEY = "eden_intro_seen_v1";

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [introDone, setIntroDone] = useState(() => {
    try {
      return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const headerWaUrl = useMemo(() => {
    const msg = [
    "Ciao EDEN, vorrei prenotare.",
    "",
    "Data:",
    "Orario:",
    "Numero persone:",
    "Nome:"].
    join("\n");

    return `https://wa.me/393497152524?text=${encodeURIComponent(msg)}`;
  }, []);

  const [activeTab, setActiveTab] = useState<TabKey>("terra");
  const [tabVisible, setTabVisible] = useState(false);

  const [galleryFilter, setGalleryFilter] = useState<GalleryFilter>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState("");
  const [lightboxCaption, setLightboxCaption] = useState("");

  const [miniToast, setMiniToast] = useState<string | null>(null);
  const [isReviewsPaused, setIsReviewsPaused] = useState(false);

  // Privacy modal moved to <EdenFooter /> (shared across pages)

  const eventFormRef = useRef<HTMLFormElement | null>(null);

  useHeroCanvas(canvasRef, {
    debug: debugEnabled,
    onDebug: (patch) => {
      if (!debugEnabled) return;
      setDebugInfo((prev) => ({ ...prev, ...patch }));
    }
  });
  useRevealOnScroll(".reveal-on-scroll");

  // Stagger reveal: gestito da useRevealOnScroll (quando una sezione entra, attiva anche i .reveal-stagger interni)


  // Scroll-driven parallax layers (replaces mousemove 3D)
  useEffect(() => {
    const layers = Array.from(document.querySelectorAll<HTMLElement>(".parallax-layer[data-parallax]"));
    if (!layers.length) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        layers.forEach((el) => {
          const factor = parseFloat(el.dataset.parallax || "0");
          const py = -y * factor;
          el.style.setProperty("--parallaxY", `${py}px`);
        });
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Lock body scroll when overlays are open
  useEffect(() => {
    const body = document.body;
    if (lightboxOpen) body.classList.add("eden-lock");else
    body.classList.remove("eden-lock");
    return () => body.classList.remove("eden-lock");
  }, [lightboxOpen]);

  // ESC to close overlays
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setLightboxOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen]);

  // Avvia pannello "terra" quando la sezione cucina entra in vista (1:1)
  useEffect(() => {
    const cucinaSection = document.querySelector<HTMLElement>(".cucina-section");
    if (!cucinaSection) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab("terra");
            setTabVisible(true);
            obs.unobserve(cucinaSection);
          }
        });
      },
      { threshold: 0.2 }
    );

    obs.observe(cucinaSection);
    return () => obs.disconnect();
  }, []);

  // Tab reveal + counter price (1:1)
  useEffect(() => {
    setTabVisible(false);

    const panelIdByTab: Record<TabKey, string> = {
      terra: "panel-terra",
      mare: "panel-mare",
      scoperta: "panel-scoperta"
    };

    const panel = document.getElementById(panelIdByTab[activeTab]);
    if (!panel) return;

    let cleanupCounter: undefined | (() => void);

    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setTabVisible(true);
        const priceEl = panel.querySelector<HTMLElement>(".price-big");
        if (priceEl) {
          priceEl.textContent = "0";
          const target = parseInt(priceEl.dataset.target || "0", 10);
          cleanupCounter = animateCounterInt(priceEl, target, 600);
        }
      });
      (panel as any).__raf2 = raf2;
    });

    return () => {
      cancelAnimationFrame(raf1);
      const raf2 = (panel as any).__raf2;
      if (raf2) cancelAnimationFrame(raf2);
      cleanupCounter?.();
    };
  }, [activeTab]);

  // Floating labels (1:1)
  useEffect(() => {
    const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(".ep-input"));
    if (!inputs.length) return;

    inputs.forEach((input) => {
      if (input.value.trim() !== "") input.classList.add("has-value");

      const onInput = () => {
        if (input.value.trim() !== "") input.classList.add("has-value");else
        input.classList.remove("has-value");
      };

      input.addEventListener("input", onInput);
      (input as any).__eden_onInput = onInput;
    });

    return () => {
      inputs.forEach((input) => {
        const onInput = (input as any).__eden_onInput as undefined | (() => void);
        if (onInput) input.removeEventListener("input", onInput);
      });
    };
  }, []);

  // Stats counters (1:1)
  useEffect(() => {
    const statsSection = document.querySelector<HTMLElement>(".reviews-premium");
    if (!statsSection) return;

    const statNums = Array.from(document.querySelectorAll<HTMLElement>(".stat-val"));
    let animated = false;
    let cleanups: Array<() => void> = [];

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animated) {
            animated = true;
            statNums.forEach((num) => {
              const targetStr = num.getAttribute("data-target");
              if (!targetStr) return;
              const target = parseFloat(targetStr);
              cleanups.push(animateCounterStat(num, target));
            });
            obs.unobserve(statsSection);
          }
        });
      },
      { threshold: 0.3 }
    );

    obs.observe(statsSection);
    return () => {
      obs.disconnect();
      cleanups.forEach((c) => c());
    };
  }, []);

  // Close mobile nav when clicking a hash link
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      setIsNavOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const year = useMemo(() => new Date().getFullYear(), []);

  const blocks = usePageBlocks("home");
  const media = useMediaAssets();
  const assetsById = useMemo(() => buildMediaAssetMap(media.data), [media.data]);

  const menuContent = pickSection<{ percorsi: EdenMenuPercorso[] }>(blocks.data, "eden_menu", EDEN_HOME_FALLBACK.eden_menu);
  const galleryContent = pickSection<{ items: EdenGalleryItemContent[] }>(blocks.data, "eden_gallery", EDEN_HOME_FALLBACK.eden_gallery);

  const percorsi: MenuPercorso[] = menuContent.percorsi as any;

  const galleryItems: GalleryItem[] = useMemo(() => {
    return (galleryContent.items ?? []).map((it) => {
      const src = resolveMediaRef(
        it.assetId ? ({ assetId: it.assetId } as any) : it.src ? ({ src: it.src } as any) : null,
        assetsById,
      );
      return {
        sizeClass: it.sizeClass,
        category: it.category,
        src,
        alt: it.alt,
        tag: it.tag,
        title: it.title,
      };
    });
  }, [assetsById, galleryContent.items]);

  function openLightbox(item: GalleryItem) {
    setLightboxSrc(item.src);
    setLightboxCaption(item.title);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function onGalleryFilter(next: GalleryFilter) {
    setGalleryFilter(next);
  }

  const getEventPayloadFromForm = (form: HTMLFormElement) => {
    const checked = form.querySelector<HTMLInputElement>("input[name='tipo']:checked");
    const normalizePhone = (p: string) => String(p || "").trim().replace(/\s+/g, " ");

    return {
      tipo: checked?.value ?? "",
      nome: (form.querySelector<HTMLInputElement>("#ep-nome")?.value ?? "").trim().slice(0, 80),
      tel: normalizePhone(form.querySelector<HTMLInputElement>("#ep-tel")?.value ?? "").slice(0, 40),
      ospiti: String(form.querySelector<HTMLInputElement>("#ep-ospiti")?.value ?? "").trim().slice(0, 6),
      note: (form.querySelector<HTMLTextAreaElement>("#ep-note")?.value ?? "").trim().slice(0, 900)
    };
  };

  const validateEventPayload = (p: ReturnType<typeof getEventPayloadFromForm>) => {
    if (!p.tipo) return "Seleziona l'occasione.";
    if (!p.nome) return "Inserisci nome e cognome.";

    const telTrimmed = String(p.tel || "").trim();
    if (!telTrimmed) return "Inserisci un telefono/WhatsApp.";
    if (telTrimmed.replace(/\s+/g, "").length < 6) return "Inserisci un telefono valido.";

    const ospitiNum = Number.parseInt(String(p.ospiti || "").trim(), 10);
    if (!Number.isFinite(ospitiNum) || ospitiNum < 1) return "Inserisci il numero di ospiti (minimo 1).";

    if (!p.note) return "Inserisci qualche dettaglio (note).";
    return "";
  };

  const buildEventMessage = (p: ReturnType<typeof getEventPayloadFromForm>) => {
    return [
    "Richiesta EVENTO · EDEN",
    "",
    `Occasione: ${p.tipo || "-"}`,
    `Nome: ${p.nome || "-"}`,
    `Telefono: ${p.tel || "-"}`,
    `Ospiti: ${p.ospiti || "-"}`,
    "",
    "Dettagli:",
    p.note || "-"].
    join("\n");
  };

  const prepareEventWhatsApp = () => {
    const form = eventFormRef.current;
    if (!form) return null;

    const payload = getEventPayloadFromForm(form);
    const err = validateEventPayload(payload);
    if (err) {
      toast({ title: "Controlla il form", description: err, variant: "destructive" });
      return null;
    }

    const msg = buildEventMessage(payload);
    const waUrl = `https://wa.me/393497152524?text=${encodeURIComponent(msg)}`;
    return { msg, waUrl };
  };

  function onEventSubmit() {
    const prepared = prepareEventWhatsApp();
    if (!prepared) return;

    window.open(prepared.waUrl, "_blank", "noopener");
    toast({
      title: "Richiesta pronta su WhatsApp",
      description: "Si è aperta una nuova scheda con il messaggio precompilato."
    });
  }

  async function onEventCopyMessage() {
    const prepared = prepareEventWhatsApp();
    if (!prepared) return;

    try {
      await navigator.clipboard.writeText(prepared.msg);
      toast({ title: "Messaggio copiato", description: "Ora puoi incollarlo su WhatsApp." });
    } catch {
      toast({
        title: "Copia non disponibile",
        description: "Non riesco a copiare il messaggio. Puoi selezionarlo dal form e copiarlo manualmente.",
        variant: "destructive"
      });
    }
  }

  function onEventOpenWhatsApp() {
    const prepared = prepareEventWhatsApp();
    if (!prepared) return;
    window.open(prepared.waUrl, "_blank", "noopener");
  }

  async function handleCopyAddress() {
    const text = "Via Santa Maria della Stella, 66, 70010 Adelfia (BA)";
    try {
      await navigator.clipboard.writeText(text);
      setMiniToast("Indirizzo copiato");
      window.setTimeout(() => setMiniToast(null), 1400);
    } catch {
      toast({
        title: "Copia non disponibile",
        description: "Non riesco a copiare l'indirizzo. Puoi selezionarlo e copiarlo manualmente.",
        variant: "destructive"
      });
    }
  }

  const filteredGallery = useMemo(() => {
    return galleryItems.filter((item) => galleryFilter === "all" || item.category === galleryFilter);
  }, [galleryItems, galleryFilter]);

  return (
    <div className="eden-theme" data-mood={activeTab}>
      <a className="skip-link" href="#main-content">
        Vai al contenuto
      </a>

      {!introDone &&
      <EdenIntroOverlay
        onFinish={() => {
          try {
            window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
          } catch {














            // ignore: if sessionStorage is blocked/unavailable, fallback is showing intro again
          }setIntroDone(true);}} />}
      {/* Sfondo continuo: canvas + aurora */}
      <canvas id="eden-hero-canvas" ref={canvasRef} />
      <div className="hero-aurora" />
      <div className="eden-led" aria-hidden="true" />

      {debugEnabled && <div className="eden-debug" role="status" aria-live="polite">
          <div className="eden-debug-title">EDEN Debug</div>
          <div className="eden-debug-row">
            <span>Leaf sprite</span>
            <strong>{debugInfo.leafStatus}</strong>
          </div>
          <div className="eden-debug-row">
            <span>Canvas</span>
            <strong>{debugInfo.canvasSize}</strong>
          </div>
          <div className="eden-debug-row">
            <span>Leaves</span>
            <strong>{debugInfo.leavesCount}</strong>
          </div>
        </div>}

      <div className="page">
        {/* HEADER */}
        <header className="site-header">
          <div className={`header-inner ${isNavOpen ? "nav-open" : ""}`.trim()}>
            <a className="header-logo" href="#eden" aria-label="Vai a EDEN">
              <img className="header-logo-img" src={headerLogo} alt="EDEN food.wine.restaurant" loading="eager" />
              <div className="header-logo-copy">
                <div className="header-logo-text">EDEN</div>
                <div className="header-logo-sub">FOOD · WINE · RESTAURANT</div>
              </div>
            </a>

            <button className="header-menu-btn" type="button" aria-expanded={isNavOpen} aria-controls="header-nav" onClick={() => setIsNavOpen((v) => !v)}>

              <span className="menu-lines" aria-hidden="true">
                <span />
                <span />
              </span>
              <span className="menu-label">Menu</span>
            </button>

            <nav id="header-nav" className="header-nav" aria-label="Navigazione EDEN">
              <EdenTransitionLink to="/eden">Eden</EdenTransitionLink>
              <EdenTransitionLink to="/cucina">Cucina</EdenTransitionLink>
              <EdenTransitionLink to="/gallery">Gallery</EdenTransitionLink>
              <EdenTransitionLink to="/eventi">Eventi</EdenTransitionLink>
              <EdenTransitionLink to="/recensioni">Recensioni</EdenTransitionLink>
              <EdenTransitionLink to="/contatti">Contatti</EdenTransitionLink>
            </nav>

            <div className="header-actions" aria-label="Contatti e prenotazioni">
              <a className="header-cta" href="tel:+390805248160">
                <span>Prenota</span>
                <strong>080 524 8160</strong>
              </a>
              <a className="header-cta header-cta--wa" href={headerWaUrl} target="_blank" rel="noreferrer">
                <span>Prenota</span>
                <strong>WhatsApp</strong>
              </a>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1}>
          {/* BLOCCO 1 · HERO */}
          <section className="hero" id="hero">
            <div className="hero-blob-wrap parallax-layer" data-parallax="0.12">
              <div className="hero-blob" />
            </div>

            <div className="hero-inner">
              <div className="hero-content parallax-layer" id="hero-content" data-parallax="0.06">
                <h1 className="hero-title">
                  <img className="hero-logo" src="/eden/eden-hero-logo.png" alt="Eden Food.Wine.Restaurant" loading="eager" />
                </h1>
                <p className="hero-sub">
                  Un giardino di pietra, luce e sapori mediterranei. Un Eden contemporaneo nel cuore della Puglia.
                </p>
                <div className="hero-badge-row">
                  <EdenTransitionLink to="/locanda-eden" className="hero-pill hero-pill--locanda">
                    LOCANDA EDEN
                  </EdenTransitionLink>
                  <EdenTransitionLink to="/masseria-petrullo" className="hero-pill hero-pill--masseria">
                    MASSERIA PETRULLO
                  </EdenTransitionLink>
                </div>
              </div>
            </div>

            <div className="hero-scroll parallax-layer" data-parallax="0.18">
              <div className="hero-scroll-inner">
                <div className="hero-scroll-indicator">
                  <span />
                </div>
                <span>Scorri nel nostro Eden</span>
              </div>
            </div>
          </section>


          {/* BLOCCO 2 · SEZIONE EDEN */}
          <section id="eden" className="eden-section reveal-on-scroll">
            <div className="eden-shell">
              <div className="eden-tagline">L&rsquo;Eden di pietra</div>
              <h2 className="eden-title">Un giardino di pietra nel cuore di Adelfia.</h2>
              <p className="eden-sub">
                Dietro un ingresso discreto si apre una sala in pietra: volte, luci calde, tavoli curati. È qui che Eden
                diventa il luogo dove portare chi conta davvero, per una cena o per un evento speciale.
              </p>

              <div className="eden-layout">
                <div className="eden-text reveal-stagger">
                  <div className="eden-point stagger-item">
                    <h3>Pietra viva, luce morbida</h3>
                    <p>
                      Le pareti in pietra e le luci soffuse creano un&rsquo;atmosfera raccolta, elegante ma mai fredda: un Eden
                      contemporaneo che nasce dalla Puglia.
                    </p>
                  </div>
                  <div className="eden-point stagger-item">
                    <h3>Dettagli non scontati</h3>
                    <p>
                      Tratti di verde, toni perlacei, richiami ai trulli e agli ulivi: l&rsquo;ambiente interno parla la stessa
                      lingua dei paesaggi pugliesi.
                    </p>
                  </div>
                  <div className="eden-point stagger-item">
                    <h3>Spazio per cene ed eventi</h3>
                    <p>
                      La sala si presta tanto alla cena a due quanto alle tavolate per compleanni, lauree e cerimonie:
                      l&rsquo;Eden si modella su ciò che devi festeggiare.
                    </p>
                  </div>
                </div>

                <div className="eden-visual">
                  <div className="eden-window eden-window--warm eden-window--photo">
                    <div className="eden-window-shape">
                      <img className="eden-window-photo"
                      src={edenAdelfiaWindow}
                      alt="Eden, Adelfia (Puglia)"
                      loading="eager"
                      decoding="async" />

                    </div>
                    <div className="eden-arch-glow" />
                    <div className="eden-label">
                      <span className="dot" />
                      <span>EDEN - ADELFIA    </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BLOCCO 2B · STORIA DELL'EDEN */}
          <section id="storia" className="story-section reveal-on-scroll">
            <div className="story-shell">
              <div className="story-book" role="presentation" aria-hidden="true" />

              <div className="story-book-inner">
                <div className="story-grid">
                  <div className="story-copy">
                    <div className="story-kicker">Libro dell’Eden</div>
                    <h2 className="story-title">
                      Un giardino nato nella pietra,
                      <br />
                      <em>dove la luce impara a restare.</em>
                    </h2>

                    <div className="story-ornament" aria-hidden="true" />

                    <div className="story-body" aria-label="Storia di Eden">
                      <p className="story-dropcap">
                        C&rsquo;è un momento, appena varcata la soglia, in cui il mondo si abbassa di volume. La pietra respira, le
                        volte raccolgono le voci, e ogni cosa sembra trovare il proprio posto: un calice, una candela, una mano
                        che cerca l&rsquo;altra.
                      </p>
                      <p>
                        Eden nasce così: come una stanza di Puglia vestita d&rsquo;eleganza, senza perdere la sua verità.
                        Un&rsquo;intenzione precisa &mdash; far sentire chi arriva al sicuro, celebrato, visto.
                        Il tempo qui non corre: si posa.
                      </p>
                      <p>
                        Poi viene il rito. La cucina porta in tavola il Mediterraneo con rispetto e desiderio: materie prime,
                        cotture pulite, dettagli che brillano appena. E tra un brindisi e una risata, Eden diventa ciò che
                        promette: un luogo dove non si viene solo a cenare, ma a ricordare.
                      </p>
                    </div>
                  </div>

                  <div className="story-chapters reveal-stagger" aria-label="Capitoli del Libro dell’Eden">
                    <div className="chapter-card stagger-item">
                      <div className="chapter-num">I</div>
                      <div className="chapter-title">La pietra</div>
                      <div className="chapter-text">Antica e gentile: custodisce il calore, addolcisce il rumore, rende tutto più vero.</div>
                    </div>
                    <div className="chapter-card stagger-item">
                      <div className="chapter-num">II</div>
                      <div className="chapter-title">La luce</div>
                      <div className="chapter-text">Un perla-dorato che accarezza i dettagli. Non illumina: invita.</div>
                    </div>
                    <div className="chapter-card stagger-item">
                      <div className="chapter-num">III</div>
                      <div className="chapter-title">Il rito</div>
                      <div className="chapter-text">Tavole curate, sapori netti, brindisi lenti: la festa prende forma, come doveva.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* BLOCCO 3 · CUCINA & MENÙ DEGUSTAZIONE (PREMIUM) */}
          <section
            id="cucina"
            className="cucina-section reveal-on-scroll"
            data-reveal="cucina"
            data-mood={activeTab}>

            <div className="cucina-atmo-wrap" aria-hidden="true">
              <div className="cucina-atmo cucina-atmo--mare" />
              <div className="cucina-atmo cucina-atmo--terra" />
              <div className="cucina-reveal" />
            </div>

            <div className="cucina-shell">
              <div className="cucina-header">
                <div className="cucina-kicker">La cucina di Miriam</div>
                <h2 className="cucina-title">
                  Il sapore del Mediterraneo,<br />
                  <em>servito come si deve.</em>
                </h2>
                <p className="cucina-sub">
                  Materie prime selezionate, cotture attente, presentazioni eleganti. Tre percorsi che raccontano la Puglia nel
                  piatto.
                </p>
              </div>

              <div className="tab-row" role="tablist" aria-label="Percorsi degustazione">
                {percorsi.map((p) => (
                  <button
                    key={p.key}
                    className={`tab-btn ${activeTab === p.key ? "active" : ""}`}
                    data-tab={p.key}
                    role="tab"
                    aria-selected={activeTab === p.key}
                    aria-controls={`panel-${p.key}`}
                    onClick={() => setActiveTab(p.key)}
                    type="button"
                  >
                    <span
                      className={`tab-dot ${p.key === "mare" ? "tab-dot-mare" : p.key === "terra" ? "tab-dot-terra" : "tab-dot-scoperta"}`}
                      aria-hidden="true"
                    />

                    {p.label}
                  </button>
                ))}
                <div className="tab-line" aria-hidden="true" />
              </div>

              {percorsi.map((p) => (
                <div
                  key={p.key}
                  className={`tab-panel ${activeTab === p.key ? "active" : ""} ${tabVisible && activeTab === p.key ? "visible" : ""}`}
                  id={`panel-${p.key}`}
                  role="tabpanel"
                  aria-label={p.label}
                  style={{ display: activeTab === p.key ? "block" : "none" }}>

                  <div className="panel-layout">
                    <div className="panel-visual">
                      {p.key === "terra" ?
                    <div className="dish-orb dish-orb-terra">
                          <div className="dish-orb-inner">
                            <div className="dish-orb-shine" />
                            <div className="dish-orb-label">Terra</div>
                          </div>
                          <div className="orb-ring orb-ring-1" />
                          <div className="orb-ring orb-ring-2" />
                          <div className="orb-float-tag orb-tag-1">Antipasti</div>
                          <div className="orb-float-tag orb-tag-2">Primo</div>
                          <div className="orb-float-tag orb-tag-3">Secondo</div>
                        </div> :
                    p.key === "mare" ?
                    <div className="dish-orb">
                          <div className="dish-orb-inner">
                            <div className="dish-orb-shine" />
                            <div className="dish-orb-label">Mare</div>
                          </div>
                          <div className="orb-ring orb-ring-1" />
                          <div className="orb-ring orb-ring-2" />
                          <div className="orb-float-tag orb-tag-1">Antipasti</div>
                          <div className="orb-float-tag orb-tag-2">Primo</div>
                          <div className="orb-float-tag orb-tag-3">Secondo</div>
                        </div> :

                    <div className="dish-orb">
                          <div className="dish-orb-inner">
                            <div className="dish-orb-shine" />
                            <div className="dish-orb-label">Scoperta</div>
                          </div>
                          <div className="orb-ring orb-ring-1" />
                          <div className="orb-ring orb-ring-2" />
                          <div className="orb-float-tag orb-tag-1">Aperitivo</div>
                          <div className="orb-float-tag orb-tag-2">Taglieri</div>
                          <div className="orb-float-tag orb-tag-3">Note</div>
                        </div>
                    }
                    </div>

                    <div className="panel-content">
                      <div
                      className={`panel-price-badge ${p.key === "terra" ? "panel-price-badge-terra" : ""}`}
                      aria-label={`Prezzo indicativo ${p.label}`}>
                        <span className="price-from">da</span>
                        <span className="price-big" data-target={String(p.price)}>
                          0
                        </span>
                        <span className="price-currency">€</span>
                        <span className="price-person">a persona</span>
                      </div>

                      {p.key === "scoperta" && p.priceExtra ?
                    <div className="panel-price-extra">{p.priceExtra}</div> :
                    null}

                      <div className="menu-head">
                        <div className="menu-title">{p.title}</div>
                      </div>

                      <div className="menu-sections">
                        {p.sections.map((s, idx) =>
                      <div key={`${p.key}-sec-${idx}`} className="menu-section" style={{ ["--i" as any]: idx }}>
                            {s.title ? <div className="menu-section-title">{s.title}</div> : null}
                            {s.items?.length ?
                        <ul className="menu-bullets">
                                {s.items.map((it, ii) =>
                          <li key={`${p.key}-sec-${idx}-it-${ii}`}>{it}</li>
                          )}
                              </ul> :
                        null}
                          </div>
                      )}
                      </div>

                      {p.notes?.length ?
                    <div className="menu-notes" aria-label="Note e condizioni">
                          <div className="menu-notes-title">NOTE / CONDIZIONI</div>
                          <ul className="menu-notes-list">
                            {p.notes.map((n, idx) =>
                        <li key={`${p.key}-note-${idx}`}>
                                <span className="menu-note-label">{n.label}</span>
                                {n.items?.length ?
                          <ul className="menu-note-sublist">
                                    {n.items.map((sub, j) =>
                            <li key={`${p.key}-note-${idx}-sub-${j}`}>{sub}</li>
                            )}
                                  </ul> :
                          null}
                              </li>
                        )}
                          </ul>
                        </div> :
                    null}

                      <a
                      href="#contatti"
                      className={`panel-cta ${p.key === "terra" ? "panel-cta-terra" : ""}`}>

                        Prenota {p.label.toLowerCase()} <span className="cta-arrow" aria-hidden="true">
                          →
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BLOCCO 4 · GALLERIA VISUAL */}
          <section id="gallery" className="gallery-section reveal-on-scroll">
            <div className="gallery-shell">
              <div className="gallery-header">
                <div className="gallery-kicker">I nostri scatti</div>
                <h2 className="gallery-title">L&rsquo;Eden in ogni dettaglio.</h2>

                <div className="gallery-filters">
                  <button
                    className={`filter-btn ${galleryFilter === "all" ? "active" : ""}`}
                    data-filter="all"
                    type="button"
                    onClick={() => onGalleryFilter("all")}>

                    Tutto
                  </button>
                  <button
                    className={`filter-btn ${galleryFilter === "food" ? "active" : ""}`}
                    data-filter="food"
                    type="button"
                    onClick={() => onGalleryFilter("food")}>

                    Piatti
                  </button>
                  <button
                    className={`filter-btn ${galleryFilter === "location" ? "active" : ""}`}
                    data-filter="location"
                    type="button"
                    onClick={() => onGalleryFilter("location")}>

                    Sala
                  </button>
                  <button
                    className={`filter-btn ${galleryFilter === "events" ? "active" : ""}`}
                    data-filter="events"
                    type="button"
                    onClick={() => onGalleryFilter("events")}>

                    Eventi
                  </button>
                </div>
              </div>

              <div className="gallery-grid reveal-stagger">
                {filteredGallery.map((item, idx) =>
                <div
                  key={`${item.title}-${idx}`}
                  className={`gallery-item stagger-item ${item.sizeClass ?? ""}`.trim()}
                  data-category={item.category}
                  style={{ ["--i" as any]: idx }}
                  onClick={() => openLightbox(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openLightbox(item);
                  }}>

                    <img src={item.src} alt={item.alt} loading="lazy" />
                    <div className="gallery-overlay">
                      <div className="overlay-content">
                        <span className="overlay-tag">{item.tag}</span>
                        <h3>{item.title}</h3>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Lightbox */}
            <div
              id="lightbox"
              className={`lightbox ${lightboxOpen ? "active" : ""}`}
              onClick={(e) => {
                if (e.target === e.currentTarget) closeLightbox();
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Anteprima immagine">

              <button className="lightbox-close" type="button" onClick={closeLightbox} aria-label="Chiudi anteprima">
                &times;
              </button>
              <img src={lightboxSrc} alt={lightboxCaption || "Anteprima"} />
              <div className="lightbox-caption">{lightboxCaption}</div>
            </div>
          </section>

          {/* BLOCCO 6 · SOCIAL PROOF & RECENSIONI */}
          <section id="recensioni" className="reviews-premium reveal-on-scroll">
            <div className="reviews-shell">
              <div className="reviews-header">
                <h2 className="reviews-title">
                  L&rsquo;eccellenza,<br />
                  <em>riconosciuta.</em>
                </h2>
                <div className="reviews-stats">
                  <div className="stat-item">
                    <span className="stat-val" data-target="4.5">
                      0
                    </span>
                    <span className="stat-lbl">Google (340+ Recensioni)</span>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-item">
                    <span className="stat-val" data-target="4.9">
                      0
                    </span>
                    <span className="stat-lbl">Facebook (270+ Recensioni)</span>
                  </div>
                  <div className="stat-divider" />
                  <div className="stat-item">
                    <span className="stat-val" data-target="8000" data-format="plain">
                      0
                    </span>
                    <span className="stat-lbl">Follower sui Social</span>
                  </div>
                </div>
              </div>

              <div className="reviews-grid reveal-stagger">
                {EDEN_REVIEWS.map((r, idx) => (
                  <div key={`${r.title}-${idx}`} className="review-card stagger-item">
                    <div className="rc-quote">“</div>
                    <p className="rc-text">{r.text}</p>
                    <div className="rc-meta" aria-label="Valutazione">
                      <div className="rc-stars" aria-hidden="true">
                        {r.stars}
                      </div>
                      <div className="rc-badge">{r.badge}</div>
                    </div>
                    <div className="rc-author">
                      <strong>{r.title}</strong>
                      <span>{r.context}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: vertical marquee */}
              <div
                className={`reviews-marquee ${isReviewsPaused ? "is-paused" : ""}`}
                onPointerDown={() => setIsReviewsPaused(true)}
                onPointerUp={() => setIsReviewsPaused(false)}
                onPointerCancel={() => setIsReviewsPaused(false)}
                onPointerLeave={() => setIsReviewsPaused(false)}
                aria-label="Recensioni in scorrimento">

                {([
                  { speed: "slow", items: EDEN_REVIEWS.filter((_, i) => i % 2 === 0) },
                  { speed: "fast", items: EDEN_REVIEWS.filter((_, i) => i % 2 === 1) },
                ] as const).map((col) => (
                  <div key={col.speed} className="reviews-marquee-col" data-speed={col.speed}>
                    <div className="reviews-marquee-track">
                      {[...col.items, ...col.items].map((r, idx) => (
                        <div key={`${col.speed}-${r.title}-${idx}`} className="review-card">
                          <div className="rc-quote">“</div>
                          <p className="rc-text">{r.text}</p>
                          <div className="rc-meta" aria-label="Valutazione">
                            <div className="rc-stars" aria-hidden="true">
                              {r.stars}
                            </div>
                            <div className="rc-badge">{r.badge}</div>
                          </div>
                          <div className="rc-author">
                            <strong>{r.title}</strong>
                            <span>{r.context}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* BLOCCO 5 · EVENTI PREMIUM (Editorial Style) */}
          <section id="eventi" className="ep-section reveal-on-scroll">
            <div className="ep-shell">
              <div className="ep-layout">
                {/* Lato Sinistro: Visual & Copy */}
                <div className="ep-visual">
                  <div className="ep-kicker">Eventi &amp; Private Parties</div>
                  <h2 className="ep-title">
                    Il tuo evento,<br />
                    <em>firmato Eden.</em>
                  </h2>
                  <p className="ep-desc">
                    Dalla mise en place sartoriale al menù degustazione personalizzato, ogni dettaglio è orchestrato con
                    estrema cura. Lascia che la pietra, le volte e la luce soffusa facciano da cornice ai tuoi momenti
                    indimenticabili.
                  </p>
                  <div className="ep-image-wrapper">
                    <img
                      src="https://images.pexels.com/photos/5638612/pexels-photo-5638612.jpeg?auto=compress&cs=tinysrgb&w=900"
                      alt="Dettaglio tavola Eden"
                      loading="lazy" />

                    <div className="ep-image-overlay" />
                  </div>
                </div>

                {/* Lato Destro: Form Elegante */}
                <div className="ep-form-container">
                  <div className="ep-form-header">
                    <h3>Richiedi una consulenza</h3>
                    <p>Raccontaci la tua idea. Il nostro team ti risponderà con una proposta su misura.</p>
                  </div>

                  <form
                    className="ep-form"
                    id="eden-event-form"
                    ref={eventFormRef}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = eventFormRef.current;
                      if (!form) return;

                      // Enforce native required fields (including radio group)
                      if (!form.checkValidity()) {
                        form.reportValidity();
                        return;
                      }

                      onEventSubmit();
                    }}>

                    {/* Chips per la selezione evento */}
                    <div className="ep-chips-group">
                      <span className="ep-chips-label">Seleziona l'occasione</span>
                      <div className="ep-chips">
                        <label className="ep-chip">
                          <input type="radio" name="tipo" value="Compleanno" required />
                          <span>Compleanno</span>
                        </label>
                        <label className="ep-chip">
                          <input type="radio" name="tipo" value="Laurea" />
                          <span>Laurea</span>
                        </label>
                        <label className="ep-chip">
                          <input type="radio" name="tipo" value="Matrimonio" />
                          <span>Matrimonio</span>
                        </label>
                        <label className="ep-chip">
                          <input type="radio" name="tipo" value="Cerimonia" />
                          <span>Cerimonia</span>
                        </label>
                        <label className="ep-chip">
                          <input type="radio" name="tipo" value="Altro" />
                          <span>Altro</span>
                        </label>
                      </div>
                    </div>

                    {/* Floating Label Inputs */}
                    <div className="ep-input-group">
                      <input type="text" id="ep-nome" name="nome" className="ep-input" required />
                      <label htmlFor="ep-nome" className="ep-label">
                        Nome e Cognome
                      </label>
                      <div className="ep-line" />
                    </div>

                    <div className="ep-row">
                      <div className="ep-input-group">
                        <input type="tel" id="ep-tel" name="tel" className="ep-input" required />
                        <label htmlFor="ep-tel" className="ep-label">
                          Telefono / WhatsApp
                        </label>
                        <div className="ep-line" />
                      </div>
                      <div className="ep-input-group">
                        <input type="number" id="ep-ospiti" name="ospiti" className="ep-input" required min={1} />
                        <label htmlFor="ep-ospiti" className="ep-label">
                          N° Ospiti stimato
                        </label>
                        <div className="ep-line" />
                      </div>
                    </div>

                    <div className="ep-input-group">
                      <textarea id="ep-note" name="note" className="ep-input ep-textarea" required />
                      <label htmlFor="ep-note" className="ep-label">
                        Dettagli, desideri, intolleranze...
                      </label>
                      <div className="ep-line" />
                    </div>

                    <button type="submit" className="ep-submit-btn">
                      <span>Invia la richiesta</span>
                      <span className="ep-btn-arrow">→</span>
                    </button>

                    <div className="ep-fallbacks" aria-label="Contatto telefonico">
                      <a className="ep-fallback" href="tel:+393497152524">
                        Chiama
                      </a>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>

          {/* BLOCCO 7 · CONTATTI */}
          <section id="contatti" className="contact-premium reveal-on-scroll">
            <div className="contact-shell">
              <div className="contact-grid reveal-stagger">
                <div className="contact-info stagger-item">
                  <h2 className="contact-title">
                    Ti aspettiamo<br />
                    <em>all&rsquo;Eden.</em>
                  </h2>
                  <div className="contact-list reveal-stagger">
                    <div className="c-item stagger-item">
                      <span className="c-lbl">Indirizzo</span>
                      <span className="c-val">
                        Via Santa Maria della Stella, 66
                        <br />
                        70010 Adelfia (BA)
                      </span>
                    </div>
                    <div className="c-item stagger-item">
                      <span className="c-lbl">Prenotazioni</span>
                      <span className="c-val">
                        <a href="tel:+390805248160">080 524 8160</a>
                        <br />
                        <a href="https://wa.me/393497152524" target="_blank" rel="noreferrer">
                          349 715 2524 (WhatsApp)
                        </a>
                      </span>
                    </div>
                    <div className="c-item stagger-item">
                      <span className="c-lbl">Orari</span>
                      <span className="c-val">
                        Lunedì - Domenica: 06:30 – 01:00
                        <br />
                        <em className="c-closed">Mercoledì chiuso</em>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="contact-map stagger-item">
                  <div className="directions-card" aria-label="Indicazioni per EDEN">
                    <div className="directions-top">
                      <div>
                        <div className="directions-kicker">Indicazioni</div>
                        <div className="directions-title">Raggiungi Eden</div>
                      </div>
                      <div className="directions-chip">Adelfia (BA)</div>
                    </div>

                    <div className="directions-address">
                      Via Santa Maria della Stella, 66
                      <span>70010 Adelfia (BA)</span>
                    </div>

                    <div className="directions-actions">
                      <a
                        className="eden-btn eden-btn-primary"
                        href="https://www.google.com/maps/search/?api=1&query=Via%20Santa%20Maria%20della%20Stella%2066%20Adelfia"
                        target="_blank"
                        rel="noreferrer">

                        Apri Maps
                      </a>
                      <button className="eden-btn eden-btn-ghost" type="button" onClick={handleCopyAddress}>
                        Copia indirizzo
                      </button>
                    </div>

                    <div className="directions-mini">
                      <a className="mini-link" href="tel:+390805248160">
                        Chiama
                      </a>
                      <span className="mini-dot" aria-hidden="true" />
                      <a className="mini-link" href="https://wa.me/393497152524" target="_blank" rel="noreferrer">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {miniToast ?
            <div className="mini-toast" role="status">
                {miniToast}
              </div> :
            null}
          </section>

          {/* BLOCCO 8 · FOOTER (globale, DB-driven) */}
          <EdenFooter mode="home" />
        </main>
      </div>
    </div>);

}