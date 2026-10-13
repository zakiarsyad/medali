/*
 * The attendance numbers of a schedule on "Kegiatan PPKS", apart from
 * the database and from how they are drawn, so they can be checked
 * alone. Read by the list in the browser: nothing here may take from
 * the database code.
 */

/** How the students a schedule is meant for stand, among those an account sees. */
export interface AttendanceCount {
  /** The Aktif students the schedule is meant for. */
  targeted: number;
  /** Those with a valid attendance. */
  present: number;
  /** Those whose photo waits to be checked. */
  waiting: number;
  /** Those with a dispensation, who are left out of Kehadiran. */
  dispensations: number;
}

/** The numbers of each schedule that has started, by the key of the schedule. */
export type AttendanceCounts = Readonly<Record<string, AttendanceCount>>;

/** How many students "Peserta" lists on one page. */
export const ABSENT_PAGE_SIZE = 40;

/** A student who did not attend: nothing sent, or a rejected photo. */
export interface AbsentStudent {
  name: string;
  nim: string;
}

/** What "Peserta" of one schedule shows. */
export interface AbsentList {
  scheduleId: string;
  targeted: number;
  /** How many did not attend, on every page together. */
  absent: number;
  /** One page of them, by name. */
  students: AbsentStudent[];
  /** The page shown: the one asked for, or the last one there is. */
  page: number;
}

/** The attendance one page of the list of schedules shows. */
export interface ListAttendance {
  counts: AttendanceCounts;
  /** The "Peserta" that is open, or null while none is. */
  absent: AbsentList | null;
}

/** Whether a schedule has started by a day: from its first day on. */
export function hasStarted(
  schedule: { startsOn: string },
  today: string,
): boolean {
  return schedule.startsOn <= today;
}

/**
 * Kehadiran of a schedule: those present out of the students it is
 * meant for without the dispensations, as a whole percent. Null when
 * nobody is left to count.
 */
export function attendancePercent(count: AttendanceCount): number | null {
  const counted = count.targeted - count.dispensations;
  if (counted <= 0) return null;
  return Math.round((count.present / counted) * 100);
}

/** Kehadiran as its cell shows it: "-" before the start and with nobody to count. */
export function shownAttendance(count: AttendanceCount | undefined): string {
  if (count === undefined) return "-";
  const percent = attendancePercent(count);
  return percent === null ? "-" : `${percent}%`;
}

/** The line "Peserta" opens with. */
export function absentWords(targeted: number, absent: number): string {
  return `${targeted.toLocaleString("id-ID")} sasaran. ${absent.toLocaleString("id-ID")} tidak hadir atau ditolak.`;
}
