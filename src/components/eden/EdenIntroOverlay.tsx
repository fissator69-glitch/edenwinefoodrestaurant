import { useEffect, useMemo, useRef, useState } from "react";

type EdenIntroOverlayProps = {
  durationMs?: number;
  logoDelayMs?: number;
  onFinish?: () => void;
};

const DEFAULT_DURATION = 5000;
const DEFAULT_LOGO_DELAY = 2000;
const EXIT_MS = 520;
const SKIP_EXIT_MS = 260;

export default function EdenIntroOverlay({
  durationMs = DEFAULT_DURATION,
  logoDelayMs = DEFAULT_LOGO_DELAY,
  onFinish,
}: EdenIntroOverlayProps) {
  const [showLogo, setShowLogo] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitMs, setExitMs] = useState(EXIT_MS);
  const [progress, setProgress] = useState(0);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  const restoreOverflowRef = useRef<string>("");

  const finish = (delayMs: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    window.setTimeout(() => {
      onFinish?.();
    }, Math.max(0, delayMs));
  };

  const startExitSequence = (nextExitMs: number) => {
    setProgress(1);
    setExitMs(nextExitMs);
    setIsExiting(true);
    finish(nextExitMs);
  };

  useEffect(() => {
    restoreOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = restoreOverflowRef.current;
    };
  }, []);

  useEffect(() => {
    const tLogo = window.setTimeout(() => setShowLogo(true), logoDelayMs);
    const tExit = window.setTimeout(() => setIsExiting(true), Math.max(0, durationMs - EXIT_MS));
    const tFinish = window.setTimeout(() => finish(0), durationMs);

    return () => {
      window.clearTimeout(tLogo);
      window.clearTimeout(tExit);
      window.clearTimeout(tFinish);
    };
  }, [durationMs, logoDelayMs]);

  useEffect(() => {
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const p = Math.min(1, Math.max(0, elapsed / durationMs));
      setProgress(p);

      if (p < 1 && !finishedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [durationMs]);

  const progressPct = useMemo(() => `${Math.round(progress * 100)}%`, [progress]);

  return (
    <div
      className={`eden-intro ${isExiting ? "is-exiting" : ""}`.trim()}
      style={{ ["--eden-intro-exit-ms" as any]: `${exitMs}ms` }}
      aria-label="Intro EDEN"
    >
      <video
        className="eden-intro-video"
        src="/eden/intro/black_hole_remix.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
      />

      <div className="eden-intro-vignette" aria-hidden="true" />

      <img
        className={`eden-intro-logo ${showLogo ? "is-visible" : ""}`.trim()}
        src="/eden/intro/eden-intro-logo.png"
        alt="EDEN"
        decoding="async"
        loading="eager"
      />

      <div className={`eden-intro-glow ${isExiting ? "is-active" : ""}`.trim()} aria-hidden="true" />

      <button
        type="button"
        className="eden-intro-skip"
        onClick={() => startExitSequence(SKIP_EXIT_MS)}
      >
        Salta intro
      </button>

      <div className="eden-intro-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="eden-intro-progress-track">
          <div className="eden-intro-progress-bar" style={{ width: progressPct }} />
        </div>
      </div>
    </div>
  );
}
