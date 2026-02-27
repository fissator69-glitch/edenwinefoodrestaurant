import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type EdenRouteTransitionContextValue = {
  startEdenTransition: (to: string) => void;
  isTransitioning: boolean;
};

const EdenRouteTransitionContext = createContext<EdenRouteTransitionContextValue | null>(null);

function prefersReducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const TOTAL_MS = 320;

export function EdenRouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutsRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const startEdenTransition = useCallback(
    (to: string) => {
      if (prefersReducedMotion()) {
        navigate(to);
        return;
      }

      // Prevent stacking transitions on rapid clicks.
      if (isTransitioning) return;

      clearTimers();
      setIsTransitioning(true);

      // Navigate immediately: the new page should feel instant.
      navigate(to);

      // End the micro "glow flash" quickly.
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setIsTransitioning(false);
        }, TOTAL_MS),
      );
    },
    [navigate, isTransitioning, clearTimers],
  );

  const value = useMemo(() => ({ startEdenTransition, isTransitioning }), [startEdenTransition, isTransitioning]);

  return (
    <EdenRouteTransitionContext.Provider value={value}>
      <div className={isTransitioning ? "eden-transitioning" : undefined}>{children}</div>
      <div
        className={isTransitioning ? "eden-route-transition eden-route-transition--flash" : "eden-route-transition"}
        aria-hidden="true"
      />
    </EdenRouteTransitionContext.Provider>
  );
}

export function useEdenRouteTransition() {
  const ctx = useContext(EdenRouteTransitionContext);
  if (!ctx) throw new Error("useEdenRouteTransition must be used within EdenRouteTransitionProvider");
  return ctx;
}
