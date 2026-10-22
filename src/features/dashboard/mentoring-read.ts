import {
  and,
  count,
  countDistinct,
  eq,
  gt,
  isNull,
  type SQL,
  sql,
} from "drizzle-orm";
import { daysBefore } from "@/academic-periods/days-before";
import {
  coachingLevelSql,
  listedForCoaching,
} from "@/character-scores/coaching-listed";
import { NOT_DONE } from "@/character-scores/coaching-shown-status";
import { latestAssessments } from "@/character-scores/latest-assessments";
import type { Database } from "@/db/connect";
import {
  accounts,
  coachingStatuses,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  mentoringNotes,
  students,
  studyPrograms,
} from "@/db/schema";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import { LISTED_NOTE, NEWEST_FIRST } from "@/mentoring/listed-note";
import { opensDetailOf } from "@/mentoring/opens-detail";
import {
  LATEST_NOTES_SHOWN,
  type LatestNote,
  type MentoringNumbers,
  type MentoringView,
  type ProgramAverage,
} from "./mentoring-recap";
import { programAverages } from "./program-averages";

/** "Catatan 30 hari terakhir" looks this many days back, today included. */
export const RECENT_NOTE_DAYS = 30;

/** Which students Pendampingan counts, and on which day. */
export interface MentoringAsked {
  /** The students of the Dashboard, the filters applied. */
  where: SQL;
  /** The same without any filter, or null while no filter is in use. */
  everyone: SQL | null;
  /** The students whose notes the account may read, or null for none. */
  notes: SQL | null;
  /** Whether the average of each program studi is read: not for Ketua Program Studi. */
  byProgram: boolean;
  /** The students whose detail the account may open, or null for none. */
  detail: SQL | null;
  today: string;
}

async function countEveryone(
  db: Database,
  everyone: SQL | null,
): Promise<number | null> {
  if (everyone === null) return null;
  const [found] = await db
    .select({ students: count() })
    .from(students)
    .where(everyone);
  return found?.students ?? 0;
}

/** Today's mentors and the groups in force that hold the students. */
async function countGroups(db: Database, where: SQL) {
  const [found] = await db
    .select({
      mentors: countDistinct(mentorGroupMentors.mentorId),
      groups: countDistinct(mentorGroups.id),
    })
    .from(students)
    .innerJoin(
      mentorGroupMembers,
      eq(mentorGroupMembers.studentId, students.id),
    )
    .innerJoin(
      mentorGroups,
      and(eq(mentorGroups.id, mentorGroupMembers.groupId), NOT_ENDED),
    )
    .leftJoin(
      mentorGroupMentors,
      and(
        eq(mentorGroupMentors.groupId, mentorGroups.id),
        isNull(mentorGroupMentors.endsOn),
      ),
    )
    .where(where);
  return { mentors: found?.mentors ?? 0, groups: found?.groups ?? 0 };
}

/** The notes of the last 30 days about the students `where` lets through whose notes the account may read. */
export async function countRecentNotes(
  db: Database,
  where: SQL,
  notes: SQL | null,
  today: string,
): Promise<number> {
  if (notes === null) return 0;
  const [found] = await db
    .select({ notes: count() })
    .from(mentoringNotes)
    .innerJoin(students, eq(students.id, mentoringNotes.studentId))
    .where(
      and(
        where,
        notes,
        gt(mentoringNotes.happenedOn, daysBefore(today, RECENT_NOTE_DAYS)),
      ),
    );
  return found?.notes ?? 0;
}

/** The students on the coaching list not yet Selesai, and of them the Intensif ones. */
async function countCoaching(db: Database, where: SQL) {
  const latest = latestAssessments(db);
  const [found] = await db
    .select({
      open: count(),
      intensive: sql<number>`(count(*) filter (where ${coachingLevelSql(latest)} = 'intensive'))::int`,
    })
    .from(students)
    .innerJoin(latest, eq(latest.studentId, students.id))
    .leftJoin(coachingStatuses, eq(coachingStatuses.studentId, students.id))
    .where(and(where, listedForCoaching(latest), NOT_DONE));
  return { open: found?.open ?? 0, intensive: found?.intensive ?? 0 };
}

async function readNumbers(
  db: Database,
  asked: MentoringAsked,
): Promise<MentoringNumbers> {
  const { where, notes, today } = asked;
  const [everyone, groups, recentNotes, coaching] = await Promise.all([
    countEveryone(db, asked.everyone),
    countGroups(db, where),
    countRecentNotes(db, where, notes, today),
    countCoaching(db, where),
  ]);
  return {
    everyone,
    ...groups,
    recentNotes,
    openCoaching: coaching.open,
    intensiveCoaching: coaching.intensive,
  };
}

/**
 * The students grouped by program studi and the total of their latest
 * scores: only these few rows leave the database.
 */
async function readPrograms(
  db: Database,
  where: SQL,
): Promise<ProgramAverage[]> {
  const latest = latestAssessments(db);
  const groups = await db
    .select({
      programId: studyPrograms.id,
      name: studyPrograms.name,
      total: latest.total,
      students: count(),
    })
    .from(students)
    .innerJoin(studyPrograms, eq(studyPrograms.id, students.studyProgramId))
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(where)
    .groupBy(studyPrograms.id, studyPrograms.name, latest.total);
  return programAverages(groups);
}

/**
 * "Catatan pengasuhan terbaru": the notes saved last about the students
 * of the group whose notes the account may read, as Pengasuhan shows
 * them, at most `shown`.
 */
export async function readLatestNotes(
  db: Database,
  asked: Pick<MentoringAsked, "where" | "notes" | "detail">,
  shown: number = LATEST_NOTES_SHOWN,
): Promise<LatestNote[]> {
  if (asked.notes === null) return [];
  return db
    .select({ ...LISTED_NOTE, opensDetail: opensDetailOf(asked.detail) })
    .from(mentoringNotes)
    .innerJoin(students, eq(students.id, mentoringNotes.studentId))
    .innerJoin(accounts, eq(accounts.id, mentoringNotes.writtenBy))
    .where(and(asked.where, asked.notes))
    .orderBy(...NEWEST_FIRST)
    .limit(shown);
}

/**
 * Pendampingan of the students `asked.where` lets through, read on each
 * load, so a note added or a student who left a group shows at once.
 */
export async function readMentoring(
  db: Database,
  asked: MentoringAsked,
): Promise<MentoringView> {
  const [numbers, programs, notes] = await Promise.all([
    readNumbers(db, asked),
    asked.byProgram ? readPrograms(db, asked.where) : null,
    readLatestNotes(db, asked),
  ]);
  return { numbers, programs, notes };
}
