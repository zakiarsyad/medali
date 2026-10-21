import { and, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import { mentalHealthScreenings, students } from "@/db/schema";
import { latestScreenings } from "./latest-screenings";
import { screeningReachOf } from "./screening-reach";
import { ADVICE_WORDS, CRISIS_ADVICE } from "./screening-words";
import { openSharedLevel } from "./shared-detail";
import type { SharedScreening } from "./shared-view";

/** The latest screening as the panel shows it, with its "Rekomendasi". */
export interface ShownScreening extends SharedScreening {
  advice: string;
}

/**
 * "Kesehatan mental" of one student, for their detail: Konselor's own, or
 * what a sharing holds for its recipient. `screening` is null for a
 * student never screened.
 */
export interface StudentMental {
  kind: "counsellor" | "shared";
  screening: ShownScreening | null;
}

/**
 * Konselor's panel: the latest screening of a student within reach, its
 * advice as "Rincian" gives it, the crisis advice when self-harm was
 * ticked. The scores, the "Risiko" mark and the note stay in "Rincian".
 */
async function readCounsellorMental(
  db: Database,
  reach: NonNullable<ReturnType<typeof screeningReachOf>>,
  studentId: string,
): Promise<StudentMental | null> {
  const latest = latestScreenings(db, {
    selfHarm: mentalHealthScreenings.selfHarm,
  });
  const [found] = await db
    .select({
      level: latest.level,
      instrument: latest.instrument,
      screenedOn: latest.screenedOn,
      selfHarm: latest.selfHarm,
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(and(eq(students.id, studentId), reach));
  if (!found) return null;
  const { level, instrument, screenedOn, selfHarm } = found;
  if (level === null || instrument === null || screenedOn === null) {
    return { kind: "counsellor", screening: null };
  }
  const advice = selfHarm ? CRISIS_ADVICE : ADVICE_WORDS[level];
  return {
    kind: "counsellor",
    screening: { level, instrument, screenedOn, advice },
  };
}

/**
 * A recipient's panel: the shared level with the level's own advice,
 * never the crisis advice, which would give away the "Risiko" mark.
 */
async function readSharedMental(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  now: Date,
): Promise<StudentMental | null> {
  const shared = await openSharedLevel(db, actor, studentId, now);
  if (shared === null) return null;
  const { screening } = shared;
  if (screening === null) return { kind: "shared", screening: null };
  const advice = ADVICE_WORDS[screening.level];
  return { kind: "shared", screening: { ...screening, advice } };
}

/**
 * "Kesehatan mental" of one student. An account that records screenings
 * gets Konselor's panel, which holds all a recipient's would; any other
 * gets what a sharing holds for it. Null for an account that may neither,
 * for a student out of its reach and for one not shared with it: the
 * same answer whether or not the student was screened.
 */
export async function readStudentMental(
  db: Database,
  actor: AccountForAccess,
  studentId: string,
  now: Date = new Date(),
): Promise<StudentMental | null> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(studentId)) return null;
  const reach = screeningReachOf(actor);
  if (reach !== null) return readCounsellorMental(db, reach, studentId);
  return readSharedMental(db, actor, studentId, now);
}
