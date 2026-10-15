import { DORM_IDS, DORM_SHORT_NAMES } from "@/dorms/dorms";
import type { ResidentsByDorm } from "./activity-audience";
import { attendanceRate, rateWords } from "./attendance-rate";
import type { Attendance } from "./dashboard-tally";

/*
 * How Dashboard asrama says its numbers. Read by the screen parts in the
 * browser too, so nothing here may take from the database code.
 */

function shown(amount: number): string {
  return amount.toLocaleString("id-ID");
}

/** Every dorm's short name with its residents, such as "Dana Rakca 30". */
export function residentsNote(residents: ResidentsByDorm): string {
  return DORM_IDS.map(
    (dorm) => `${DORM_SHORT_NAMES[dorm]} ${shown(residents[dorm])}`,
  ).join(" · ");
}

export function totalResidents(residents: ResidentsByDorm): number {
  let total = 0;
  for (const dorm of DORM_IDS) total += residents[dorm];
  return total;
}

/** Under "Sedang di luar asrama": how many are late, as in the prototype. */
export function outNote(outLate: number): string {
  if (outLate === 0) return "dengan izin disetujui";
  return `${shown(outLate)} terlambat kembali`;
}

/** How far a bar is filled, from 0 to 1, and the words beside it. */
export interface BarFill {
  share: number;
  words: string;
}

/** A bar of Kehadiran: its rate, or empty with "-" when no one was counted. */
export function rateBar(attendance: Attendance): BarFill {
  const { present, absent } = attendance;
  const rate = attendanceRate(present, present + absent);
  return { share: rate === null ? 0 : rate / 100, words: rateWords(rate) };
}

/** A bar of a number, filled by its share of the total. */
export function countBar(amount: number, total: number): BarFill {
  return { share: total === 0 ? 0 : amount / total, words: shown(amount) };
}

/** Under "Kehadiran 7 hari terakhir": how many activities it counts. */
export function attendanceNote(activities: number): string {
  if (activities === 0) return "Belum ada kegiatan yang diumumkan";
  return `${shown(activities)} kegiatan, izin tidak dihitung`;
}
