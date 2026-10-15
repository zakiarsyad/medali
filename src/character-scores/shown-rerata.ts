/** A Rerata with one decimal, such as 80,3, or "-" for none. */
export function shownRerata(rerata: number | null): string {
  if (rerata === null) return "-";
  return rerata.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
