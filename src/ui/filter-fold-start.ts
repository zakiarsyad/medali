/**
 * Whether the filters folded on a phone start open. The fold is made anew
 * after each choice, so it starts open while a filter is in use: the next
 * choice is then made without opening it again.
 */
export function filterFoldStartsOpen(inUse: number): boolean {
  return inUse > 0;
}
