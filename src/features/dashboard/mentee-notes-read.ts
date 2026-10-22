import { count, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import { disciplinePenalties, students } from "@/db/schema";
import { MENTEE_NOTES_SHOWN } from "./mentee-notes";
import type { MenteeScope } from "./mentee-scope";
import { countRecentNotes, readLatestNotes } from "./mentoring-read";
import type { LatestNote } from "./mentoring-recap";

/** The discipline penalties of the anak asuh, whatever their status or date. */
async function countPenalties(db: Database, mentees: SQL): Promise<number> {
  const [found] = await db
    .select({ penalties: count() })
    .from(disciplinePenalties)
    .innerJoin(students, eq(students.id, disciplinePenalties.studentId))
    .where(mentees);
  return found?.penalties ?? 0;
}

/**
 * "Catatan pengasuhan terbaru" of Dashboard anak asuh: the latest notes
 * about the anak asuh, with how many of the last 30 days, and how many
 * discipline penalties they have.
 */
export async function readMenteeNotes(
  db: Database,
  scope: MenteeScope,
  today: string,
): Promise<{ notes: LatestNote[]; recentNotes: number; penalties: number }> {
  const asked = {
    where: scope.mentees,
    notes: scope.notes,
    detail: scope.detail,
  };
  const [notes, recentNotes, penalties] = await Promise.all([
    readLatestNotes(db, asked, MENTEE_NOTES_SHOWN),
    countRecentNotes(db, scope.mentees, scope.notes, today),
    countPenalties(db, scope.mentees),
  ]);
  return { notes, recentNotes, penalties };
}
