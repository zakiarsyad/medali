import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accounts,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import { mentorLabel } from "@/ui/mentor-label";

/** The pengasuh a student rates in the survey, with their group. */
export interface SurveyMentor {
  groupId: string;
  mentorId: string;
  /** With the gelar after it, as the screens name a mentor. */
  mentorName: string;
}

/**
 * The mentor of today of a student's group, when the student is Aktif
 * and in a group in force that has one. Null otherwise: a student on
 * Cuti, Non aktif or without a pengasuh answers no survey.
 */
export async function readSurveyMentor(
  db: Database,
  studentId: string,
): Promise<SurveyMentor | null> {
  const [found] = await db
    .select({
      groupId: mentorGroups.id,
      mentorId: mentorGroupMentors.mentorId,
      name: accounts.name,
      title: accounts.title,
    })
    .from(mentorGroupMembers)
    .innerJoin(students, eq(students.id, mentorGroupMembers.studentId))
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMembers.groupId))
    .innerJoin(
      mentorGroupMentors,
      and(
        eq(mentorGroupMentors.groupId, mentorGroups.id),
        isNull(mentorGroupMentors.endsOn),
      ),
    )
    .innerJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(
      and(
        eq(mentorGroupMembers.studentId, studentId),
        ACTIVE_MEMBER,
        NOT_ENDED,
      ),
    );
  if (!found) return null;
  return {
    groupId: found.groupId,
    mentorId: found.mentorId,
    mentorName: mentorLabel(found),
  };
}
