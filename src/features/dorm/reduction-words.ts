import { shownDay } from "@/ui/day";

/*
 * How reductions of dorm violations are said on screen. Read by the
 * screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const REASON_LABEL =
  "Dasar pengurangan (hasil klarifikasi yang diterima)";

export const REASON_EXAMPLE = "Misalnya: terbukti sedang izin resmi";

/** Asked before one violation is reduced. */
export function reduceOneQuestion(day: string, name: string): string {
  return `Kurangi pelanggaran ${shownDay(day)} milik ${name}? Pelanggaran tidak lagi dihitung untuk SP dan dihapus dari pengumuman pelanggaran.`;
}

/** Said once one violation is reduced. */
export function oneReducedWords(day: string): string {
  return `Pelanggaran ${shownDay(day)} dikurangi dan dihapus dari pengumuman.`;
}
