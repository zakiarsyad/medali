"use client";

import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useOptimistic,
} from "react";
import { watchOpening } from "./page-change";

/** The path of the page that is opening, or null when none is. */
export const OpeningPage = createContext<string | null>(null);

/**
 * Holds the page that is opening while the router moves to it. The router
 * sets it inside its move, so it falls back to none as the new page shows,
 * also when the move ends on another page or on an error.
 */
export function PageOpeningWatch({ children }: { children: ReactNode }) {
  const [opening, showOpening] = useOptimistic<string | null>(null);
  useEffect(() => watchOpening(showOpening), [showOpening]);
  return <OpeningPage value={opening}>{children}</OpeningPage>;
}

/** The content area, marked busy while another page opens in it. */
export function PageContent({
  className,
  children,
}: {
  className: string | undefined;
  children: ReactNode;
}) {
  const isOpening = use(OpeningPage) !== null;
  return (
    <main className={className} aria-busy={isOpening || undefined}>
      {children}
    </main>
  );
}
