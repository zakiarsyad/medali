import { shownDay } from "@/ui/day";
import type { WarningLevel } from "./warning-ids";

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

export const CALL_ENDED = "Panggilan klarifikasi tidak lagi aktif";

export const NO_REDUCTIONS = "Belum ada pengurangan pada semester ini.";

export const UNDO_QUESTION =
  "Batalkan pengurangan ini? Pelanggaran kembali tercatat dan tampil di pengumuman.";

export const REDUCTION_UNDONE =
  "Pengurangan dibatalkan. Pelanggaran kembali tercatat dan tampil di pengumuman.";

/** What the button of the ticks says, with how many are ticked. */
export function reduceButtonWords(ticked: number): string {
  if (ticked === 0) return "Kurangi pelanggaran terpilih";
  return `Kurangi ${ticked} pelanggaran`;
}

/** Asked before the ticked violations are reduced, with how many will still count. */
export function reduceManyQuestion(
  ticked: number,
  name: string,
  left: number,
): string {
  return `Kurangi ${ticked} pelanggaran milik ${name}? Pelanggaran dihapus dari pengumuman pelanggaran. Sisa ${left} pelanggaran tercatat.`;
}

/** Where a resident stands toward an SP after a reduction. */
export interface CallAfter {
  counted: number;
  /** The SP they are still called for, or null when no call is active. */
  level: WarningLevel | null;
}

/**
 * Said once the ticked violations are reduced: how many, and whether the
 * call of the resident is still active, with the violations still
 * counted. Without a stored period nothing is said of the call.
 */
export function manyReducedWords(
  reduced: number,
  after: CallAfter | null,
): string {
  const said = `${reduced} pelanggaran dikurangi.`;
  if (after === null) return said;
  if (after.level === null) {
    return `${said} ${CALL_ENDED} (${after.counted} pelanggaran tercatat).`;
  }
  return `${said} Panggilan SP ${after.level} masih aktif (${after.counted} pelanggaran tercatat).`;
}
