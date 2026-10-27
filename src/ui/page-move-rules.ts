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

/**
 * An address of the app: its path and what follows its `?`, written the
 * one way the router writes it, so the same address is never two.
 */
function appAddress(url: URL): string {
  const search = new URLSearchParams(url.search).toString();
  return search === "" ? url.pathname : `${url.pathname}?${search}`;
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

/** Whether `pathname` is the page at `page` or a page under it. */
export function opensPath(pathname: string, page: string): boolean {
  return pathname === page || pathname.startsWith(`${page}/`);
}

/**
 * The path a tab or menu item shows as chosen while a move runs: none
 * while a filter or search of the page shown loads, as its tab stays.
 */
export function chosenPath(
  movingTo: string | null,
  pathname: string,
): string | null {
  return movingTo === pathname ? null : movingTo;
}

/**
 * Whether a tab or menu item opening `href` shows as chosen: the one
 * pressed while its page loads, so the press is seen at once, and
 * otherwise the one open.
 */
export function isChosen(
  isOpen: boolean,
  href: string,
  chosen: string | null,
): boolean {
  if (chosen === null) return isOpen;
  return opensPath(chosen, href);
}

/** What tells whether a sent form moves to another address of the app. */
export interface SentForm {
  method: string;
  /** The `action` the form was given, or null for none. */
  action: string | null;
  /** Whether the app took the send over to open the address itself. */
  takenByApp: boolean;
}

function isAddress(action: string | null): action is string {
  return action !== null && !action.startsWith("javascript:");
}

/**
 * The address a search or filter form moves to, its fields after the
 * `?`, or null for a form that saves or that sends itself in its own way.
 */
export function formMoveAddress(
  form: SentForm,
  fields: [string, FormDataEntryValue][],
  here: string,
): string | null {
  if (!form.takenByApp || form.method !== "get") return null;
  if (!isAddress(form.action)) return null;
  const to = new URL(form.action, here);
  const search = new URLSearchParams();
  for (const [name, value] of fields) {
    if (typeof value === "string") search.append(name, value);
  }
  to.search = search.toString();
  return appAddress(to);
}

/** A step of a move: a press that opens `to`, or the app showing what it got. */
export type MoveStep = { kind: "pressed"; to: string } | { kind: "shown" };

/**
 * The path a move runs to after a step, or null when none runs. A move
 * ends once the app has shown what it got, also when that is the address
 * already shown, as for a page that sends on to its first tab.
 */
export function movingToAfter(step: MoveStep, here: string): string | null {
  if (step.kind === "shown") return null;
  return movesAway(step.to, here) ? pathOf(step.to, here) : null;
}
