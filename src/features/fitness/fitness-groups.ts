import { and, asc, eq, gt, type SQL, sql } from "drizzle-orm";
import { type AccountForAccess, rowLimitForAction } from "@/auth/access";
import { visibleTo } from "@/auth/visible-students";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  mentorGroupMembers,
  mentorGroups,
  students,
  studyPrograms,
} from "@/db/schema";
import { ACTIVE_MEMBER } from "@/mentoring/active-member";
import { NOT_ENDED } from "@/mentoring/group-in-force";
import { MEMBERS } from "@/mentoring/member-count";
import { groupCode } from "@/ui/group-code";
import { latestFitnessScores } from "./latest-fitness-scores";

/** A kelompok pengasuhan "Kelompok mahasiswa" offers, by its code. */
export interface GroupChoice {
  id: string;
  code: string;
  /** How many Aktif students it holds. */
  members: number;
}

/** A member of the group chosen, with "Skor saat ini". */
export interface GroupMember {
  id: string;
  name: string;
  nim: string;
  /** The latest score, or null for one not tested. */
  latestScore: number | null;
}

/** The groups in force that hold an Aktif student, by program and angkatan. */
export async function readFitnessGroupChoices(
  db: Database,
): Promise<GroupChoice[]> {
  const rows = await db
    .select({
      id: mentorGroups.id,
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
      members: MEMBERS,
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .where(and(NOT_ENDED, gt(MEMBERS, 0)))
    .orderBy(
      asc(studyPrograms.code),
      asc(mentorGroups.cohortYear),
      asc(mentorGroups.entryPath),
      asc(mentorGroups.number),
    );
  return rows.map((row) => ({
    id: row.id,
    code: groupCode(row),
    members: row.members,
  }));
}

/**
 * The students who may get a score of a group, for the `where` of a read
 * of students: its Aktif members whom the account may enter scores for,
 * while the group is in force. Nobody for a group that is not in force.
 */
export function scoredMembersOf(
  actor: AccountForAccess,
  groupId: string,
): SQL | undefined {
  const inGroup = sql`exists (
    select 1 from ${mentorGroupMembers}
    inner join ${mentorGroups} on ${mentorGroups.id} = ${mentorGroupMembers.groupId}
    where ${mentorGroupMembers.studentId} = ${students.id}
      and ${mentorGroupMembers.groupId} = ${groupId}
      and ${NOT_ENDED}
  )`;
  const scope = visibleTo(rowLimitForAction(actor, "enter_fitness_scores"));
  return and(inGroup, ACTIVE_MEMBER, scope);
}

/**
 * The members of a group the form shows, by name, each with "Skor saat
 * ini". Nobody for what is no group in force: `groupId` comes from
 * outside and is not trusted.
 */
export async function readGroupMembers(
  db: Database,
  actor: AccountForAccess,
  groupId: unknown,
): Promise<GroupMember[]> {
  if (!isUuid(groupId)) return [];
  const latest = latestFitnessScores(db);
  return db
    .select({
      id: students.id,
      name: students.name,
      nim: students.nim,
      latestScore: latest.score,
    })
    .from(students)
    .leftJoin(latest, eq(latest.studentId, students.id))
    .where(scoredMembersOf(actor, String(groupId)))
    .orderBy(asc(students.name), asc(students.nim));
}
