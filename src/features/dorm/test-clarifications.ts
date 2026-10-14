import { asc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormAttendanceCounts,
  dormAttendanceMarks,
  dormClarificationChanges,
  dormClarifications,
} from "@/db/schema";
import type { CountMarks } from "./count-ids";

/** Made-up counts and clarifications of dorm absences, for the checks of this area. */

/** When a test clarification was sent, unless told otherwise. */
export const TEST_SENT_AT = new Date("2026-10-13T03:00:00Z");

/** When a test clarification was checked or decided, unless told otherwise. */
export const TEST_DECIDED_AT = new Date("2026-10-13T05:00:00Z");

/**
 * A count of an activity on a day, by `byId`, holding `marks`: announced
 * unless told otherwise. Gives back its key.
 */
export async function addTestCount(
  db: Database,
  count: {
    activityId: string;
    day: string;
    byId: string;
    marks: CountMarks;
    isAnnounced?: boolean;
  },
): Promise<string> {
  const savedAt = new Date(`${count.day}T23:00:00+07:00`);
  const announcement =
    count.isAnnounced === false
      ? {}
      : { announcedBy: count.byId, announcedAt: savedAt };
  const [added] = await db
    .insert(dormAttendanceCounts)
    .values({
      activityId: count.activityId,
      day: count.day,
      savedBy: count.byId,
      savedAt,
      ...announcement,
    })
    .returning({ id: dormAttendanceCounts.id });
  if (!added) throw new Error("The count was not added.");
  const rows = Object.entries(count.marks).map(([studentId, mark]) => ({
    countId: added.id,
    studentId,
    ...mark,
  }));
  if (rows.length > 0) await db.insert(dormAttendanceMarks).values(rows);
  return added.id;
}

type ClarificationRow = typeof dormClarifications.$inferInsert;

type TestClarification = Pick<ClarificationRow, "countId" | "studentId"> &
  Partial<ClarificationRow>;

/** The checks and decisions a status needs, all by `byId`. */
function decisionsFor(
  status: ClarificationRow["status"],
  byId: string,
): Partial<ClarificationRow> {
  const verified = { verifiedBy: byId, verifiedAt: TEST_DECIDED_AT };
  const decided = { decidedBy: byId, decidedAt: TEST_DECIDED_AT };
  if (status === "verified") return verified;
  if (status === "accepted") {
    return { ...verified, ...decided, acceptedAs: "present" };
  }
  if (status === "rejected") return { ...verified, verifyNote: "Ditolak uji" };
  if (status === "closed") return decided;
  return {};
}

/**
 * A clarification with a made-up file that is not kept, waiting for BAM
 * unless told otherwise; one of another status is checked and decided by
 * `byId`, as that status needs. Gives back its key.
 */
export async function addTestClarification(
  db: Database,
  byId: string,
  clarification: TestClarification,
): Promise<string> {
  const status = clarification.status ?? "submitted";
  const [added] = await db
    .insert(dormClarifications)
    .values({
      reason: "sick",
      explanation: "Demam dan beristirahat di kamar.",
      fileName: "surat-keterangan.pdf",
      fileContentType: "application/pdf",
      fileSize: 1024,
      sentAt: TEST_SENT_AT,
      ...decisionsFor(status, byId),
      ...clarification,
      status,
    })
    .returning({ id: dormClarifications.id });
  if (!added) throw new Error("The clarification was not added.");
  return added.id;
}

/** A clarification as kept, or undefined when there is none. */
export async function clarificationById(db: Database, id: string) {
  const [kept] = await db
    .select()
    .from(dormClarifications)
    .where(eq(dormClarifications.id, id));
  return kept;
}

/** The clarifications of a student as kept, the earliest sent first. */
export function clarificationsOf(db: Database, studentId: string) {
  return db
    .select()
    .from(dormClarifications)
    .where(eq(dormClarifications.studentId, studentId))
    .orderBy(asc(dormClarifications.sentAt));
}

/** The log lines of a clarification, the earliest first. */
export function changesOf(db: Database, clarificationId: string) {
  return db
    .select()
    .from(dormClarificationChanges)
    .where(eq(dormClarificationChanges.clarificationId, clarificationId))
    .orderBy(asc(dormClarificationChanges.changedAt));
}
