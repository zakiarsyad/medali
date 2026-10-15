import { shownDay } from "@/ui/day";
import type { CallSchedule, WarningLevel } from "./warning-ids";

/*
 * How the calls and warning letters of the dorm are said on screen. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

export const NOT_SCHEDULED = "Belum dijadwalkan";

/** The schedule of a call as a row shows it, such as 16 Okt 2026 16:00 · Kantor Pengelola Asrama. */
export function scheduleWords(schedule: CallSchedule | null): string {
  if (schedule === null) return NOT_SCHEDULED;
  return `${shownDay(schedule.day)} ${schedule.time} · ${schedule.place}`;
}

/** Why a resident is called, as one line: the causes joined by "dan". */
export function causeWords(causes: string[]): string {
  return causes.join(" dan ");
}

/** The button that issues an SP of `level`. */
export function issueButtonWords(level: WarningLevel): string {
  if (level === 1) return "Terbitkan SP 1";
  return "Terbitkan SP 2 dan ajukan hukuman disiplin";
}

const CANNOT_BE_UNDONE =
  "SP yang sudah terbit tidak dapat diubah atau ditarik.";

/** What is asked before an SP is issued, as it cannot be undone. */
export function issueQuestion(name: string, level: WarningLevel): string {
  if (level === 1) return `Terbitkan SP 1 untuk ${name}? ${CANNOT_BE_UNDONE}`;
  return `Terbitkan SP 2 untuk ${name} dan ajukan hukuman disiplin ke Kepala UPK? ${CANNOT_BE_UNDONE}`;
}
