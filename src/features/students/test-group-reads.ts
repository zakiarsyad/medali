import { and, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  mentorGroupMemberChanges,
  mentorGroupMembers,
  students,
} from "@/db/schema";
import { listGroupChoices } from "./mentor-group-choices";
import { visibleTo } from "./visible-students";

/** What the checks of a student's place in a group read back. */

/** The students stored as members of a group, whatever their status. */
export async function membersOf(
  db: Database,
  groupId: string,
): Promise<string[]> {
  const members = await db
    .select({ studentId: mentorGroupMembers.studentId })
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.groupId, groupId));
  return members.map((member) => member.studentId);
}

/** How many members the group's page counts: the Aktif ones. */
export async function memberCount(
  db: Database,
  groupId: string,
): Promise<number> {
  const groups = await listGroupChoices(db);
  return groups.find((group) => group.id === groupId)?.members ?? 0;
}

/** Whether the mentor's own read of students holds the student. */
export async function isSeenBy(
  db: Database,
  mentorId: string,
  studentId: string,
): Promise<boolean> {
  const mentees = visibleTo({
    kind: "some",
    studyProgramIds: [],
    menteesOf: [mentorId],
    studentIds: [],
  });
  const seen = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), mentees));
  return seen.length === 1;
}

/** The placements logged for one student: before, after and who. */
export async function placementsOf(db: Database, studentId: string) {
  const lines = await db
    .select()
    .from(mentorGroupMemberChanges)
    .where(eq(mentorGroupMemberChanges.studentId, studentId));
  return lines.map((line) => [
    line.groupBefore,
    line.groupAfter,
    line.changedBy,
  ]);
}
