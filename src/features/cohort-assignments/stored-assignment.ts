import { and, asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import {
  accounts,
  cohortAssignmentChanges,
  cohortAssignmentGroups,
  cohortAssignmentMembers,
  cohortAssignments,
  students,
  studyPrograms,
} from "@/db/schema";
import type { GroupCodeParts } from "@/ui/group-code";
import type { AssignmentStatus, ChangeAction } from "./assignment-steps";
import type { AssignmentMethod } from "./methods";
import { inProgramsOf } from "./visible-assignments";

type Student = typeof students.$inferSelect;

/** A student of a group being prepared, as "Anggota" lists them. */
export type DraftMember = Pick<
  Student,
  "id" | "nim" | "name" | "sex" | "province" | "className"
>;

/** The mentor chosen for a group. The NIP of the mentor is never read. */
export interface ChosenMentor {
  id: string;
  name: string;
  title: string | null;
}

/** A group of a penetapan, with the mentor chosen for it and its members. */
export interface DraftGroup extends GroupCodeParts {
  id: string;
  studyProgramId: number;
  programName: string;
  /** Null while no mentor is chosen. */
  mentor: ChosenMentor | null;
  /** By name. */
  members: DraftMember[];
}

/** One line of "Riwayat proses". */
export interface LogLine {
  id: string;
  at: Date;
  action: ChangeAction;
  /** The name of who did it. */
  by: string;
}

/** The penetapan of one angkatan, as far as an account may see it. */
export interface StoredAssignment {
  id: string;
  cohortYear: number;
  status: AssignmentStatus;
  targetSize: number;
  method: AssignmentMethod;
  decreeNumber: string | null;
  effectiveOn: string | null;
  version: number;
  /** The name of who saved it last: for a fixed one, who fixed it. */
  savedBy: string;
  /** The Reguler jalur first, then by program studi and number. */
  groups: DraftGroup[];
  /** The newest first. */
  log: LogLine[];
}

const ASSIGNMENT = {
  id: cohortAssignments.id,
  cohortYear: cohortAssignments.cohortYear,
  status: cohortAssignments.status,
  targetSize: cohortAssignments.targetSize,
  method: cohortAssignments.method,
  decreeNumber: cohortAssignments.decreeNumber,
  effectiveOn: cohortAssignments.effectiveOn,
  version: cohortAssignments.version,
  savedBy: accounts.name,
};

const mentor = alias(accounts, "mentor");

const GROUP = {
  id: cohortAssignmentGroups.id,
  studyProgramId: cohortAssignmentGroups.studyProgramId,
  entryPath: cohortAssignmentGroups.entryPath,
  number: cohortAssignmentGroups.number,
  programName: studyPrograms.name,
  programCode: studyPrograms.code,
  mentorId: cohortAssignmentGroups.mentorId,
  mentorName: mentor.name,
  mentorTitle: mentor.title,
};

const MEMBER = {
  groupId: cohortAssignmentMembers.groupId,
  id: students.id,
  nim: students.nim,
  name: students.name,
  sex: students.sex,
  province: students.province,
  className: students.className,
};

function readGroupRows(db: Database, limit: RowLimit, assignmentId: string) {
  return db
    .select(GROUP)
    .from(cohortAssignmentGroups)
    .innerJoin(
      studyPrograms,
      eq(studyPrograms.id, cohortAssignmentGroups.studyProgramId),
    )
    .leftJoin(mentor, eq(mentor.id, cohortAssignmentGroups.mentorId))
    .where(
      and(
        eq(cohortAssignmentGroups.assignmentId, assignmentId),
        inProgramsOf(limit, cohortAssignmentGroups.studyProgramId),
      ),
    )
    .orderBy(
      asc(cohortAssignmentGroups.entryPath),
      asc(studyPrograms.name),
      asc(cohortAssignmentGroups.number),
    );
}

function readMemberRows(db: Database, limit: RowLimit, assignmentId: string) {
  return db
    .select(MEMBER)
    .from(cohortAssignmentMembers)
    .innerJoin(
      cohortAssignmentGroups,
      eq(cohortAssignmentGroups.id, cohortAssignmentMembers.groupId),
    )
    .innerJoin(students, eq(students.id, cohortAssignmentMembers.studentId))
    .where(
      and(
        eq(cohortAssignmentGroups.assignmentId, assignmentId),
        inProgramsOf(limit, cohortAssignmentGroups.studyProgramId),
      ),
    )
    .orderBy(asc(students.name), asc(students.nim));
}

function readLog(db: Database, assignmentId: string): Promise<LogLine[]> {
  return db
    .select({
      id: cohortAssignmentChanges.id,
      at: cohortAssignmentChanges.changedAt,
      action: cohortAssignmentChanges.action,
      by: accounts.name,
    })
    .from(cohortAssignmentChanges)
    .innerJoin(accounts, eq(accounts.id, cohortAssignmentChanges.changedBy))
    .where(eq(cohortAssignmentChanges.assignmentId, assignmentId))
    .orderBy(desc(cohortAssignmentChanges.changedAt));
}

type GroupRow = Awaited<ReturnType<typeof readGroupRows>>[number];
type MemberRow = Awaited<ReturnType<typeof readMemberRows>>[number];

function chosenMentor(row: GroupRow): ChosenMentor | null {
  if (row.mentorId === null || row.mentorName === null) return null;
  return { id: row.mentorId, name: row.mentorName, title: row.mentorTitle };
}

function membersOf(rows: MemberRow[], groupId: string): DraftMember[] {
  const members: DraftMember[] = [];
  for (const { groupId: inGroup, ...member } of rows) {
    if (inGroup === groupId) members.push(member);
  }
  return members;
}

function draftGroup(
  row: GroupRow,
  cohortYear: number,
  members: MemberRow[],
): DraftGroup {
  const { mentorId, mentorName, mentorTitle, ...group } = row;
  return {
    ...group,
    cohortYear,
    mentor: chosenMentor(row),
    members: membersOf(members, row.id),
  };
}

/**
 * The penetapan of an angkatan with its groups, their members and its
 * log, or null for an angkatan that has none. An account held to its
 * study programs is given the groups of those programs only.
 */
export async function readAssignment(
  db: Database,
  limit: RowLimit,
  cohortYear: number,
): Promise<StoredAssignment | null> {
  const [assignment] = await db
    .select(ASSIGNMENT)
    .from(cohortAssignments)
    .innerJoin(accounts, eq(accounts.id, cohortAssignments.savedBy))
    .where(eq(cohortAssignments.cohortYear, cohortYear));
  if (!assignment) return null;
  const [groups, members, log] = await Promise.all([
    readGroupRows(db, limit, assignment.id),
    readMemberRows(db, limit, assignment.id),
    readLog(db, assignment.id),
  ]);
  return {
    ...assignment,
    groups: groups.map((group) => draftGroup(group, cohortYear, members)),
    log,
  };
}
