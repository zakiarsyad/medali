import type { FormState } from "@/ui/form-message";

/*
 * The rule that a change of dates on a schedule with attendances is
 * agreed to first, apart from the database, so it can be checked alone.
 * Read by the form in the browser: nothing here may take from the
 * database code.
 */

interface ScheduleDays {
  startsOn: string;
  endsOn: string;
}

/**
 * What saving a schedule answers: the words to show, and the number of
 * attendances the person is asked about, which the next press sends
 * back, or null.
 */
export interface ScheduleAnswer extends FormState {
  attendances: number | null;
}

/** A change that is not saved until the attendances it moves are agreed to. */
export interface MoveToConfirm {
  ok: false;
  error: string;
  attendances: number;
}

/**
 * Whether the person must first agree before the dates of a schedule
 * move: it has attendances, its first or last day changes, and the number
 * they agreed to is not the number there is now. So attendances that came
 * in since they agreed are asked about again. The period follows the
 * first day, so a change of period is a change of dates.
 */
export function mustConfirmMove(
  kept: ScheduleDays,
  sent: ScheduleDays,
  attendances: number,
  agreed: string,
): boolean {
  if (attendances === 0) return false;
  const isMoved =
    kept.startsOn !== sent.startsOn || kept.endsOn !== sent.endsOn;
  if (!isMoved) return false;
  return agreed !== String(attendances);
}

export function moveConfirmWords(attendances: number): string {
  return `Sudah ada ${attendances} presensi masuk untuk jadwal ini. Presensi mahasiswa yang tidak lagi menjadi sasaran, atau jadwal yang belum dimulai, tidak dihitung. Tekan Simpan perubahan lagi untuk melanjutkan.`;
}
