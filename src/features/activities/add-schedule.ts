import { eq } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { activitySchedules } from "@/db/schema";
import { hourAndMinute } from "@/db/stored-time";
import type { Parsed } from "@/parsed";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";
import {
  parseSchedule,
  type ScheduleInput,
  type SentSchedule,
} from "./schedule-input";
import { placeOf, type SavedSchedule } from "./schedule-place";

/**
 * What an add answers when its key is that of a schedule it did not just
 * add: the form was sent before and changed since, or the key is not its
 * own.
 */
export const SCHEDULE_ALREADY_SENT = {
  ok: false,
  error:
    "Formulir ini sudah pernah terkirim, jadi isian yang sekarang tidak disimpan. Muat ulang halaman, periksa daftar jadwal, lalu jadwalkan lagi bila masih perlu.",
} as const;

type StoredSchedule = typeof activitySchedules.$inferSelect;

/** Whether a stored schedule holds, part for part, what the form sends. */
function holdsSameParts(kept: StoredSchedule, input: ScheduleInput): boolean {
  const sameDays =
    kept.startsOn === input.startsOn && kept.endsOn === input.endsOn;
  const sameHours =
    hourAndMinute(kept.startTime) === input.startTime &&
    hourAndMinute(kept.endTime) === input.endTime;
  const sameUpload =
    kept.uploadCount === input.uploadCount &&
    kept.uploadUnit === input.uploadUnit;
  return (
    kept.activityId === input.activityId &&
    kept.location === input.location &&
    kept.isRequired === input.isRequired &&
    sameDays &&
    sameHours &&
    sameUpload
  );
}

/**
 * Whether the schedule kept under a key is the one this form added
 * before: last saved by the same account, not removed, with every part
 * the same. A form whose parts were changed after it was sent is not the
 * same form: taking it for one would drop the change while saying it was
 * saved.
 */
async function isSameForm(
  db: Database,
  actorId: string,
  id: string,
  input: ScheduleInput,
): Promise<boolean> {
  const [kept] = await db
    .select()
    .from(activitySchedules)
    .where(eq(activitySchedules.id, id));
  if (!kept || kept.deletedAt !== null) return false;
  return kept.changedBy === actorId && holdsSameParts(kept, input);
}

/**
 * Adds a schedule of a PPKS activity that is in the Kurikulum list, with
 * who added it and when, and with the academic period that runs on its
 * first day. `id` is the key its form made. A form sent twice, as by a
 * double press, is kept once: two adds of one key never both add it, as
 * the second waits for the first and then adds nothing, and its answer is
 * the same as the first. Gives back the activity that was scheduled.
 */
export async function addSchedule(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  sent: SentSchedule,
): Promise<Parsed<SavedSchedule>> {
  if (!may(actor.roles, "manage_activities")) return SCHEDULES_NOT_ALLOWED;
  const parsed = parseSchedule(sent);
  if (!parsed.ok) return parsed;
  const place = await placeOf(db, parsed.value, null);
  if (!place.ok) return place;
  if (!isUuid(id)) return SCHEDULE_ALREADY_SENT;

  const added = await db
    .insert(activitySchedules)
    .values({
      ...parsed.value,
      id,
      academicPeriodId: place.value.academicPeriodId,
      changedAt: new Date(),
      changedBy: actor.id,
    })
    .onConflictDoNothing({ target: activitySchedules.id })
    .returning({ id: activitySchedules.id });
  const saved = { ok: true, value: place.value.activity } as const;
  if (added.length > 0) return saved;
  if (await isSameForm(db, actor.id, id, parsed.value)) return saved;
  return SCHEDULE_ALREADY_SENT;
}
