import { eq } from "drizzle-orm";
import { readRunningPeriod } from "@/academic-periods/stored-periods";
import type { Database } from "@/db/connect";
import { ppksActivities } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { type ParticipantChoice, shownChoiceOf } from "./chosen-participants";
import { checkParticipants } from "./save-participants";
import {
  NO_ACTIVITY,
  parseSchedule,
  type ScheduleInput,
  type SentSchedule,
} from "./schedule-input";
import type { ScheduleKind } from "./schedule-list-address";
import type { SavedSchedule } from "./schedule-row";

/** What is said for a first day on which no academic period runs yet. */
export const BEFORE_FIRST_PERIOD = {
  ok: false,
  error:
    "Tanggal mulai lebih awal dari periode akademik pertama, jadi belum ada periode yang berjalan pada tanggal itu. Pilih tanggal mulai yang lebih baru.",
} as const;

/** A checked schedule with all it is kept with. */
export interface SchedulePlan {
  input: ScheduleInput;
  academicPeriodId: string;
  /** Whom an extra activity is for, or null for a PPKS one. */
  choice: ParticipantChoice | null;
  saved: SavedSchedule;
}

interface ScheduledActivity {
  name: string;
  /** Null for a special or additional activity. */
  semester: number | null;
}

/**
 * Where a schedule is saved: the tab of its kind, and when it is changed
 * the activity it already holds.
 */
export interface ScheduleHome {
  kind: ScheduleKind;
  /** Null for a new schedule. */
  keptActivityId: string | null;
}

/**
 * The activity a schedule names, when it may be scheduled there: one of
 * the tab's kind that is still in the Kurikulum list. The activity the
 * schedule already holds when it is changed stays allowed after it was
 * removed from the list.
 */
async function activityOf(
  db: Database,
  activityId: string,
  home: ScheduleHome,
): Promise<ScheduledActivity | null> {
  const [activity] = await db
    .select({
      name: ppksActivities.name,
      semester: ppksActivities.semester,
      deletedAt: ppksActivities.deletedAt,
    })
    .from(ppksActivities)
    .where(eq(ppksActivities.id, activityId));
  if (!activity) return null;
  const kind = activity.semester === null ? "extra" : "ppks";
  if (kind !== home.kind) return null;
  const isInList = activity.deletedAt === null;
  if (!isInList && activityId !== home.keptActivityId) return null;
  return { name: activity.name, semester: activity.semester };
}

/**
 * Checks a schedule as sent and finds where it belongs: its activity, the
 * academic period that runs on its first day, and for an extra activity
 * whom it is for. The period is the one the first day falls in, or the
 * one that ended last before it; a day before the first stored period
 * has none and is refused. A PPKS activity takes no Peserta: what the
 * form sends for it is not read.
 */
export async function planSchedule(
  db: Database,
  sent: SentSchedule,
  home: ScheduleHome,
): Promise<Parsed<SchedulePlan>> {
  const parsed = parseSchedule(sent);
  if (!parsed.ok) return parsed;
  const input = parsed.value;
  const activity = await activityOf(db, input.activityId, home);
  if (activity === null) return NO_ACTIVITY;
  const period = await readRunningPeriod(db, input.startsOn);
  if (period === null) return BEFORE_FIRST_PERIOD;
  const { name, semester } = activity;
  const placed = { input, academicPeriodId: period.id };
  if (semester !== null) {
    const target = { kind: "semester", semester } as const;
    return {
      ok: true,
      value: { ...placed, choice: null, saved: { name, target } },
    };
  }
  const choice = await checkParticipants(db, sent.participants);
  if (!choice.ok) return choice;
  const target = {
    kind: "chosen",
    choice: shownChoiceOf(choice.value),
  } as const;
  return {
    ok: true,
    value: { ...placed, choice: choice.value, saved: { name, target } },
  };
}
