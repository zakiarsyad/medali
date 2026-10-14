import { isDeepStrictEqual } from "node:util";
import { eq } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { dormActivities, dormActivityVersions } from "@/db/schema";
import type { Parsed } from "@/parsed";
import {
  type ActivityInput,
  parseActivity,
  type SentActivity,
} from "./activity-input";
import {
  ACTIVITIES_NOT_ALLOWED,
  ACTIVITY_ALREADY_SENT,
} from "./activity-messages";
import {
  inputOf,
  putDaysOff,
  readCurrentVersion,
  readDaysOff,
  versionParts,
} from "./activity-store";
import { daysOffToKeep } from "./days-off-kept";

/**
 * Whether the activity kept under a key is the one this form added
 * before: last saved by the same account, not removed, with every part
 * the same. A form whose parts were changed after it was sent is not the
 * same form: taking it for one would drop the change while saying it was
 * saved.
 */
async function isSameForm(
  tx: Database,
  actorId: string,
  id: string,
  input: ActivityInput,
): Promise<boolean> {
  const [kept] = await tx
    .select()
    .from(dormActivities)
    .where(eq(dormActivities.id, id));
  if (!kept || kept.deletedAt !== null || kept.changedBy !== actorId) {
    return false;
  }
  const version = await readCurrentVersion(tx, kept.id);
  if (version === null) return false;
  const stored = inputOf(version, await readDaysOff(tx, kept.id));
  return isDeepStrictEqual(stored, input);
}

async function save(
  tx: Database,
  actorId: string,
  id: string,
  input: ActivityInput,
): Promise<Parsed<ActivityInput>> {
  const added = await tx
    .insert(dormActivities)
    .values({ id, changedAt: new Date(), changedBy: actorId })
    .onConflictDoNothing({ target: dormActivities.id })
    .returning({ id: dormActivities.id });
  const saved = { ok: true, value: input } as const;
  if (added.length === 0) {
    if (await isSameForm(tx, actorId, id, input)) return saved;
    return ACTIVITY_ALREADY_SENT;
  }
  await tx
    .insert(dormActivityVersions)
    .values({ ...versionParts(input), activityId: id });
  await putDaysOff(tx, id, input.daysOff);
  return saved;
}

/**
 * Adds a dorm activity, repeating or one-off, with who added it and when.
 * It takes place on every day its pattern gives, past days among them.
 * `id` is the key its form made. A form sent twice, as by a double press,
 * is kept once: two adds of one key never both add it, as the second
 * waits for the first and then adds nothing, and its answer is the same
 * as the first. At most 100 of its days off may be today or later.
 * `today` is the day on campus. Gives back the activity that was saved.
 */
export async function addActivity(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  sent: SentActivity,
  today = campusDay(),
): Promise<Parsed<ActivityInput>> {
  if (!may(actor.roles, "manage_dorm_activities")) {
    return ACTIVITIES_NOT_ALLOWED;
  }
  const parsed = parseActivity(sent);
  if (!parsed.ok) return parsed;
  const daysOff = daysOffToKeep([], parsed.value.daysOff, today);
  if (!daysOff.ok) return daysOff;
  if (!isUuid(id)) return ACTIVITY_ALREADY_SENT;
  return db.transaction((tx) => save(tx, actor.id, id, parsed.value));
}
