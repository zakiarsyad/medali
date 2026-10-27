/** Whether `path` is the page at `address`, or a page under it. */
export function isWithin(path: string, address: string): boolean {
  return path === address || path.startsWith(`${address}/`);
}

/**
 * The path that tabs or menu items are marked by: the page that is
 * opening, from the moment one of `addresses` is pressed, or else the
 * page that is open.
 */
export function markedPath(
  addresses: string[],
  opening: string | null,
  open: string,
): string {
  if (opening === null) return open;
  const isOneOfThem = addresses.some((address) => isWithin(opening, address));
  return isOneOfThem ? opening : open;
}

/** The screen's own way to show a page opening, while it is drawn. */
let showOpening: ((path: string) => void) | null = null;

/** Lets the screen show each page that starts opening, until it stops. */
export function watchOpening(show: (path: string) => void): () => void {
  showOpening = show;
  return () => {
    showOpening = null;
  };
}

/** Tells the screen that the page at `url` starts opening. */
export function pageOpening(url: string): void {
  showOpening?.(new URL(url, location.href).pathname);
}
