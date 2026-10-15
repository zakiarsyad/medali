import type { CampusMoment } from "@/academic-periods/campus-clock";
import { daysAfter } from "@/academic-periods/days-after";
import type { DormId } from "@/dorms/dorms";
import { countAudience, type ResidentsByDorm } from "./activity-audience";
import { takingPlaceOn } from "./activity-days";
import type { Organiser } from "./activity-ids";
import type { ActivityRow } from "./activity-row";
import { type ActivityState, activityState } from "./activity-state";
import { attendanceRate } from "./attendance-rate";
import {
  type Attendance,
  type Changed,
  type MarkGroup,
  type Place,
  participantsOf,
  tallyWhere,
} from "./dashboard-tally";

/*
 * The activities Dashboard asrama looks at: today's and those of the 7
 * dates before, as in the prototype, with their announced counts.
 */

/** How many dates before today Dashboard asrama looks back. */
const DAYS_BACK = 7;

/** The first day Dashboard asrama looks at. */
export function firstDayShown(today: string): string {
  return daysAfter(today, -DAYS_BACK);
}

/** The first and the last day Dashboard asrama looks at. */
export interface DaysShown {
  first: string;
  last: string;
}

export function daysShown(today: string): DaysShown {
  return { first: firstDayShown(today), last: today };
}

/** An announced count, by its activity and day. */
export interface AnnouncedCount {
  id: string;
  activityId: string;
  day: string;
}

/** An activity on one of the days shown. */
export interface ActivityLine {
  day: string;
  activity: ActivityRow;
  state: ActivityState;
  /** The id of its announced count; null while none is announced. */
  countId: string | null;
}

function countOf(
  counts: AnnouncedCount[],
  activityId: string,
  day: string,
): string | null {
  const found = counts.find(
    (count) => count.activityId === activityId && count.day === day,
  );
  return found?.id ?? null;
}

/**
 * Every activity of today and the 7 dates before, as Jadwal harian shows
 * each day, the latest first, with its state now and its announced count.
 */
export function linesOf(
  rows: ActivityRow[],
  counts: AnnouncedCount[],
  now: CampusMoment,
): ActivityLine[] {
  const lines: ActivityLine[] = [];
  for (let back = 0; back <= DAYS_BACK; back++) {
    const day = daysAfter(now.day, -back);
    for (const activity of takingPlaceOn(rows, day).reverse()) {
      lines.push({
        day,
        activity,
        state: activityState({ ...activity, day }, now),
        countId: countOf(counts, activity.id, day),
      });
    }
  }
  return lines;
}

/**
 * Whether a line counts towards Kehadiran: its count is announced and
 * the activity is over, as on Kegiatan asrama.
 */
export function isCounted(line: ActivityLine): boolean {
  return line.countId !== null && line.state === "over";
}

/** Hadir, Tidak hadir and Izin of a line's announced count, or null without one. */
export function attendanceOfLine(
  line: ActivityLine,
  groups: MarkGroup[],
  changed: Changed[],
): Attendance | null {
  if (line.countId === null) return null;
  const { countId } = line;
  return tallyWhere(groups, changed, (place) => place.countId === countId);
}

/** A line of Kehadiran kegiatan. */
export interface ShownLine {
  day: string;
  activity: ActivityRow;
  state: ActivityState;
  /** Those of its announced count, or as Jadwal harian counts them before. */
  participants: number;
  /** Hadir, Tidak hadir and Izin of its announced count; null before it. */
  attendance: Attendance | null;
}

/**
 * A line as Kehadiran kegiatan shows it: an announced activity with the
 * Peserta of its count, and one not announced with the residents of the
 * dorms it is for.
 */
export function shownLineOf(
  line: ActivityLine,
  groups: MarkGroup[],
  changed: Changed[],
  residents: ResidentsByDorm,
): ShownLine {
  const { day, activity, state } = line;
  const attendance = attendanceOfLine(line, groups, changed);
  const participants =
    attendance === null
      ? countAudience(residents, activity.audience)
      : participantsOf(attendance);
  return { day, activity, state, participants, attendance };
}

/** What the Kehadiran cell of a line shows. */
export type Kehadiran =
  | { kind: "rate"; rate: number | null }
  | { kind: "not_announced" }
  | { kind: "state"; state: ActivityState };

/**
 * Kehadiran of a line: the rate of an announced activity that is over,
 * "Belum diumumkan" for one over without a count, and the state of one
 * that is not over.
 */
export function kehadiranOf(
  line: Pick<ShownLine, "state" | "attendance">,
): Kehadiran {
  if (line.state !== "over") return { kind: "state", state: line.state };
  if (line.attendance === null) return { kind: "not_announced" };
  const { present, absent } = line.attendance;
  return { kind: "rate", rate: attendanceRate(present, present + absent) };
}

/** The attendance of some activities, and how many they are. */
export interface CountedAttendance {
  attendance: Attendance;
  activities: number;
}

function countedOf(
  lines: ActivityLine[],
  groups: MarkGroup[],
  changed: Changed[],
  keeps: (place: Place) => boolean = () => true,
): CountedAttendance {
  const ids = new Set<string>();
  for (const line of lines) {
    if (isCounted(line) && line.countId !== null) ids.add(line.countId);
  }
  const attendance = tallyWhere(
    groups,
    changed,
    (place) => ids.has(place.countId) && keeps(place),
  );
  return { attendance, activities: ids.size };
}

/** Kehadiran 7 hari terakhir: the announced activities that are over. */
export function overallAttendance(
  lines: ActivityLine[],
  groups: MarkGroup[],
  changed: Changed[],
): CountedAttendance {
  return countedOf(lines, groups, changed);
}

/**
 * Kehadiran per penanggung jawab: the announced activities that are over
 * of each, and how many they are.
 */
export function attendanceByOrganiser(
  lines: ActivityLine[],
  groups: MarkGroup[],
  changed: Changed[],
): Record<Organiser, CountedAttendance> {
  const byOrganiser = (organiser: Organiser) =>
    countedOf(
      lines.filter((line) => line.activity.organiser === organiser),
      groups,
      changed,
    );
  return {
    upk: byOrganiser("upk"),
    coach: byOrganiser("coach"),
    bam: byOrganiser("bam"),
  };
}

/**
 * Kehadiran per asrama: the residents of each dorm, by the dorm they live
 * in today, in the announced activities that are over.
 */
export function attendanceByDorm(
  lines: ActivityLine[],
  groups: MarkGroup[],
  changed: Changed[],
): Record<DormId, Attendance> {
  const byDorm = (dorm: DormId) =>
    countedOf(lines, groups, changed, (place) => place.dorm === dorm)
      .attendance;
  return {
    wismantara_putra: byDorm("wismantara_putra"),
    wismantara_putri: byDorm("wismantara_putri"),
    dana_rakca: byDorm("dana_rakca"),
    cipta_bakti: byDorm("cipta_bakti"),
  };
}
