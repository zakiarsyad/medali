"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSelectedLayoutSegments,
} from "next/navigation";
import {
  createContext,
  memo,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
  /** Marks a move to `to` as started, until the app shows what it got. */
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
 * Tells each time the app has shown what the router got: the router gives
 * the layout new parts then, also for a move that ends on the address
 * already shown. Kept apart, so a render of the content does not count.
 */
const ShownMark = memo(function ShownMark({ shown }: { shown: () => void }) {
  useSelectedLayoutSegments();
  useLayoutEffect(() => shown());
  return null;
});

/**
 * Knows when the app is moving to another page, tab, filter or search,
 * from the press until the app shows what it got. The app's links and
 * search forms open their page themselves; a press or a send is seen here
 * after them, so a press that a form takes back, as one with unsaved
 * changes asks, is never seen.
 */
export function PageMoveProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [movingTo, setMovingTo] = useState<string | null>(null);

  const start = useCallback((to: string) => {
    const here = window.location.href;
    setMovingTo(movesAway(to, here) ? pathOf(to, here) : null);
  }, []);
  const shown = useCallback(() => setMovingTo(null), []);

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
      <ShownMark shown={shown} />
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
