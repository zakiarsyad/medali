import { campusTime } from "@/academic-periods/campus-clock";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { brokeUniqueRule } from "@/db/unique-violation";
import type { Parsed } from "@/parsed";
import { closeWithdrawn } from "./clarification-store";
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
import { lockActivity, readStoredCount, writeCount } from "./count-store";
import { hasStarted, NOT_COUNTED_YET, type Participant } from "./count-view";
import { readActivityOn } from "./daily-activities";
import { type ApprovedLeave, type HeldTimes, leaveMarkOf } from "./leave-marks";
import { readApprovedLeaves, spanOfHeld } from "./leave-store";

/** What a save tells the one who saved. */
export interface SavedCount {
  /** Which save of the count is kept now, for the form to send next. */
  version: number;
  isAnnounced: boolean;
}

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

async function saveIn(
  tx: Database,
  actorId: string,
  input: CountInput,
  moment: Date,
): Promise<Parsed<SavedCount>> {
  if (!(await lockActivity(tx, input.activityId))) return NOT_HELD_THAT_DAY;
  const held = await readActivityOn(tx, input.activityId, input.day);
  if (held === null) return NOT_HELD_THAT_DAY;
  const now = { day: campusDay(moment), time: campusTime(moment) };
  if (!hasStarted({ ...held, day: input.day }, now)) return NOT_STARTED;
  const kept = await readStoredCount(tx, input.activityId, input.day);
  if ((kept?.version ?? NOT_COUNTED_YET) !== input.version) {
    return COUNT_CHANGED;
  }
  const wasAnnounced = kept !== null && kept.announcedAt !== null;
  if (wasAnnounced && !input.isAnnouncement) return ANNOUNCED_ALREADY;
  const participants = await readParticipants(tx, held.audience, input.day);
  if (!marksOnly(input, participants)) return NOT_A_PARTICIPANT;
  const times = { ...held, day: input.day };
  const leaves = await readApprovedLeaves(tx, spanOfHeld(times));
  if (marksAbsentOnLeave(input, leaves, times)) return ON_LEAVE;

  const version = await writeCount(tx, actorId, input, participants, kept);
  // Only a count announced before can have clarifications.
  if (input.isAnnouncement && wasAnnounced) {
    await closeWithdrawn(tx, kept.id, absentIn(input), actorId);
  }
  const isAnnounced = wasAnnounced || input.isAnnouncement;
  return { ok: true, value: { version, isAnnounced } };
}

/**
 * "Simpan" and "Umumkan ketidakhadiran": keeps the count of an activity
 * on a day as the work of the actor, as a draft or announced. Refused for
 * a role that may not count, for an activity that does not take place
 * that day or has not started at the moment of the save, for a form that
 * was opened on another state of the count than the one kept now, for a
 * draft of a count already announced, for a form that marks someone
 * who does not take part, and for one that marks Tidak hadir someone
 * whose approved leave covers the activity. Two saves of one activity at once are taken one
 * after the other, and the database keeps one count for it on a day.
 * "Umumkan ulang" closes the waiting clarification of each resident it
 * no longer marks Tidak hadir, with the note that the absence was
 * withdrawn.
 */
export async function saveCount(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  input: CountInput,
  moment: Date = new Date(),
): Promise<Parsed<SavedCount>> {
  if (!may(actor.roles, "count_dorm_attendance")) return COUNT_NOT_ALLOWED;
  try {
    return await db.transaction((tx) => saveIn(tx, actor.id, input, moment));
  } catch (error) {
    if (brokeUniqueRule(error, ONE_COUNT_RULE)) return COUNT_CHANGED;
    throw error;
  }
}
