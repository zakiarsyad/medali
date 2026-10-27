import { type LinkPress, leavesPage } from "./ask-before-leaving";

/** What tells whether a press on a link moves to another page of the app. */
export interface LinkMovePress extends LinkPress {
  href: string;
  /** Whether the link saves a file instead of opening it. */
  download: boolean;
  /**
   * Whether the app took the press over to open the page itself. A link
   * it does not take, such as one to a file, is opened by the browser.
   */
  takenByApp: boolean;
}

/** An address of the app: its path and what follows its `?`. */
function appAddress(url: URL): string {
  return url.pathname + url.search;
}

/**
 * The address of the app a press on a link moves to, or null when the
 * press opens nothing in the page shown. `here` is the address shown.
 */
export function linkMoveAddress(
  press: LinkMovePress,
  here: string,
): string | null {
  if (!press.takenByApp || press.download || !leavesPage(press)) return null;
  const to = new URL(press.href, here);
  if (to.origin !== new URL(here).origin) return null;
  return appAddress(to);
}

/**
 * Whether opening `to` shows something other than the page shown: the
 * page already open, or a part of it, is no move.
 */
export function movesAway(to: string, here: string): boolean {
  return appAddress(new URL(to, here)) !== appAddress(new URL(here));
}

/** The path of an address of the app, without what follows its `?`. */
export function pathOf(to: string, here: string): string {
  return new URL(to, here).pathname;
}
