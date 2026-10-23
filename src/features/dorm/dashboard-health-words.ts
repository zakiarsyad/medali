/*
 * How the health panels of Dashboard asrama say their numbers. Read by
 * the screen parts, so nothing here may take from the database code.
 */

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** What "Kesehatan jasmani penghuni" says instead of counts while 1 to 4 residents are tested. */
export const PHYSICAL_TOO_FEW =
  "Rekap ditampilkan setelah minimal 5 penghuni dites, agar identitas tidak dapat ditebak.";

/** What "Kesehatan jasmani penghuni" says while no resident in reach is tested. */
export const NOBODY_TESTED = "Belum ada hasil tes kebugaran penghuni.";

/** The line beside "Kesehatan jasmani penghuni". */
export function testedLine(tested: number, residents: number): string {
  return `${shown(tested)} dari ${shown(residents)} sudah dites`;
}
