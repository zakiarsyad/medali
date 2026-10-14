import type {
  AnnouncedAttendance,
  MarkedParticipant,
  PresenceStatus,
} from "./announced-attendance";
import type { AcceptedAs, DormClarificationReason } from "./clarification-ids";
import { REASON_WORDS } from "./clarification-words";
import { type HistoryEntry, heldKey, type Tally } from "./history";

/*
 * How an accepted clarification changes the attendance at a dorm
 * activity: the resident is Hadir or Izin there, whatever the count
 * keeps, as with approved leave. Leave that covers the activity decides
 * first. Read by the screen parts in the browser, so nothing here may
 * take from the database code.
 */

/** An accepted clarification, with the resident's mark in the count as it is now. */
export interface AcceptedClarification {
  /** The key of the activity on its day. */
  key: string;
  studentId: string;
  /** What the count keeps for the resident now. */
  isAbsent: boolean;
  acceptedAs: AcceptedAs;
  reason: DormClarificationReason;
}

/** An accepted clarification as Rincian of staff lists its resident. */
export interface AcceptedParticipant extends AcceptedClarification {
  name: string;
  nim: string;
  /** The note BAM wrote in the count. */
  note: string;
}

/** The note of an attendance an accepted clarification gave: its reason, then BAM's note. */
export function clarifiedNote(
  note: string,
  reason: DormClarificationReason,
): string {
  const words = `Klarifikasi: ${REASON_WORDS[reason]}`;
  return note === "" ? words : `${words} · ${note}`;
}

/**
 * Hadir and Tidak hadir as accepted clarifications make them: the mark
 * the count keeps leaves the tally, and Hadir comes in its place, or
 * nothing for Izin, which counts as neither. A mark whose activity
 * approved leave covers, by `coveredKeys`, is left to the leave.
 */
export function tallyWithClarifications(
  tally: Tally,
  accepted: AcceptedClarification[],
  coveredKeys: ReadonlySet<string>,
): Tally {
  let { present, absent } = tally;
  for (const each of accepted) {
    if (coveredKeys.has(each.key)) continue;
    if (each.isAbsent) absent -= 1;
    else present -= 1;
    if (each.acceptedAs === "present") present += 1;
  }
  return { present, absent };
}

const STATUS_OF: Record<AcceptedAs, PresenceStatus> = {
  present: "present",
  leave: "leave",
};

/**
 * Riwayat as accepted clarifications make it: an announced activity the
 * resident clarified is Hadir or Izin, with the reason in its note. Izin
 * of approved leave and an activity not announced stay as they are.
 */
export function historyWithClarifications(
  history: HistoryEntry[],
  accepted: ReadonlyMap<string, AcceptedClarification>,
): HistoryEntry[] {
  return history.map((entry) => {
    const clarified = accepted.get(heldKey(entry));
    if (!clarified) return entry;
    if (entry.status === "leave" || entry.status === "not_announced") {
      return entry;
    }
    return {
      ...entry,
      status: STATUS_OF[clarified.acceptedAs],
      note: clarifiedNote(entry.note, clarified.reason),
    };
  });
}

function byName(a: MarkedParticipant, b: MarkedParticipant): number {
  if (a.name !== b.name) return a.name.localeCompare(b.name, "id");
  return a.nim.localeCompare(b.nim);
}

/**
 * An announced count as accepted clarifications make it: the resident
 * leaves Hadir or Tidak hadir as the count keeps them and counts as Hadir,
 * or as neither for Izin, and Rincian lists them with the reason. A
 * participant whose approved leave covers the activity, by
 * `coveredIds`, is left to the leave.
 */
export function attendanceWithClarifications(
  attendance: AnnouncedAttendance,
  accepted: AcceptedParticipant[],
  coveredIds: ReadonlySet<string>,
): AnnouncedAttendance {
  const applying = accepted.filter((each) => !coveredIds.has(each.studentId));
  if (applying.length === 0) return attendance;
  const tally = tallyWithClarifications(attendance, applying, new Set());
  const ids = new Set(applying.map((each) => each.studentId));
  const marked = attendance.marked
    .filter((row) => !ids.has(row.studentId))
    .concat(
      applying.map(({ studentId, name, nim, note, acceptedAs, reason }) => ({
        studentId,
        name,
        nim,
        status: STATUS_OF[acceptedAs],
        note: clarifiedNote(note, reason),
      })),
    )
    .sort(byName);
  return { ...attendance, ...tally, marked };
}
