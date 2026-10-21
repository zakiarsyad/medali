import { predicateOf } from "@/character-scores/assessment-score";
import { PREDICATE_WORDS } from "@/character-scores/predicate-words";
import { shownRerata } from "@/character-scores/shown-rerata";
import type { Recap } from "./achievement-recap";

/** What the card and section 1 say instead of numbers for a small group. */
export const TOO_FEW =
  "Rekap ditampilkan setelah minimal 5 mahasiswa, agar nilai perorangan tidak dapat ditebak.";

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** An average to one decimal, as every score of the Dashboard is shown. */
export function oneDecimal(average: number): number {
  return Math.round(average * 10) / 10;
}

/** An average as it is shown, such as 81,7. */
export function averageWords(average: number): string {
  return shownRerata(oneDecimal(average));
}

/** The line of the card "Capaian karakter". */
export function cardLine(recap: Recap): string {
  const { gold, guidance } = recap.spread;
  return `Hasil asesmen ${shown(recap.assessed)} dari ${shown(recap.students)} mahasiswa. ${shown(gold)} emas, ${shown(guidance)} perlu pembinaan.`;
}

/** The change of a value since last semester, or "Semester pertama" without one. */
export function changeWords(change: number | null): string {
  if (change === null) return "Semester pertama";
  const rounded = oneDecimal(change);
  if (rounded === 0) return "+0,0 dari semester lalu";
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${shownRerata(rounded)} dari semester lalu`;
}

/** "Rerata 81,7 · Perak" under the medal. */
export function rerataLine(rerata: number): string {
  return `Rerata ${shownRerata(rerata)} · ${PREDICATE_WORDS[predicateOf(rerata)]}`;
}

/** The line under the medal: how many are assessed, and what the dashed line is. */
export function medalCaption(recap: Recap): string {
  const assessed = `${shown(recap.assessed)} dari ${shown(recap.students)} mahasiswa sudah diasesmen.`;
  if (recap.change === null) return assessed;
  return `${assessed} Garis putus-putus menunjukkan semester lalu.`;
}
