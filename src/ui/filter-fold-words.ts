/** What the button that folds the filters on a phone says. */
export function filterFoldWords(inUse: number): string {
  if (inUse === 0) return "Filter";
  return `Filter · ${inUse} dipakai`;
}
