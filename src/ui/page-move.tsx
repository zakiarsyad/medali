"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { linkMoveAddress, movesAway, pathOf } from "./page-move-rules";

interface PageMove {
  /** The path being moved to, or null while no move runs. */
  movingTo: string | null;
  /** Marks a move to `to` as started, until the address shown changes. */
  start: (to: string) => void;
}

const PageMoveContext = createContext<PageMove>({
  movingTo: null,
  start: () => {},
});

function linkMoveOf(event: MouseEvent): string | null {
  if (!(event.target instanceof Element)) return null;
  const link = event.target.closest("a[href]");
  if (link === null) return null;
  const press = {
    href: link.getAttribute("href") ?? "",
    button: event.button,
    withKey: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
    target: link.getAttribute("target") ?? "",
    download: link.hasAttribute("download"),
    takenByApp: event.defaultPrevented,
  };
  return linkMoveAddress(press, window.location.href);
}

/**
 * Knows when the app is moving to another page, tab, filter or search,
 * from the press until the new address is shown. The app's links open
 * their page themselves; a press is seen here after them, so a press that
 * a form takes back, as one with unsaved changes asks, is never seen.
 */
export function PageMoveProvider({ children }: { children: ReactNode }) {
  const shown = `${usePathname()}?${useSearchParams().toString()}`;
  const [seen, setSeen] = useState(shown);
  const [movingTo, setMovingTo] = useState<string | null>(null);

  if (seen !== shown) {
    setSeen(shown);
    setMovingTo(null);
  }

  const start = useCallback((to: string) => {
    const here = window.location.href;
    setMovingTo(movesAway(to, here) ? pathOf(to, here) : null);
  }, []);

  useEffect(() => {
    function onPress(event: MouseEvent) {
      const to = linkMoveOf(event);
      if (to !== null) start(to);
    }

    window.addEventListener("click", onPress);
    return () => window.removeEventListener("click", onPress);
  }, [start]);

  return (
    <PageMoveContext.Provider value={{ movingTo, start }}>
      {children}
    </PageMoveContext.Provider>
  );
}

/**
 * The content area of every page. While a move runs it cannot be pressed,
 * and it dims after a short wait so a fast move does not flicker.
 */
export function MovingContent({
  className,
  children,
}: {
  className: string | undefined;
  children: ReactNode;
}) {
  const { movingTo } = useContext(PageMoveContext);
  return (
    <main className={className} aria-busy={movingTo !== null}>
      {children}
    </main>
  );
}
