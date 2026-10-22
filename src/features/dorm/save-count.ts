import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { brokeUniqueRule } from "@/db/unique-violation";
import type { Parsed } from "@/parsed";
import { closeWithdrawn } from "./clarification-store";
import type { CountMarks } from "./count-ids";
import type { CountInput } from "./count-input";
import {
  ANNOUNCED_ALREADY,
  COUNT_CHANGED,
  COUNT_NOT_ALLOWED,
  NOT_A_PARTICIPANT,
  NOT_HELD_THAT_DAY,
  NOT_STARTED,
  ON_LEAVE,
} from "./count-messages";
import { readParticipants } from "./count-participants";
import {
  lockActivity,
  readStoredCount,
  type StoredCount,
  writeCount,
} from "./count-store";
import {
  hasStarted,
  marksFor,
  NOT_COUNTED_YET,
  type Participant,
  withOwnMarkKept,
  withoutLeaveAbsences,
} from "./count-view";
import { readActivityOn } from "./daily-activities";
import {
  type ApprovedLeave,
  type HeldTimes,
  leaveMarkOf,
  leaveMarksAt,
} from "./leave-marks";
import { readApprovedLeaves, spanOfHeld } from "./leave-store";
import { OWN_RECORD } from "./own-record";

/** What a save tells the one who saved. */
export interface SavedCount {
  /** Which save of the count is kept now, for the form to send next. */
  version: number;
  isAnnounced: boolean;
  /**
   * What is said when a change of the account's own mark was left out
   * while the other rows were saved, or null.
   */
  ownMarkRefusal: string | null;
}

type Counter = Pick<Account, "id" | "roles" | "studentId">;

/** The database's rule of one count for an activity on a day. */
const ONE_COUNT_RULE = "dorm_attendance_counts_one_per_activity_and_day";

/** Whether every one the form marks takes part. */
function marksOnly(input: CountInput, participants: Participant[]): boolean {
  const ids = new Set(participants.map((participant) => participant.id));
  return Object.keys(input.marks).every((id) => ids.has(id));
}

/**
 * Whether the form marks Tidak hadir someone whose approved leave covers
 * the activity: the leave decides how they count.
 */
function marksAbsentOnLeave(
  input: CountInput,
  leaves: ApprovedLeave[],
  held: HeldTimes,
): boolean {
  return Object.entries(input.marks).some(
    ([id, mark]) => mark.isAbsent && leaveMarkOf(leaves, id, held) !== null,
  );
}

/** The participants a form marks Tidak hadir. */
function absentIn(input: CountInput): Set<string> {
  const absent = Object.entries(input.marks).filter(
    ([, mark]) => mark.isAbsent,
  );
  return new Set(absent.map(([id]) => id));
}

/** The marks the form of the count starts from, as the screen reads them. */
function formStart(
  participants: Participant[],
  kept: StoredCount | null,
  leaves: ApprovedLeave[],
  held: HeldTimes,
): CountMarks {
  const ids = participants.map((participant) => participant.id);
  return withoutLeaveAbsences(
    marksFor(participants, kept?.marks ?? {}),
    leaveMarksAt(leaves, ids, held),
  );
}

async function saveIn(
  tx: Database,
  actor: Counter,
  sent: CountInput,
  moment: Date,
): Promise<Parsed<SavedCount>> {
  if (!(await lockActivity(tx, sent.activityId))) return NOT_HELD_THAT_DAY;
  const held = await readActivityOn(tx, sent.activityId, sent.day);
  if (held === null) return NOT_HELD_THAT_DAY;
  const now = { day: campusDay(moment), time: campusTime(moment) };
  if (!hasStarted({ ...held, day: sent.day }, now)) return NOT_STARTED;
  const kept = await readStoredCount(tx, sent.activityId, sent.day);
  if ((kept?.version ?? NOT_COUNTED_YET) !== sent.version) {
    return COUNT_CHANGED;
  }
  const wasAnnounced = kept !== null && kept.announcedAt !== null;
  if (wasAnnounced && !sent.isAnnouncement) return ANNOUNCED_ALREADY;
  const participants = await readParticipants(tx, held.audience, sent.day);
  const times = { ...held, day: sent.day };
  const leaves = await readApprovedLeaves(tx, spanOfHeld(times));
  const start = formStart(participants, kept, leaves, times);
  const own = withOwnMarkKept(sent.marks, start, actor.studentId);
  const input = { ...sent, marks: own.marks };
  if (!marksOnly(input, participants)) return NOT_A_PARTICIPANT;
  if (marksAbsentOnLeave(input, leaves, times)) return ON_LEAVE;

  const version = await writeCount(tx, actor.id, input, participants, kept);
  // Only a count announced before can have clarifications.
  if (input.isAnnouncement && wasAnnounced) {
    await closeWithdrawn(tx, kept.id, absentIn(input), actor.id);
  }
  const isAnnounced = wasAnnounced || input.isAnnouncement;
  const ownMarkRefusal = own.ownChangeLeftOut ? OWN_RECORD.error : null;
  return { ok: true, value: { version, isAnnounced, ownMarkRefusal } };
}

/**
 * "Simpan" and "Umumkan ketidakhadiran": keeps the count of an activity
 * on a day as the work of the actor, as a draft or announced. Refused for
 * a role that may not count, for an activity that does not take place
 * that day or has not started at the moment of the save, for a form that
 * was opened on another state of the count than the one kept now, for a
 * draft of a count already announced, for a form that marks someone
 * who does not take part, and for one that marks Tidak hadir someone
 * whose approved leave covers the activity. A change of the account's own
 * mark is left out and said, and the other rows are saved. Two saves of
 * one activity at once are taken one after the other, and the database
 * keeps one count for it on a day.
 * "Umumkan ulang" closes the waiting clarification of each resident it
 * no longer marks Tidak hadir, with the note that the absence was
 * withdrawn.
 */
export async function saveCount(
  db: Database,
  actor: Counter,
  input: CountInput,
  moment: Date = new Date(),
): Promise<Parsed<SavedCount>> {
  if (!may(actor.roles, "count_dorm_attendance")) return COUNT_NOT_ALLOWED;
  try {
    return await db.transaction((tx) => saveIn(tx, actor, input, moment));
  } catch (error) {
    if (brokeUniqueRule(error, ONE_COUNT_RULE)) return COUNT_CHANGED;
    throw error;
  }
}
