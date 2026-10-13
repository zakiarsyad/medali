import { and, eq, inArray, isNull } from "drizzle-orm";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { isUuid } from "@/db/is-uuid";
import {
  accounts,
  mentorEvaluations,
  mentorGroupMentors,
  mentorGroups,
  studyPrograms,
} from "@/db/schema";
import type { GroupCodeParts } from "@/ui/group-code";
import type { EvaluationScores } from "./evaluation-aspects";
import { MEMBERS } from "./group-list";
import { readLastGroupEvaluations, SCORES } from "./last-evaluations";
import { groupsVisibleTo } from "./visible-groups";

/** The mentor who holds a group today. The NIP is never read. */
export interface MentorOfToday {
  id: string;
  name: string;
  title: string | null;
  unit: string | null;
  /** The day the mentor took the group. */
  since: string;
}

/** What is saved already for a group and one period. */
export interface StoredEvaluation extends EvaluationScores {
  periodId: string;
  note: string | null;
}

/** The group chosen on the form, with what the box above the form says. */
export interface EvaluatedGroup extends GroupCodeParts {
  id: string;
  /** Null for a group that has no mentor today. */
  mentor: MentorOfToday | null;
  /** How many Aktif students the group holds. */
  members: number;
  /** "Evaluasi terakhir" of the mentor of today. Null when there is none. */
  last: EvaluationScores | null;
  /** What is saved of the mentor of today for the periods asked for. */
  stored: StoredEvaluation[];
}

const HELD_TODAY = and(
  eq(mentorGroupMentors.groupId, mentorGroups.id),
  isNull(mentorGroupMentors.endsOn),
);

async function findGroup(db: Database, limit: RowLimit, id: string) {
  const [group] = await db
    .select({
      id: mentorGroups.id,
      cohortYear: mentorGroups.cohortYear,
      entryPath: mentorGroups.entryPath,
      number: mentorGroups.number,
      programCode: studyPrograms.code,
      members: MEMBERS,
      mentorId: accounts.id,
      mentorName: accounts.name,
      mentorTitle: accounts.title,
      mentorUnit: accounts.unit,
      mentorSince: mentorGroupMentors.startsOn,
    })
    .from(mentorGroups)
    .innerJoin(studyPrograms, eq(studyPrograms.id, mentorGroups.studyProgramId))
    .leftJoin(mentorGroupMentors, HELD_TODAY)
    .leftJoin(accounts, eq(accounts.id, mentorGroupMentors.mentorId))
    .where(and(eq(mentorGroups.id, id), groupsVisibleTo(limit)));
  if (!group) return null;
  const {
    mentorId,
    mentorName,
    mentorTitle,
    mentorUnit,
    mentorSince,
    ...rest
  } = group;
  if (mentorId === null || mentorName === null || mentorSince === null) {
    return { group: rest, mentor: null };
  }
  const mentor: MentorOfToday = {
    id: mentorId,
    name: mentorName,
    title: mentorTitle,
    unit: mentorUnit,
    since: mentorSince,
  };
  return { group: rest, mentor };
}

function readStored(
  db: Database,
  groupId: string,
  mentorId: string,
  periodIds: string[],
): Promise<StoredEvaluation[]> {
  if (periodIds.length === 0) return Promise.resolve([]);
  return db
    .select({
      periodId: mentorEvaluations.periodId,
      ...SCORES,
      note: mentorEvaluations.note,
    })
    .from(mentorEvaluations)
    .where(
      and(
        eq(mentorEvaluations.groupId, groupId),
        eq(mentorEvaluations.mentorId, mentorId),
        inArray(mentorEvaluations.periodId, periodIds),
      ),
    );
}

/**
 * The group the form is opened for, for an account with this limit, with
 * what is saved already for these periods. Null for an id that names no
 * group in force the account may see: the form then offers the choice
 * again, as if none was made.
 */
export async function readEvaluatedGroup(
  db: Database,
  limit: RowLimit,
  id: string,
  periodIds: string[],
): Promise<EvaluatedGroup | null> {
  // The database refuses to compare its ids with a text of another shape.
  if (!isUuid(id)) return null;
  const found = await findGroup(db, limit, id);
  if (found === null) return null;
  const { group, mentor } = found;
  if (mentor === null) return { ...group, mentor, last: null, stored: [] };
  const [last, stored] = await Promise.all([
    readLastGroupEvaluations(db, limit, [id]),
    readStored(db, id, mentor.id, periodIds),
  ]);
  return { ...group, mentor, last: last.get(id) ?? null, stored };
}
