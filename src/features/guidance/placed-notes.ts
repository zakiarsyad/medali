import { and, eq, isNull, type SQL, sql } from "drizzle-orm";
import type { AcademicPeriod } from "@/academic-periods/academic-period";
import type { Database } from "@/db/connect";
import { academicPeriods, violationNotes } from "@/db/schema";
import { categoryAt } from "./note-category";
import type { NoteCategory } from "./violation-note-ids";

/**
 * The first day of the semester a note's Tanggal falls in, as "Academic
 * period" gives it: the one that started last by that day.
 */
const PERIOD_START = sql<string>`(select max(${academicPeriods.startsOn}) from ${academicPeriods} where ${academicPeriods.startsOn} <= ${violationNotes.day})`;

const SAME_STUDENT_AND_SEMESTER = sql`partition by ${violationNotes.studentId}, ${PERIOD_START}`;

/**
 * Every note not removed, with the first day of its semester, its place
 * among its student's notes of that semester, the earliest first, and
 * how many those are. A removed note is left out, so the Kategori of the
 * others is worked out from the notes that remain.
 */
export function placedNotes(db: Database) {
  return db
    .select({
      id: violationNotes.id,
      studentId: violationNotes.studentId,
      day: violationNotes.day,
      description: violationNotes.description,
      punishment: violationNotes.punishment,
      otherPunishment: violationNotes.otherPunishment,
      remark: violationNotes.remark,
      savedBy: violationNotes.savedBy,
      savedAt: violationNotes.savedAt,
      periodStart: PERIOD_START.as("period_start"),
      place:
        sql<number>`row_number() over (${SAME_STUDENT_AND_SEMESTER} order by ${violationNotes.day}, ${violationNotes.savedAt}, ${violationNotes.id})`.as(
          "place",
        ),
      inSemester: sql<number>`count(*) over (${SAME_STUDENT_AND_SEMESTER})`.as(
        "in_semester",
      ),
    })
    .from(violationNotes)
    .where(isNull(violationNotes.removedAt))
    .as("placed");
}

export type Placed = ReturnType<typeof placedNotes>;

/** The notes of the running semester; none while no period has begun. */
export function activeIn(placed: Placed, period: AcademicPeriod | null): SQL {
  if (period === null) return sql`false`;
  return sql`${placed.periodStart} = ${period.startsOn}`;
}

/**
 * The Kategori of a note not removed, worked out from the notes of its
 * student that are not removed; null for a note removed or not there.
 */
export async function readNoteCategory(
  db: Database,
  noteId: string,
): Promise<NoteCategory | null> {
  const placed = placedNotes(db);
  const [found] = await db
    .select({ place: sql<number>`${placed.place}`.mapWith(Number) })
    .from(placed)
    .where(eq(placed.id, noteId));
  return found ? categoryAt(found.place) : null;
}

/** A note as the box of the student picked shows it. */
export interface ActiveNote {
  day: string;
  description: string;
}

/**
 * The notes of a student in the running semester that are not removed,
 * the earliest first; none while no period has begun.
 */
export async function readActiveNotesOf(
  db: Database,
  studentId: string,
  period: AcademicPeriod | null,
): Promise<ActiveNote[]> {
  const placed = placedNotes(db);
  return db
    .select({ day: placed.day, description: placed.description })
    .from(placed)
    .where(and(eq(placed.studentId, studentId), activeIn(placed, period)))
    .orderBy(placed.place);
}
