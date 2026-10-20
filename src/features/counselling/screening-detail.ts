import { and, desc, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  mentalHealthScreeningLog,
  mentalHealthScreenings,
  students,
} from "@/db/schema";
import { screeningReachOf } from "./screening-reach";
import { scoresOf, screeningResult } from "./screening-rules";
import type { ScreeningDetailItem } from "./screening-view";

type KeptRow = typeof mentalHealthScreenings.$inferSelect;

function itemOf(kept: KeptRow): ScreeningDetailItem {
  const scores = scoresOf(kept);
  if (scores === null) throw new Error("A kept screening lacks a score.");
  const result = screeningResult(scores);
  return {
    id: kept.id,
    screenedOn: kept.screenedOn,
    instrument: kept.instrument,
    level: kept.level,
    scales: result.scales,
    srqYes: kept.srqYes,
    advice: result.advice,
    risk: result.risk,
    note: kept.note,
  };
}

/**
 * "Rincian" of a screened student: every screening, the newest first,
 * with its scores, advice and note. Each opening goes into the log, with
 * who and when and nothing of the screenings. Null, with nothing read or
 * logged, for an account without the right to read screenings and for a
 * student it may not read or with no screening.
 */
export async function openScreeningDetail(
  db: Database,
  actor: AccountForAccess,
  studentId: unknown,
  now: Date = new Date(),
): Promise<ScreeningDetailItem[] | null> {
  const reach = screeningReachOf(actor);
  if (reach === null) return null;
  if (typeof studentId !== "string" || !isUuid(studentId)) return null;
  return db.transaction(async (tx) => {
    const kept = await tx
      .select({ screening: mentalHealthScreenings })
      .from(mentalHealthScreenings)
      .innerJoin(students, eq(students.id, mentalHealthScreenings.studentId))
      .where(and(eq(mentalHealthScreenings.studentId, studentId), reach))
      .orderBy(
        desc(mentalHealthScreenings.screenedOn),
        desc(mentalHealthScreenings.savedAt),
      );
    if (kept.length === 0) return null;
    await tx
      .insert(mentalHealthScreeningLog)
      .values({ studentId, event: "opened", by: actor.id, at: now });
    return kept.map((row) => itemOf(row.screening));
  });
}
