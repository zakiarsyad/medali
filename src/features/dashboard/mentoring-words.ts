function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** The line under "Mahasiswa aktif": only while a filter is in use. */
export function everyoneLine(everyone: number | null): string | undefined {
  if (everyone === null) return undefined;
  return `dari ${shown(everyone)} mahasiswa aktif`;
}

/** The line under "Pengasuh". */
export function groupsLine(groups: number): string {
  return `${shown(groups)} kelompok pengasuhan`;
}

/** The line under "Catatan 30 hari terakhir". */
export const RECENT_NOTES_LINE = "konseling, mentoring, apresiasi";

/** The line under "Perlu pembinaan". */
export function intensiveLine(intensive: number): string {
  return `${shown(intensive)} di antaranya intensif`;
}
