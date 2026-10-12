import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroupPastMembers,
  mentorGroups,
} from "@/db/schema";

/** A kelompok pengasuhan as the checks of a penetapan look at it. */
export interface TestLiveGroup {
  id: string;
  studyProgramId: number;
  number: number;
  startsOn: string;
  endedAt: Date | null;
  endedBy: string | null;
  /** Each mentor line of the group that has no last day. */
  mentors: { mentorId: string; startsOn: string }[];
  /** The members of today, sorted. */
  studentIds: string[];
  /** Who the members were when the group was ended, sorted. */
  pastStudentIds: string[];
}

async function testLiveGroup(
  db: Database,
  group: typeof mentorGroups.$inferSelect,
): Promise<TestLiveGroup> {
  const mentors = await db
    .select({
      mentorId: mentorGroupMentors.mentorId,
      startsOn: mentorGroupMentors.startsOn,
    })
    .from(mentorGroupMentors)
    .where(
      and(
        eq(mentorGroupMentors.groupId, group.id),
        isNull(mentorGroupMentors.endsOn),
      ),
    );
  const members = await db
    .select({ studentId: mentorGroupMembers.studentId })
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.groupId, group.id));
  const past = await db
    .select({ studentId: mentorGroupPastMembers.studentId })
    .from(mentorGroupPastMembers)
    .where(eq(mentorGroupPastMembers.groupId, group.id));
  return {
    ...group,
    mentors,
    studentIds: members.map((member) => member.studentId).sort(),
    pastStudentIds: past.map((member) => member.studentId).sort(),
  };
}

/** Every kelompok pengasuhan of an angkatan, ended or not. */
export async function testLiveGroupsOf(
  db: Database,
  cohortYear: number,
): Promise<TestLiveGroup[]> {
  const groups = await db
    .select()
    .from(mentorGroups)
    .where(eq(mentorGroups.cohortYear, cohortYear));
  const read: TestLiveGroup[] = [];
  for (const group of groups) read.push(await testLiveGroup(db, group));
  return read;
}
