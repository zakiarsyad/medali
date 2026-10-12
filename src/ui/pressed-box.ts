/**
 * The address of the box that a press on a screen opened last. It is kept
 * in memory only, so it is forgotten when the page is loaded anew: after
 * that nothing says the entry before the box in the browser's history is
 * the screen under it.
 */
let pressedAddress: string | null = null;

export function rememberPressedBox(address: string): void {
  pressedAddress = address;
}

export function pressedBox(): string | null {
  return pressedAddress;
}

/**
 * Whether the box that is shown closes by going one step back in the
 * browser's history. It does when a press on the screen under it opened
 * it: going back then leaves no entry of the box behind. A box opened any
 * other way, by a typed address or by loading the page anew, has no such
 * step to go back to.
 */
export function closesByGoingBack(
  pressed: string | null,
  shown: string,
): boolean {
  return pressed === shown;
}
