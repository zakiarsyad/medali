"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  chosenPath,
  formMoveAddress,
  isChosen,
  linkMoveAddress,
  movesAway,
  pathOf,
} from "./page-move-rules";

interface PageMove {
  /** The path being moved to, or null while no move runs. */
  movingTo: string | null;
  /** The path a tab or menu item shows as chosen, or null for the open one. */
  chosen: string | null;
  /** Marks a move to `to` as started, until the address shown changes. */
  start: (to: string) => void;
}

const PageMoveContext = createContext<PageMove>({
  movingTo: null,
  chosen: null,
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

function formMoveOf(event: SubmitEvent): string | null {
  if (!(event.target instanceof HTMLFormElement)) return null;
  const form = event.target;
  const sent = {
    method: form.method,
    action: form.getAttribute("action"),
    takenByApp: event.defaultPrevented,
  };
  const fields = [...new FormData(form, event.submitter)];
  return formMoveAddress(sent, fields, window.location.href);
}

/**
 * Knows when the app is moving to another page, tab, filter or search,
 * from the press until the new address is shown. The app's links and
 * search forms open their page themselves; a press or a send is seen here
 * after them, so a press that a form takes back, as one with unsaved
 * changes asks, is never seen.
 */
export function PageMoveProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shown = `${pathname}?${useSearchParams().toString()}`;
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

    function onSend(event: SubmitEvent) {
      const to = formMoveOf(event);
      if (to !== null) start(to);
    }

    window.addEventListener("click", onPress);
    window.addEventListener("submit", onSend);
    return () => {
      window.removeEventListener("click", onPress);
      window.removeEventListener("submit", onSend);
    };
  }, [start]);

  return (
    <PageMoveContext.Provider
      value={{ movingTo, chosen: chosenPath(movingTo, pathname), start }}
    >
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

/**
 * A link of a tab or the menu, marked as chosen while it is the one open,
 * or at once when it is pressed, before its page arrives.
 */
export function ChosenLink({
  href,
  isOpen,
  className,
  children,
}: {
  href: string;
  isOpen: boolean;
  className: string | undefined;
  children: ReactNode;
}) {
  const { chosen } = useContext(PageMoveContext);
  return (
    <Link
      href={href}
      className={className}
      aria-current={isChosen(isOpen, href, chosen) ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

type Router = ReturnType<typeof useRouter>;

/**
 * `push` and `replace` of the router, for a filter or a day choice that
 * changes the address by itself, so the content dims as for a link.
 */
export function usePageMove(): Pick<Router, "push" | "replace"> {
  const router = useRouter();
  const { start } = useContext(PageMoveContext);
  return useMemo(
    () => ({
      push(href, options) {
        start(href);
        router.push(href, options);
      },
      replace(href, options) {
        start(href);
        router.replace(href, options);
      },
    }),
    [router, start],
  );
}
