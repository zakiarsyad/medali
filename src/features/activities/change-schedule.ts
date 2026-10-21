import { and, count, eq, isNull, type SQL, sql } from "drizzle-orm";
import { may } from "@/auth/access";
import type { Account } from "@/auth/accounts";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { momentOf } from "@/db/row-version";
import {
  activityAttendances,
  activitySchedules,
  ppksActivities,
} from "@/db/schema";
import type { Parsed } from "@/parsed";
import { OF_SCHEDULE } from "./list-schedules";
import { SCHEDULES_NOT_ALLOWED } from "./not-allowed";
import { replaceParticipants } from "./save-participants";
import type { SentSchedule } from "./schedule-input";
import {
  type MoveToConfirm,
  moveConfirmWords,
  mustConfirmMove,
} from "./schedule-move";
import {
  planSchedule,
  type ScheduleHome,
  type SchedulePlan,
} from "./schedule-place";
import type { SavedSchedule } from "./schedule-row";

/** What a change or a removal answers when the schedule is not there. */
export const SCHEDULE_NOT_FOUND = {
  ok: false,
  error:
    "Jadwal ini sudah tidak ada, mungkin baru saja dihapus orang lain. Tekan Batal; tabel di bawah sudah menampilkan daftar terbaru.",
} as const;

/** What a change answers when the schedule was changed after its form opened. */
export const SCHEDULE_CHANGED_BY_OTHER = {
  ok: false,
  error:
    "Jadwal ini baru saja diubah orang lain, jadi perubahan Anda tidak disimpan. Tabel di bawah sudah menampilkan versi terbaru. Tekan Batal, lalu Ubah lagi bila masih perlu.",
} as const;

/**
 * Whether a refusal means the list the form was opened from is out of
 * date: someone else changed or removed the schedule since. The list is
 * then read again, so the person sees what is there now.
 */
export function isOutdatedList(error: string): boolean {
  return (
    error === SCHEDULE_NOT_FOUND.error ||
    error === SCHEDULE_CHANGED_BY_OTHER.error
  );
}

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
  /** Whether a move of its dates asks first when it has attendances. */
  asksBeforeMove: boolean;
  /** The number of attendances the person agreed to, as the form sends it. */
  agreed: string;
}

type ChangeEnd =
  | { kind: "changed" }
  | { kind: "not-changed" }
  | { kind: "confirm"; attendances: number };

/**
 * The days of the schedule when it is still as the form was opened with,
 * held so that nobody else changes it until this change is saved.
 */
async function holdOpened(db: Database, opened: Opened) {
  const [held] = await db
    .select({
      startsOn: activitySchedules.startsOn,
      endsOn: activitySchedules.endsOn,
    })
    .from(activitySchedules)
    .where(
      and(keptSchedule(opened.id), eq(activitySchedules.changedAt, opened.at)),
    )
    .for("update");
  return held;
}

/** Every attendance kept for the schedule: photos and records made by hand, in any status. */
async function countAttendances(db: Database, id: string): Promise<number> {
  const [counted] = await db
    .select({ attendances: count() })
    .from(activityAttendances)
    .where(eq(activityAttendances.scheduleId, id));
  return counted?.attendances ?? 0;
}

/**
 * Changes the schedule, and whom it is for, when it is still as the form
 * was opened with. Two changes of one version never both go in: the
 * second waits for the first, then finds the version gone. A move of the
 * dates of a schedule with attendances is not saved until the person
 * agreed to the number of them there is now.
 */
async function changeOpened(
  db: Database,
  actorId: string,
  opened: Opened,
  plan: SchedulePlan,
): Promise<ChangeEnd> {
  const parts = { ...plan.input, academicPeriodId: plan.academicPeriodId };
  return db.transaction(async (tx) => {
    const held = await holdOpened(tx, opened);
    if (held === undefined) return { kind: "not-changed" };
    if (opened.asksBeforeMove) {
      const attendances = await countAttendances(tx, opened.id);
      if (mustConfirmMove(held, plan.input, attendances, opened.agreed)) {
        return { kind: "confirm", attendances };
      }
    }
    await tx
      .update(activitySchedules)
      .set({ ...parts, changedAt: nextChangedAt(), changedBy: actorId })
      .where(eq(activitySchedules.id, opened.id));
    await replaceParticipants(tx, opened.id, plan.choice);
    return { kind: "changed" };
  });
}

interface KeptParts {
  activityId: string;
  changedAt: Date;
  /** Null for a special or additional activity. */
  semester: number | null;
}

async function readKept(db: Database, id: string): Promise<KeptParts | null> {
  const [kept] = await db
    .select({
      activityId: activitySchedules.activityId,
      changedAt: activitySchedules.changedAt,
      semester: ppksActivities.semester,
    })
    .from(activitySchedules)
    .innerJoin(ppksActivities, OF_SCHEDULE)
    .where(keptSchedule(id));
  return kept ?? null;
}

/** A schedule stays on its tab: a PPKS one never becomes an extra one. */
function homeOf(id: string, kept: KeptParts): ScheduleHome {
  const kind = kept.semester === null ? "extra" : "ppks";
  return { kind, keptScheduleId: id, keptActivityId: kept.activityId };
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
 * change is refused and nothing is overwritten. That is said before any
 * fault in the form itself: the person must first see the newest version.
 * A PPKS schedule with attendances whose dates move is saved only once
 * the person agreed to the number of attendances it has now, as
 * `sent.agreedAttendances` says; until then nothing is saved and they
 * are asked. The activity the schedule already holds may stay after it was removed
 * from Kurikulum; any other must be in the list. Whom a schedule of an
 * extra activity is for is replaced with what the form sends. Gives back
 * the activity that is scheduled and whom it is for.
 */
export async function changeSchedule(
  db: Database,
  actor: Pick<Account, "id" | "roles">,
  id: string,
  version: string,
  sent: SentSchedule,
): Promise<Parsed<SavedSchedule> | MoveToConfirm> {
  if (!may(actor.roles, "manage_activities")) return SCHEDULES_NOT_ALLOWED;
  if (!isUuid(id)) return SCHEDULE_NOT_FOUND;

  const kept = await readKept(db, id);
  if (kept === null) return SCHEDULE_NOT_FOUND;
  const openedAt = momentOf(version);
  const isAsOpened = openedAt?.getTime() === kept.changedAt.getTime();
  if (openedAt === null || !isAsOpened) return SCHEDULE_CHANGED_BY_OTHER;

  const home = homeOf(id, kept);
  const plan = await planSchedule(db, sent, home);
  if (!plan.ok) return plan;
  const opened = {
    id,
    at: openedAt,
    asksBeforeMove: home.kind === "ppks",
    agreed: sent.agreedAttendances,
  };
  const end = await changeOpened(db, actor.id, opened, plan.value);
  if (end.kind === "changed") return { ok: true, value: plan.value.saved };
  if (end.kind === "confirm") {
    const { attendances } = end;
    return { ok: false, error: moveConfirmWords(attendances), attendances };
  }
  return whyNotChanged(db, id);
}
