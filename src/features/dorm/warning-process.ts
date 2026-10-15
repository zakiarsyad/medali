import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  dormActivityVersions,
  dormAttendanceCounts,
  dormClarifications,
  dormViolationAppeals,
  dormViolations,
  students,
} from "@/db/schema";
import { shownDay } from "@/ui/day";
import { VERSION_OF_COUNT } from "./clarification-store";
import { REASON_WORDS } from "./clarification-words";
import {
  ANNOUNCED_FIELDS,
  type AnnouncedViolation,
  APPEAL_OF_VIOLATION,
} from "./violation-announcement";
import { escalatedBy, inPeriodDays } from "./violation-conditions";
import {
  readCallsIn,
  readLetterMarks,
  type WarningCall,
} from "./warning-calls";
import type { WarningLevel } from "./warning-ids";
import {
  latestClarifications,
  readWarningSemester,
  type WarningSemester,
} from "./warning-standing";

/** A clarification of an absence of the semester that was rejected last. */
export interface RejectedClarification {
  id: string;
  /** The day of the activity, as the screens show it. */
  day: string;
  activity: string;
  reason: string;
  explanation: string;
  /** Who rejected it: BAM, or Pengelola Asrama after BAM passed it on. */
  rejectedBy: "BAM" | "Pengelola Asrama";
  note: string;
}

/** The resident a box of "Proses" is of. */
export interface ProcessStudent {
  studentId: string;
  name: string;
  nim: string;
}

/** What "Proses" of one resident shows. */
export interface WarningProcess {
  semesterTitle: string;
  student: ProcessStudent;
  /**
   * Their call, or null once they are no longer called, such as after
   * their violations were reduced in the open box.
   */
  call: WarningCall | null;
  /** The highest SP issued to them in the semester, or null for none. */
  mark: WarningLevel | null;
  rejected: RejectedClarification[];
  /** The violations of the semester gone up to Pengelola Asrama, the latest first. */
  counted: AnnouncedViolation[];
}

/**
 * The rejected clarifications of students in a semester that still
 * count, each with its activity as it was held, the earliest first.
 */
export async function readRejected(
  db: Database,
  semester: WarningSemester,
  ofStudents: SQL,
): Promise<(RejectedClarification & { studentId: string })[]> {
  const latest = latestClarifications(db, semester);
  const rows = await db
    .select({
      clarification: dormClarifications,
      day: dormAttendanceCounts.day,
      activity: dormActivityVersions.name,
    })
    .from(latest)
    .innerJoin(dormClarifications, eq(dormClarifications.id, latest.id))
    .innerJoin(
      dormAttendanceCounts,
      eq(dormAttendanceCounts.id, dormClarifications.countId),
    )
    .innerJoin(dormActivityVersions, VERSION_OF_COUNT)
    .innerJoin(students, eq(students.id, dormClarifications.studentId))
    .where(and(eq(latest.status, "rejected"), ofStudents))
    .orderBy(asc(dormAttendanceCounts.day), asc(dormClarifications.id));
  return rows.map(({ clarification, day, activity }) => {
    const byManager = clarification.decidedAt !== null;
    return {
      id: clarification.id,
      studentId: clarification.studentId,
      day: shownDay(day),
      activity,
      reason: REASON_WORDS[clarification.reason],
      explanation: clarification.explanation,
      rejectedBy: byManager ? "Pengelola Asrama" : "BAM",
      note: byManager ? clarification.decisionNote : clarification.verifyNote,
    };
  });
}

function readCounted(
  db: Database,
  semester: WarningSemester,
  student: SQL,
  now: Date,
): Promise<AnnouncedViolation[]> {
  return db
    .select(ANNOUNCED_FIELDS)
    .from(dormViolations)
    .innerJoin(students, eq(students.id, dormViolations.studentId))
    .leftJoin(dormViolationAppeals, APPEAL_OF_VIOLATION)
    .where(and(student, escalatedBy(now), inPeriodDays(semester.days)))
    .orderBy(desc(dormViolations.day), asc(dormViolations.id));
}

async function readStudent(
  db: Database,
  student: SQL,
): Promise<ProcessStudent | null> {
  const [found] = await db
    .select({ studentId: students.id, name: students.name, nim: students.nim })
    .from(students)
    .where(student);
  return found ?? null;
}

/**
 * What "Proses" of a resident `visible` holds shows, in the running
 * semester at `now` by the server's clock: their call, the rejected
 * clarifications and the counted violations behind it. A resident no
 * longer called gets no call, so a box that reduced their violations
 * stays open to say so. Null for a student not seen, or while no period
 * is stored. All of one semester of one resident, so the lists are not
 * paged.
 */
export async function readWarningProcess(
  db: Database,
  visible: SQL,
  studentId: string,
  now: Date,
): Promise<WarningProcess | null> {
  const semester = await readWarningSemester(db, now);
  if (semester === null) return null;
  const student = and(visible, eq(students.id, studentId)) ?? visible;
  const shown = await readStudent(db, student);
  if (shown === null) return null;
  const [calls, rejected, counted, marks] = await Promise.all([
    readCallsIn(db, semester, student, now, 1),
    readRejected(db, semester, student),
    readCounted(db, semester, student, now),
    readLetterMarks(db, semester.id, [shown.studentId]),
  ]);
  const [call = null] = calls.calls;
  return {
    semesterTitle: semester.title,
    student: shown,
    call,
    mark: marks[shown.studentId] ?? null,
    rejected,
    counted,
  };
}
