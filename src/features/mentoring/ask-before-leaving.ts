import { useEffect } from "react";

const QUESTION =
  "Perubahan daftar hadir belum disimpan. Tinggalkan tanpa menyimpan?";

/** What tells whether a press on a link leaves the page shown. */
export interface LinkPress {
  /** Which mouse button: 0 is the main one. */
  button: number;
  /** Whether a key that opens a link elsewhere was held. */
  withKey: boolean;
  /** Where the link opens, as its `target` says. Empty for this page. */
  target: string;
}

/**
 * Whether a press on a link takes the person away from the page shown. A
 * link opened in a new tab or window leaves the page where it is.
 */
export function leavesPage(press: LinkPress): boolean {
  const opensHere = press.target === "" || press.target === "_self";
  return press.button === 0 && !press.withKey && opensHere;
}

function linkPressOf(event: MouseEvent): LinkPress | null {
  if (!(event.target instanceof Element)) return null;
  const link = event.target.closest("a[href]");
  if (link === null) return null;
  return {
    button: event.button,
    withKey: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
    target: link.getAttribute("target") ?? "",
  };
}

/**
 * While a form holds unsaved changes, asks before the person leaves it:
 * by a link of the app, such as "Tutup", a tab, another group or the
 * menu, and by loading the page anew or closing it, where the browser
 * asks in its own words. A press that the person takes back goes nowhere.
 * The browser's own step back is not asked about.
 */
export function useAskBeforeLeaving(isUnsaved: boolean): void {
  useEffect(() => {
    if (!isUnsaved) return;
    // A link that loads a whole page would be asked about twice.
    let isAnswered = false;

    function askOnPress(event: MouseEvent) {
      const press = linkPressOf(event);
      if (press === null || !leavesPage(press)) return;
      if (window.confirm(QUESTION)) {
        isAnswered = true;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    }

    function askOnUnload(event: BeforeUnloadEvent) {
      if (!isAnswered) event.preventDefault();
    }

    // Caught on its way down, before the link itself sees the press.
    document.addEventListener("click", askOnPress, true);
    window.addEventListener("beforeunload", askOnUnload);
    return () => {
      document.removeEventListener("click", askOnPress, true);
      window.removeEventListener("beforeunload", askOnUnload);
    };
  }, [isUnsaved]);
}
