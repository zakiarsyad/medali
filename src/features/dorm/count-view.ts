import type { CampusMoment } from "@/academic-periods/campus-clock";
import type { DormId } from "@/dorms/dorms";
import type { ActivityRow } from "./activity-row";
import { activityState, type Held } from "./activity-state";
import type { CountMark, CountMarks } from "./count-ids";
import type { LeaveMarks } from "./leave-marks";
import { isOwnRecord } from "./own-record";

/*
 * What "Penghitungan kehadiran" shows, and the rules it shows it by. Read
 * by the screen parts in the browser, so nothing here may take from the
 * database code.
 */

/** A resident who takes part in an activity on its day. */
export interface Participant {
  id: string;
  name: string;
  nim: string;
  dorm: DormId;
  /** The number of their room in that dorm, or null when not placed. */
  room: string | null;
}

/** A count as it is kept. */
export interface KeptCount {
  /** Which save of the count is kept, counted from 1. */
  version: number;
  /** When it was saved last, as a draft or as an announcement. */
  savedAt: Date;
  /** When it was announced last, and by whom; null for a draft. */
  announcedAt: Date | null;
  announcedBy: string | null;
  marks: CountMarks;
}

/** The version a form sends for an activity that had no count when it opened. */
export const NOT_COUNTED_YET = 0;

/** "Penghitungan kehadiran" for the activity chosen among the day's. */
export type CountPanelView =
  | { kind: "not_started"; activity: ActivityRow }
  | {
      kind: "open";
      activity: ActivityRow;
      participants: Participant[];
      kept: KeptCount | null;
      /** The participants approved leave covers at the activity. */
      onLeave: LeaveMarks;
    };

const PRESENT: CountMark = { isAbsent: false, note: "" };

/**
 * The marks with no participant on approved leave marked Tidak hadir:
 * the leave decides how they count, whatever the count kept for them.
 */
export function withoutLeaveAbsences(
  marks: CountMarks,
  onLeave: LeaveMarks,
): CountMarks {
  const cleared: CountMarks = { ...marks };
  for (const [id, mark] of Object.entries(marks)) {
    if (mark.isAbsent && onLeave[id])
      cleared[id] = { ...mark, isAbsent: false };
  }
  return cleared;
}

/**
 * Whether an activity of a day has started at a moment on campus, so its
 * attendance may be counted: it runs or is over.
 */
export function hasStarted(held: Held, now: CampusMoment): boolean {
  const state = activityState(held, now);
  return state === "running" || state === "over";
}

/**
 * The activity "Penghitungan kehadiran" opens on: the one the address
 * asks for when the day has it, or else the latest that has started, or
 * else the first. Null for a day without activities.
 */
export function chosenActivity(
  activities: ActivityRow[],
  wantedId: string | null,
  day: string,
  now: CampusMoment,
): ActivityRow | null {
  const wanted = activities.find((activity) => activity.id === wantedId);
  if (wanted) return wanted;
  const started = activities.filter((activity) =>
    hasStarted({ ...activity, day }, now),
  );
  return started.at(-1) ?? activities[0] ?? null;
}

/**
 * The mark of each participant: the one the count keeps, or Hadir without
 * a note for a participant it does not hold yet. A kept mark of someone
 * who no longer takes part is left out.
 */
export function marksFor(
  participants: Participant[],
  kept: CountMarks,
): CountMarks {
  const marks: CountMarks = {};
  for (const { id } of participants) marks[id] = kept[id] ?? PRESENT;
  return marks;
}

/** Whether two marks are the same. A note of only spaces is no note: it is not sent. */
function isSameMark(one: CountMark, other: CountMark): boolean {
  const isSameNote = one.note.trim() === other.note.trim();
  return one.isAbsent === other.isAbsent && isSameNote;
}

/** Whether two sets of marks give each participant the same mark. */
export function sameMarks(a: CountMarks, b: CountMarks): boolean {
  const ids = Object.keys(a);
  if (ids.length !== Object.keys(b).length) return false;
  return ids.every((id) => {
    const one = a[id];
    const other = b[id];
    if (one === undefined || other === undefined) return false;
    return isSameMark(one, other);
  });
}

/** The marks a save keeps, and whether it left out a change of the account's own mark. */
export interface OwnMarkKept {
  marks: CountMarks;
  ownChangeLeftOut: boolean;
}

/**
 * The marks sent, with the account's own mark as the count keeps it: a
 * resident who also counts never marks themselves. A mark not sent is
 * Hadir without a note, and the own key is found in any case.
 */
export function withOwnMarkKept(
  sent: CountMarks,
  kept: CountMarks,
  ownStudentId: string | null,
): OwnMarkKept {
  if (ownStudentId === null) return { marks: sent, ownChangeLeftOut: false };
  const keptOwn = kept[ownStudentId];
  const marks: CountMarks = {};
  const sentOwn: CountMark[] = [];
  for (const [id, mark] of Object.entries(sent)) {
    if (isOwnRecord(ownStudentId, id)) sentOwn.push(mark);
    else marks[id] = mark;
  }
  if (keptOwn !== undefined) marks[ownStudentId] = keptOwn;
  if (sentOwn.length === 0) sentOwn.push(PRESENT);
  const ownChangeLeftOut = sentOwn.some(
    (mark) => !isSameMark(mark, keptOwn ?? PRESENT),
  );
  return { marks, ownChangeLeftOut };
}

/** How many are marked Tidak hadir. */
export function absentCount(marks: CountMarks): number {
  return Object.values(marks).filter((mark) => mark.isAbsent).length;
}

function isMarked(mark: CountMark | undefined): boolean {
  return mark !== undefined && (mark.isAbsent || mark.note !== "");
}

function matches(participant: Participant, query: string): boolean {
  if (query === "") return true;
  return (
    participant.name.toLowerCase().includes(query) ||
    participant.nim.includes(query)
  );
}

/**
 * The participants the list shows: those whose name or NIM holds what was
 * typed in "Cari nama atau NIM", and under "Hanya tidak hadir atau
 * bercatatan" only those absent or with a note.
 */
export function shownParticipants(
  participants: Participant[],
  marks: CountMarks,
  typed: string,
  onlyMarked: boolean,
): Participant[] {
  const query = typed.trim().toLowerCase();
  return participants.filter((participant) => {
    if (onlyMarked && !isMarked(marks[participant.id])) return false;
    return matches(participant, query);
  });
}
