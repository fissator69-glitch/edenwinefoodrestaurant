import { useEffect, useRef, type RefObject } from "react";

type PetalSrcs = {
  pink: string;
  yellow: string;
};

type PetalIntensity = "off" | "low" | "medium";

type Props = {
  leafSrc: string;
  petalSrcs?: PetalSrcs;
  petalIntensity?: PetalIntensity;
  /** Default: 0.56 (only used for petals) */
  petalOpacity?: number;
  /** Multiplier for leaf particle count (default: 1). */
  leafMultiplier?: number;
  /** Multiplier for petal particle count (default: 1). */
  petalMultiplier?: number;
  /** Override cap for petal count (only affects medium/low). Default keeps current caps. */
  petalCap?: number;
};

type ParticleKind = "leaf" | "petalPink" | "petalYellow";

type Particle = {
  kind: ParticleKind;
  x: number;
  y: number;
  size: number;
  speedY: number;
  swayAmp: number;
  swaySpeed: number;
  angle: number;
  rotSpeed: number;
  time: number;

  // leaves only
  hue?: number;

  // petals only (sprite variant)
  variant?: number;
};

type Glow = {
  x: number;
  y: number;
  radius: number;
  alphaBase: number;
  alphaVar: number;
  speedY: number;
  speedX: number;
  hue: number;
  t: number;
};

type SpriteSet = {
  sprites: HTMLCanvasElement[];
  aspect: number;
  ready: boolean;
};

function useFallingLeavesCanvas(
  canvasRef: RefObject<HTMLCanvasElement>,
  opts: {
    leafSrc: string;
    petalSrcs?: PetalSrcs;
    petalIntensity?: PetalIntensity;
    petalOpacity?: number;
    leafMultiplier?: number;
    petalMultiplier?: number;
    petalCap?: number;
  },
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect reduced motion for subpages.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let glows: Glow[] = [];
    let heroWidth = 0;
    let heroHeight = 0;
    let raf = 0;

    const LEAF_OPACITY = 0.42;
    const LEAF_TINT_HUES = [115, 123, 131, 139, 147];

    const PETAL_OPACITY = typeof opts.petalOpacity === "number" ? opts.petalOpacity : 0.56;

    // Sprite sets
    let leafSet: SpriteSet = { sprites: [], aspect: 1, ready: false };
    let petalPinkSet: SpriteSet = { sprites: [], aspect: 1, ready: false };
    let petalYellowSet: SpriteSet = { sprites: [], aspect: 1, ready: false };

    const mouse = { x: 0, y: 0, active: false };

    function clamp(n: number, a: number, b: number) {
      return Math.max(a, Math.min(b, n));
    }

    // Remove low-saturation pixels (background keying), downscale, and cache a few variants.
    function buildMaskedSprites(img: HTMLImageElement, config: { targetH: number; tintHues?: number[] }): SpriteSet {
      const srcW = img.naturalWidth || img.width;
      const srcH = img.naturalHeight || img.height;
      if (!srcW || !srcH) return { sprites: [], aspect: 1, ready: false };

      const masked = document.createElement("canvas");
      masked.width = srcW;
      masked.height = srcH;
      const mctx = masked.getContext("2d");
      if (!mctx) return { sprites: [], aspect: 1, ready: false };

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
        const sat = max === 0 ? 0 : (max - min) / max;

        if (sat < 0.12) d[i + 3] = 0;
      }

      mctx.putImageData(imageData, 0, 0);

      const aspect = srcW / srcH;
      const targetH = config.targetH;
      const targetW = Math.max(1, Math.round(targetH * aspect));

      const base = document.createElement("canvas");
      base.width = targetW;
      base.height = targetH;
      const bctx = base.getContext("2d");
      if (!bctx) return { sprites: [], aspect, ready: false };

      bctx.clearRect(0, 0, targetW, targetH);
      bctx.imageSmoothingEnabled = true;
      bctx.imageSmoothingQuality = "high";
      bctx.drawImage(masked, 0, 0, targetW, targetH);

      // Leaves: subtle hue tint variants. Petals: micro-variants for naturalness.
      const sprites = (config.tintHues?.length ? config.tintHues : [0, 1, 2]).map((v, idx) => {
        const c = document.createElement("canvas");
        c.width = targetW;
        c.height = targetH;
        const cctx = c.getContext("2d");
        if (!cctx) return c;

        cctx.clearRect(0, 0, targetW, targetH);
        cctx.drawImage(base, 0, 0);

        cctx.globalCompositeOperation = "source-atop";
        if (config.tintHues?.length) {
          cctx.fillStyle = `hsla(${v},45%,55%,0.18)`;
          cctx.fillRect(0, 0, targetW, targetH);
        } else {
          // Soft light/dim variants (cheap) — preserves original pink/yellow.
          if (idx === 1) {
            cctx.fillStyle = "rgba(255,255,255,0.09)";
            cctx.fillRect(0, 0, targetW, targetH);
          }
          if (idx === 2) {
            cctx.fillStyle = "rgba(0,0,0,0.07)";
            cctx.fillRect(0, 0, targetW, targetH);
          }
        }
        cctx.globalCompositeOperation = "source-over";

        return c;
      });

      return { sprites, aspect, ready: true };
    }

    function createGlows() {
      glows = [];
      const count = Math.max(12, Math.floor((heroWidth * heroHeight) / 90000));
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
          t: Math.random() * Math.PI * 2,
        });
      }
    }

    function getPetalCount(leafCount: number, petalMultiplier?: number, petalCap?: number) {
      if (!opts.petalSrcs) return 0;
      const intensity: PetalIntensity = opts.petalIntensity ?? "medium";
      if (intensity === "off") return 0;

      // +60% circa (rapporto + cap) mantenendo un tetto massimo per performance.
      const base = intensity === "low" ? Math.floor(leafCount * 0.56) : Math.floor(leafCount * 0.88);
      const scaled = Math.floor(base * (petalMultiplier ?? 1));

      const defaultCap = intensity === "low" ? 38 : 64;
      const rawCap = typeof petalCap === "number" ? petalCap : defaultCap;
      const cap = clamp(Math.floor(rawCap), 0, 140);

      return clamp(scaled, 0, cap);
    }

    function createParticles() {
      particles = [];

      const baseLeafCount = Math.floor((heroWidth * heroHeight) / 22000);
      const leafCount = clamp(Math.floor(baseLeafCount * (opts.leafMultiplier ?? 1)), 0, 100000);
      for (let i = 0; i < leafCount; i++) {
        particles.push({
          kind: "leaf",
          x: Math.random() * heroWidth,
          y: Math.random() * heroHeight,
          size: 0.5 + Math.random() * 1.2,
          speedY: 0.25 + Math.random() * 0.5,
          swayAmp: 10 + Math.random() * 18,
          swaySpeed: 0.3 + Math.random() * 0.5,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.01,
          hue: 115 + Math.random() * 30,
          time: Math.random() * 100,
        });
      }

      const petalCount = getPetalCount(leafCount, opts.petalMultiplier, opts.petalCap);
      if (petalCount > 0) {
        for (let i = 0; i < petalCount; i++) {
          const kind: ParticleKind = i % 2 === 0 ? "petalPink" : "petalYellow";
          particles.push({
            kind,
            x: Math.random() * heroWidth,
            y: Math.random() * heroHeight,
            size: 0.35 + Math.random() * 0.85,
            // a bit slower than leaves
            speedY: 0.18 + Math.random() * 0.42,
            // a touch more flutter
            swayAmp: 12 + Math.random() * 24,
            swaySpeed: 0.34 + Math.random() * 0.55,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            time: Math.random() * 100,
            variant: Math.floor(Math.random() * 3),
          });
        }
      }

      // Mix order (natural layering)
      for (let i = particles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [particles[i], particles[j]] = [particles[j], particles[i]];
      }
    }

    function resizeCanvas() {
      heroWidth = window.innerWidth;
      heroHeight = window.innerHeight;
      canvas.width = heroWidth;
      canvas.height = heroHeight;
      createParticles();
      createGlows();
    }

    function drawGlow(g: Glow) {
      const alpha = g.alphaBase + Math.sin(g.t) * g.alphaVar;
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      grad.addColorStop(0, `hsla(${g.hue},80%,85%,${alpha})`);
      grad.addColorStop(1, `hsla(${g.hue},80%,40%,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawLeaf(l: Particle) {
      if (!leafSet.ready || leafSet.sprites.length === 0) return;
      if (typeof l.hue !== "number") return;

      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.angle);

      // 1:1 parity with Home
      const baseH = 19.5;
      const h = baseH * l.size;
      const w = h * leafSet.aspect;

      const t = clamp((l.hue - 115) / 30, 0, 0.999);
      const idx = clamp(Math.floor(t * leafSet.sprites.length), 0, leafSet.sprites.length - 1);

      ctx.globalAlpha = LEAF_OPACITY;
      ctx.drawImage(leafSet.sprites[idx], -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    function drawPetal(p: Particle) {
      const set = p.kind === "petalPink" ? petalPinkSet : petalYellowSet;
      if (!set.ready || set.sprites.length === 0) return;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // +35% circa
      const baseH = 19.5;
      const h = baseH * p.size;
      const w = h * set.aspect;

      const idx = clamp(p.variant ?? 0, 0, set.sprites.length - 1);
      ctx.globalAlpha = PETAL_OPACITY;
      ctx.drawImage(set.sprites[idx], -w / 2, -h / 2, w, h);
      ctx.restore();
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

      for (const p of particles) {
        p.time += 0.016;

        const sway = Math.sin(p.time * p.swaySpeed) * p.swayAmp;

        let wind = 0;
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) wind = ((180 - dist) / 180) * 10 * (dx > 0 ? 1 : -1);
        }

        p.x += sway * 0.03 + wind * 0.02;
        p.y += p.speedY;
        p.angle += p.rotSpeed;

        if (p.y > heroHeight + 30) {
          p.y = -30;
          p.x = Math.random() * heroWidth;
          p.time = Math.random() * 100;
          if (p.kind === "petalPink" || p.kind === "petalYellow") {
            p.variant = Math.floor(Math.random() * 3);
          }
        }
        if (p.x < -40) p.x = heroWidth + 40;
        if (p.x > heroWidth + 40) p.x = -40;

        if (p.kind === "leaf") drawLeaf(p);
        else drawPetal(p);
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

    const start = () => {
      resizeCanvas();
      raf = requestAnimationFrame(animate);
    };

    // --- Load sprites ---
    const leafImg = new Image();
    leafImg.src = opts.leafSrc;

    const leafTimeout = window.setTimeout(() => {
      if (leafSet.ready) return;
      console.warn(`[EDEN] Leaf sprite still not ready after 2.5s. Check ${opts.leafSrc} loading.`);
    }, 2500);

    leafImg.onload = () => {
      leafSet = buildMaskedSprites(leafImg, { targetH: 64, tintHues: LEAF_TINT_HUES });
      window.clearTimeout(leafTimeout);
      start();
    };

    leafImg.onerror = () => {
      window.clearTimeout(leafTimeout);
      console.warn(`[EDEN] Leaf sprite failed to load: ${opts.leafSrc}`);
      start();
    };

    // Petals are optional; load in parallel and fail silently.
    let pinkTimeout = 0;
    let yellowTimeout = 0;

    if (opts.petalSrcs) {
      const pinkImg = new Image();
      pinkImg.src = opts.petalSrcs.pink;
      pinkTimeout = window.setTimeout(() => {
        if (petalPinkSet.ready) return;
        console.warn(`[EDEN] Pink petal sprite still not ready after 2.5s. Check ${opts.petalSrcs?.pink} loading.`);
      }, 2500);

      pinkImg.onload = () => {
        petalPinkSet = buildMaskedSprites(pinkImg, { targetH: 62 });
        window.clearTimeout(pinkTimeout);
      };
      pinkImg.onerror = () => {
        window.clearTimeout(pinkTimeout);
        console.warn(`[EDEN] Pink petal sprite failed to load: ${opts.petalSrcs?.pink}`);
      };

      const yellowImg = new Image();
      yellowImg.src = opts.petalSrcs.yellow;
      yellowTimeout = window.setTimeout(() => {
        if (petalYellowSet.ready) return;
        console.warn(`[EDEN] Yellow petal sprite still not ready after 2.5s. Check ${opts.petalSrcs?.yellow} loading.`);
      }, 2500);

      yellowImg.onload = () => {
        petalYellowSet = buildMaskedSprites(yellowImg, { targetH: 62 });
        window.clearTimeout(yellowTimeout);
      };
      yellowImg.onerror = () => {
        window.clearTimeout(yellowTimeout);
        console.warn(`[EDEN] Yellow petal sprite failed to load: ${opts.petalSrcs?.yellow}`);
      };
    }

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.clearTimeout(leafTimeout);
      if (pinkTimeout) window.clearTimeout(pinkTimeout);
      if (yellowTimeout) window.clearTimeout(yellowTimeout);
      cancelAnimationFrame(raf);
    };
  }, [
    canvasRef,
    opts.leafSrc,
    opts.petalSrcs?.pink,
    opts.petalSrcs?.yellow,
    opts.petalIntensity,
    opts.petalOpacity,
    opts.leafMultiplier,
    opts.petalMultiplier,
    opts.petalCap,
  ]);
}

export default function EdenFallingLeavesCanvas({
  leafSrc,
  petalSrcs,
  petalIntensity,
  petalOpacity,
  leafMultiplier,
  petalMultiplier,
  petalCap,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useFallingLeavesCanvas(canvasRef, {
    leafSrc,
    petalSrcs,
    petalIntensity,
    petalOpacity,
    leafMultiplier,
    petalMultiplier,
    petalCap,
  });

  return <canvas className="eden-falling-leaves-canvas" ref={canvasRef} aria-hidden="true" />;
}

