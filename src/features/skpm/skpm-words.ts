/*
 * How Data SKPM writes its numbers. Read by the screen parts in the
 * browser, so nothing here may take from the database code.
 */

/** A number with one decimal, such as 60,0, or "-" for none. */
export function shownOneDecimal(amount: number | null): string {
  if (amount === null) return "-";
  return amount.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Points as written: whole, or with their decimals, such as 7,5. */
export function shownPoints(points: number): string {
  return points.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

/** A text a file may leave empty, or "-". */
export function orDash(text: string | null): string {
  return text ?? "-";
}

/** The note for a role that only reads the tab. */
export function readOnlyNote(pointsForHundred: number): string {
  return `Data SKPM diunggah oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa. Nilai SKPM dihitung dari total poin: ${pointsForHundred.toLocaleString("id-ID")} poin setara nilai 100.`;
}
