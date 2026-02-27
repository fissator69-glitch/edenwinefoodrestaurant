import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

const TOTAL_MS = 560;

export function EdenRouteTransitionProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutsRef = useRef<number[]>([]);
  const skipNextLocationTransitionRef = useRef(false);
  const isFirstLocationEffectRef = useRef(true);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  // Trigger the transition on every navigation, including browser back/forward.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    // Avoid a flash on the initial mount.
    if (isFirstLocationEffectRef.current) {
      isFirstLocationEffectRef.current = false;
      return;
    }

    // Avoid double-trigger when navigation is initiated by startEdenTransition().
    if (skipNextLocationTransitionRef.current) {
      skipNextLocationTransitionRef.current = false;
      return;
    }

    clearTimers();
    setIsTransitioning(true);
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setIsTransitioning(false);
      }, TOTAL_MS),
    );
  }, [location.key, clearTimers]);

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

      // Prevent the location effect from re-triggering for this navigation.
      skipNextLocationTransitionRef.current = true;

      // Navigate immediately: the new page should feel instant.
      navigate(to);

      // End the micro "veil" quickly.
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
