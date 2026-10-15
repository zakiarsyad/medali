import { and, desc, eq, type SQL } from "drizzle-orm";
import type { Term } from "@/academic-periods/academic-period";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  characterAssessments,
  characterAssessmentUploads,
  students,
  studyPrograms,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import type { AssessmentSource } from "./assessment-ids";
import { scoresOf } from "./latest-assessments";

/** One assessment of a student, as the history shows it. */
export interface HistoryEntry {
  id: string;
  enteredAt: Date;
  period: { startYear: number; term: Term };
  source: AssessmentSource;
  /** The name of the file it was uploaded in, or null for the form. */
  fileName: string | null;
  /** The name of the account that entered it. */
  enteredBy: string;
  scores: Scores;
  /** Catatan penilai, or null for a role that may not read it. */
  note: string | null;
}

/** A student with every assessment, the newest first. */
export interface AssessmentHistory {
  id: string;
  name: string;
  nim: string;
  program: string;
  entries: HistoryEntry[];
}

/** Every assessment of a student, the newest first, without its note. */
async function readEntries(
  db: Database,
  studentId: string,
): Promise<HistoryEntry[]> {
  const rows = await db
    .select({
      id: characterAssessments.id,
      enteredAt: characterAssessments.enteredAt,
      startYear: academicPeriods.startYear,
      term: academicPeriods.term,
      source: characterAssessments.source,
      fileName: characterAssessmentUploads.fileName,
      enteredBy: accounts.name,
      scoreM: characterAssessments.scoreM,
      scoreE: characterAssessments.scoreE,
      scoreD: characterAssessments.scoreD,
      scoreA: characterAssessments.scoreA,
      scoreL: characterAssessments.scoreL,
      scoreI: characterAssessments.scoreI,
    })
    .from(characterAssessments)
    .innerJoin(
      academicPeriods,
      eq(academicPeriods.id, characterAssessments.periodId),
    )
    .innerJoin(accounts, eq(accounts.id, characterAssessments.enteredBy))
    .leftJoin(
      characterAssessmentUploads,
      eq(characterAssessmentUploads.id, characterAssessments.uploadId),
    )
    .where(eq(characterAssessments.studentId, studentId))
    .orderBy(
      desc(characterAssessments.enteredAt),
      desc(characterAssessments.id),
    );
  return rows.map((row) => ({
    id: row.id,
    enteredAt: row.enteredAt,
    period: { startYear: row.startYear, term: row.term },
    source: row.source,
    fileName: row.fileName,
    enteredBy: row.enteredBy,
    scores: scoresOf(row),
    note: null,
  }));
}

/** The note of each assessment of a student, by the assessment's key. */
async function readNotes(
  db: Database,
  studentId: string,
): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: characterAssessments.id, note: characterAssessments.note })
    .from(characterAssessments)
    .where(eq(characterAssessments.studentId, studentId));
  return new Map(rows.map((row) => [row.id, row.note]));
}

/**
 * The earlier assessments of one Aktif student the account sees, or null
 * for any other student: the server gives nothing of a student outside
 * what the account may see, whatever the address asks for. "Catatan
 * penilai" comes only with `withNotes`, for Kepala Unit and Penilai
 * Mahasiswa: for any other account it is never asked of the database,
 * so it cannot reach the browser.
 */
export async function readAssessmentHistory(
  db: Database,
  visible: SQL,
  studentId: string,
  withNotes: boolean,
): Promise<AssessmentHistory | null> {
  const [student] = await db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      program: studyPrograms.name,
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .where(and(eq(students.id, studentId), visible, ACTIVE_MEMBER));
  if (!student) return null;
  const entries = await readEntries(db, studentId);
  if (!withNotes) return { ...student, entries };
  const notes = await readNotes(db, studentId);
  const noted = entries.map((entry) => ({
    ...entry,
    note: notes.get(entry.id) ?? null,
  }));
  return { ...student, entries: noted };
}
