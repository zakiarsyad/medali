import { and, eq, type SQL } from "drizzle-orm";
import { campusDay } from "@/academic-periods/campus-day";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { studentSurveyPeriods } from "@/db/schema";
import { WRITTEN_NOW } from "@/db/written-now";
import { surveyRunsOn } from "@/mentoring/running-survey-period";
import type { Parsed } from "@/parsed";
import { NOT_ALLOWED_TO_MANAGE } from "./open-survey-period";
import { datesFault } from "./survey-input";
import { maySurveyBeManagedBy } from "./survey-rights";

/**
 * What a change answers for a period that runs no more, or for an id
 * that names none: only a period that is Terjadwal or Dibuka can be
 * changed, closed or cancelled.
 */
export const NOT_RUNNING = {
  ok: false,
  error:
    "Periode evaluasi ini sudah tidak berjalan: sudah ditutup, dibatalkan, atau berakhir. Muat ulang halaman, lalu periksa lagi.",
} as const;

const DONE = { ok: true, value: null } as const;

/**
 * The period with this id while it runs on a day. The database looks at
 * the moment it writes, so of two changes at once only the first finds it.
 */
function runningWith(id: string, today: string): SQL | undefined {
  return and(eq(studentSurveyPeriods.id, id), surveyRunsOn(today));
}

async function readFirstDay(
  db: Database,
  id: string,
  today: string,
): Promise<string | null> {
  const [running] = await db
    .select({ startsOn: studentSurveyPeriods.startsOn })
    .from(studentSurveyPeriods)
    .where(runningWith(id, today));
  return running?.startsOn ?? null;
}

/**
 * "Simpan tanggal": gives the running period another last day. Refused
 * for any role but Kepala Unit, for a period that runs no more, and for
 * a day before the first day of the period or one that has passed.
 */
export async function changeSurveyEnd(
  db: Database,
  actor: AccountForAccess,
  id: string,
  endsOn: string,
  today: string = campusDay(),
): Promise<Parsed<{ endsOn: string }>> {
  if (!maySurveyBeManagedBy(actor)) return NOT_ALLOWED_TO_MANAGE;
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return NOT_RUNNING;
  const startsOn = await readFirstDay(db, id, today);
  if (startsOn === null) return NOT_RUNNING;
  const fault = datesFault(startsOn, endsOn, today);
  if (fault !== null) return { ok: false, error: fault };
  const changed = await db
    .update(studentSurveyPeriods)
    .set({ endsOn })
    .where(runningWith(id, today))
    .returning({ endsOn: studentSurveyPeriods.endsOn });
  const [now] = changed;
  if (!now) return NOT_RUNNING;
  return { ok: true, value: now };
}

/**
 * "Tutup periode sekarang": the running period becomes Ditutup, as the
 * work of the actor, and students can answer no more. Its dates stay as
 * they were. Refused for any role but Kepala Unit and for a period that
 * runs no more.
 */
export async function closeSurveyPeriod(
  db: Database,
  actor: AccountForAccess,
  id: string,
  today: string = campusDay(),
): Promise<Parsed<null>> {
  if (!maySurveyBeManagedBy(actor)) return NOT_ALLOWED_TO_MANAGE;
  if (!isUuid(id)) return NOT_RUNNING;
  const closed = await db
    .update(studentSurveyPeriods)
    .set({ closedBy: actor.id, closedAt: WRITTEN_NOW })
    .where(runningWith(id, today))
    .returning({ id: studentSurveyPeriods.id });
  return closed.length > 0 ? DONE : NOT_RUNNING;
}

/**
 * "Batalkan periode": the running period is marked cancelled, as the
 * work of the actor. It is never erased. Refused for any role but Kepala
 * Unit and for a period that runs no more.
 */
export async function cancelSurveyPeriod(
  db: Database,
  actor: AccountForAccess,
  id: string,
  today: string = campusDay(),
): Promise<Parsed<null>> {
  if (!maySurveyBeManagedBy(actor)) return NOT_ALLOWED_TO_MANAGE;
  if (!isUuid(id)) return NOT_RUNNING;
  const cancelled = await db
    .update(studentSurveyPeriods)
    .set({ cancelledBy: actor.id, cancelledAt: WRITTEN_NOW })
    .where(runningWith(id, today))
    .returning({ id: studentSurveyPeriods.id });
  return cancelled.length > 0 ? DONE : NOT_RUNNING;
}
