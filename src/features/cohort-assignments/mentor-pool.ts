import { and, eq, isNull, or, sql } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  accountRoles,
  accounts,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";
import { mentorsToChoose } from "./mentor-choices";
import type { PoolMentor } from "./mentor-options";

/** A mentor line of today, of a group that is in force. */
const HELD_TODAY = and(
  isNull(mentorGroupMentors.endsOn),
  isNull(mentorGroups.endedAt),
);

/** Whether an account has the Pengasuh role and is not removed. */
const HAS_MENTOR_ROLE = sql<boolean>`(
  ${accounts.deletedAt} is null
  and exists (
    select 1 from ${accountRoles}
    where ${accountRoles.accountId} = ${accounts.id}
      and ${accountRoles.role} = 'mentor'
  )
)`;

const HOLDS_A_GROUP = sql`exists (
  select 1 from ${mentorGroupMentors}
  inner join ${mentorGroups}
    on ${mentorGroups.id} = ${mentorGroupMentors.groupId}
  where ${and(eq(mentorGroupMentors.mentorId, accounts.id), HELD_TODAY)}
)`;

/** The angkatan of every group held today, with who holds it. */
function readHeldCohorts(db: Database) {
  return db
    .select({
      mentorId: mentorGroupMentors.mentorId,
      cohortYear: mentorGroups.cohortYear,
    })
    .from(mentorGroupMentors)
    .innerJoin(mentorGroups, eq(mentorGroups.id, mentorGroupMentors.groupId))
    .where(HELD_TODAY);
}

/** The staff who have the Pengasuh role or hold a group today. */
function readMentors(db: Database) {
  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      title: accounts.title,
      unit: accounts.unit,
      hasMentorRole: HAS_MENTOR_ROLE,
    })
    .from(accounts)
    .where(and(isNull(accounts.studentId), or(HAS_MENTOR_ROLE, HOLDS_A_GROUP)));
}

/**
 * The mentors that may be chosen for a group of an angkatan, by name:
 * see `mayBeChosen`. Read at the server for the choices the tab offers
 * and again for every choice that is sent. The NIP of a mentor is never
 * read.
 */
export async function readMentorPool(
  db: Database,
  cohortYear: number,
): Promise<PoolMentor[]> {
  const [mentors, held] = await Promise.all([
    readMentors(db),
    readHeldCohorts(db),
  ]);
  const candidates = mentors.map((mentor) => ({
    ...mentor,
    heldCohortYears: held
      .filter((line) => line.mentorId === mentor.id)
      .map((line) => line.cohortYear),
  }));
  return mentorsToChoose(candidates, cohortYear);
}
