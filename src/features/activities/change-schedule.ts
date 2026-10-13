import { and, eq, isNull, type SQL, sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { activitySchedules } from "@/db/schema";
import type { Parsed } from "@/parsed";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";
import {
  parseSchedule,
  type ScheduleInput,
  type SentSchedule,
} from "./schedule-input";
import { placeOf, type SavedSchedule } from "./schedule-place";
import { momentOf } from "./schedule-version";

export const SCHEDULE_NOT_FOUND = {
  ok: false,
  error: "Jadwal tidak ditemukan.",
} as const;

/** What a change answers when the schedule was changed after its form opened. */
export const SCHEDULE_CHANGED_BY_OTHER = {
  ok: false,
  error:
    "Jadwal ini baru saja diubah orang lain, jadi perubahan Anda tidak disimpan. Tabel di bawah sudah menampilkan versi terbaru. Tekan Batal, lalu Ubah lagi bila masih perlu.",
} as const;

/** Matches the schedule with that id when it is not removed. */
export function keptSchedule(id: string): SQL | undefined {
  return and(eq(activitySchedules.id, id), isNull(activitySchedules.deletedAt));
}

/**
 * The moment of a change: now, or one millisecond after the change
 * before it when that one was made within the same millisecond. A version
 * is told by this moment, so no two saved states may share it.
 */
function nextChangedAt(): SQL<Date> {
  const now = new Date().toISOString();
  return sql<Date>`greatest(${now}::timestamptz, ${activitySchedules.changedAt} + interval '1 millisecond')`;
}

interface Opened {
  id: string;
  /** The moment of the version the form was opened with. */
  at: Date;
}

/**
 * Changes the schedule when it is still as the form was opened with. Two
 * changes of one version never both go in: the second waits for the
 * first, then finds the version gone.
 */
async function changeOpened(
  db: Database,
  actorId: string,
  opened: Opened,
  parts: ScheduleInput & { academicPeriodId: string },
): Promise<boolean> {
  const changed = await db
    .update(activitySchedules)
    .set({ ...parts, changedAt: nextChangedAt(), changedBy: actorId })
    .where(
      and(keptSchedule(opened.id), eq(activitySchedules.changedAt, opened.at)),
    )
    .returning({ id: activitySchedules.id });
  return changed.length > 0;
}

interface KeptParts {
  activityId: string;
  changedAt: Date;
}

async function readKept(db: Database, id: string): Promise<KeptParts | null> {
  const [kept] = await db
    .select({
      activityId: activitySchedules.activityId,
      changedAt: activitySchedules.changedAt,
    })
    .from(activitySchedules)
    .where(keptSchedule(id));
  return kept ?? null;
}

/** Why a change did not go in: the schedule is gone, or it was changed. */
async function whyNotChanged(
  db: Database,
  id: string,
): Promise<typeof SCHEDULE_NOT_FOUND | typeof SCHEDULE_CHANGED_BY_OTHER> {
  const still = await readKept(db, id);
  return still === null ? SCHEDULE_NOT_FOUND : SCHEDULE_CHANGED_BY_OTHER;
}

/**
 * Changes a schedule that is not removed, with who changed it and when,
 * and gives it the academic period that runs on its first day as it is
 * now. `version` is the one the form was opened with: when the schedule
 * was changed since, by someone else or by the same form sent before, the
 * change is refused and nothing is overwritten. The activity the schedule
 * already holds may stay after it was removed from Kurikulum; any other
 * must be in the list. Gives back the activity that is scheduled.
 */
export async function changeSchedule(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  version: string,
  sent: SentSchedule,
): Promise<Parsed<SavedSchedule>> {
  if (!may(actor.roles, "manage_activities")) return SCHEDULES_NOT_ALLOWED;
  const parsed = parseSchedule(sent);
  if (!parsed.ok) return parsed;
  if (!isUuid(id)) return SCHEDULE_NOT_FOUND;

  const kept = await readKept(db, id);
  if (kept === null) return SCHEDULE_NOT_FOUND;
  const openedAt = momentOf(version);
  const isAsOpened = openedAt?.getTime() === kept.changedAt.getTime();
  if (openedAt === null || !isAsOpened) return SCHEDULE_CHANGED_BY_OTHER;

  const place = await placeOf(db, parsed.value, kept.activityId);
  if (!place.ok) return place;
  const parts = {
    ...parsed.value,
    academicPeriodId: place.value.academicPeriodId,
  };
  const opened = { id, at: openedAt };
  if (await changeOpened(db, actor.id, opened, parts)) {
    return { ok: true, value: place.value.activity };
  }
  return whyNotChanged(db, id);
}
