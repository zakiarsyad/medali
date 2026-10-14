import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { momentOf } from "@/db/row-version";
import { dormActivityVersions } from "@/db/schema";
import type { Parsed } from "@/parsed";
import {
  type ActivityInput,
  parseActivity,
  type SentActivity,
} from "./activity-input";
import {
  ACTIVITIES_NOT_ALLOWED,
  ACTIVITY_CHANGED_BY_OTHER,
  ACTIVITY_NOT_FOUND,
  KIND_KEPT,
  ONE_OFF_BEFORE_TODAY,
  ONE_OFF_IS_PAST,
} from "./activity-messages";
import { isRoutine } from "./activity-row";
import {
  lockActivity,
  markChanged,
  putDaysOff,
  readCurrentVersion,
  readDaysOff,
  type StoredVersion,
  versionParts,
} from "./activity-store";
import { daysOffToKeep } from "./days-off-kept";

/** Why a checked change may not go in, or null when it may. */
function wrongForNow(
  current: StoredVersion,
  input: ActivityInput,
  today: string,
): Parsed<never> | null {
  if (isRoutine(current) !== isRoutine(input)) return KIND_KEPT;
  if (isRoutine(current)) return null;
  if (current.startsOn < today) return ONE_OFF_IS_PAST;
  if (input.startsOn < today) return ONE_OFF_BEFORE_TODAY;
  return null;
}

/**
 * Keeps the change for today and the days after it. A repeating activity
 * whose version began before today ends that version yesterday and starts
 * a new one today, so the days gone by keep what they showed. A version
 * that began today, and a one-off activity, which lies today or later,
 * are changed as they are.
 */
async function writeVersion(
  tx: Database,
  current: StoredVersion,
  input: ActivityInput,
  today: string,
): Promise<void> {
  const parts = versionParts(input);
  const isSplit =
    isRoutine(current) &&
    (current.shownFrom === null || current.shownFrom < today);
  if (!isSplit) {
    await tx
      .update(dormActivityVersions)
      .set(parts)
      .where(eq(dormActivityVersions.id, current.id));
    return;
  }
  await tx
    .update(dormActivityVersions)
    .set({ shownUntil: daysAfter(today, -1) })
    .where(eq(dormActivityVersions.id, current.id));
  await tx
    .insert(dormActivityVersions)
    .values({ ...parts, activityId: current.activityId, shownFrom: today });
}

interface Change {
  actorId: string;
  id: string;
  /** The moment of the version the form was opened with. */
  openedAt: Date | null;
  sent: SentActivity;
  today: string;
}

async function save(
  tx: Database,
  change: Change,
): Promise<Parsed<ActivityInput>> {
  const kept = await lockActivity(tx, change.id);
  if (kept === null) return ACTIVITY_NOT_FOUND;
  const isAsOpened = change.openedAt?.getTime() === kept.changedAt.getTime();
  if (!isAsOpened) return ACTIVITY_CHANGED_BY_OTHER;
  const current = await readCurrentVersion(tx, change.id);
  if (current === null) return ACTIVITY_NOT_FOUND;

  const parsed = parseActivity(change.sent);
  if (!parsed.ok) return parsed;
  const wrong = wrongForNow(current, parsed.value, change.today);
  if (wrong) return wrong;
  const stored = await readDaysOff(tx, change.id);
  const daysOff = daysOffToKeep(stored, parsed.value.daysOff, change.today);
  if (!daysOff.ok) return daysOff;
  await writeVersion(tx, current, parsed.value, change.today);
  await putDaysOff(tx, change.id, daysOff.value);
  await markChanged(tx, change.id, change.actorId);
  return { ok: true, value: { ...parsed.value, daysOff: daysOff.value } };
}

/**
 * Changes a dorm activity that is not removed, with who changed it and
 * when, for today and the days after it: the days gone by keep what they
 * showed, their days off among it. `version` is the one the form was opened with: when the
 * activity was changed since, by someone else or by the same form sent
 * before, the change is refused and nothing is overwritten. That is said
 * before any fault in the form itself: the person must first see the
 * newest version. A repeating activity stays repeating, and a one-off
 * activity can be changed only while its day is today or later, and not
 * moved to a day gone by. `today` is the day on campus.
 */
export async function changeActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  version: string,
  sent: SentActivity,
  today = campusDay(),
): Promise<Parsed<ActivityInput>> {
  if (!may(actor.roles, "manage_dorm_activities")) {
    return ACTIVITIES_NOT_ALLOWED;
  }
  if (!isUuid(id)) return ACTIVITY_NOT_FOUND;
  const change = {
    actorId: actor.id,
    id,
    openedAt: momentOf(version),
    sent,
    today,
  };
  return db.transaction((tx) => save(tx, change));
}
