import React, { type MouseEvent } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { useEdenRouteTransition } from "@/components/eden/EdenRouteTransitionProvider";

type EdenTransitionLinkProps = Omit<LinkProps, "to"> & {
  to: string;
};

export default function EdenTransitionLink({ to, onClick, ...props }: EdenTransitionLinkProps) {
  const { startEdenTransition } = useEdenRouteTransition();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    // Let new-tab / modified clicks behave normally.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    startEdenTransition(to);
  };

  return <Link {...props} to={to} onClick={handleClick} />;
}
