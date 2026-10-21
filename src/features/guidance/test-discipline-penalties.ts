import { asc, eq } from "drizzle-orm";
import type { Database } from "@/db/connect";
import {
  disciplinePenalties,
  disciplinePenaltyChanges,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
} from "@/db/schema";

/** Made-up penalties for the checks of discipline penalties. */

/**
 * A Ringan pertama penalty of a student on a day, with 7 days of kerja
 * sosial from that day, added straight to the table with its log line,
 * saved at 10:00 on campus that day. Gives back its key.
 */
export async function addTestPenalty(
  db: Database,
  studentId: string,
  byId: string,
  day: string,
  more: Partial<typeof disciplinePenalties.$inferInsert> = {},
): Promise<string> {
  const id = crypto.randomUUID();
  const savedAt = new Date(`${day}T10:00:00+07:00`);
  const end = new Date(`${day}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  await db.insert(disciplinePenalties).values({
    id,
    studentId,
    day,
    description: "Terlambat mengikuti apel pagi tiga kali",
    category: "light",
    level: 1,
    status: "imposed",
    socialWorkForms: ["grounds"],
    socialWorkPlace: "campus",
    socialWorkStartsOn: day,
    socialWorkEndsOn: end.toISOString().slice(0, 10),
    savedBy: byId,
    savedAt,
    ...more,
  });
  await db.insert(disciplinePenaltyChanges).values({
    penaltyId: id,
    changedBy: byId,
    changedAt: new Date(),
    action: "added",
  });
  return id;
}

/** What a Jenjang without kerja sosial keeps of it: nothing. */
export const NO_SOCIAL_WORK: Partial<typeof disciplinePenalties.$inferInsert> =
  {
    socialWorkForms: [],
    socialWorkOther: "",
    socialWorkPlace: null,
    socialWorkStartsOn: null,
    socialWorkEndsOn: null,
  };

/** The log lines of a penalty, the earliest first. */
export function penaltyLinesOf(db: Database, penaltyId: string) {
  return db
    .select()
    .from(disciplinePenaltyChanges)
    .where(eq(disciplinePenaltyChanges.penaltyId, penaltyId))
    .orderBy(asc(disciplinePenaltyChanges.changedAt));
}

/** A penalty as it is kept. */
export async function penaltyAt(db: Database, penaltyId: string) {
  const [penalty] = await db
    .select()
    .from(disciplinePenalties)
    .where(eq(disciplinePenalties.id, penaltyId));
  return penalty;
}

/**
 * A kelompok pengasuhan in force of some students of a program, held
 * today by a mentor.
 */
export async function addPenaltyGroup(
  db: Database,
  programId: number,
  studentIds: string[],
  mentorId: string,
): Promise<void> {
  const startsOn = "2026-08-01";
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: programId,
      cohortYear: 2026,
      entryPath: "regular",
      number: 1,
      startsOn,
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  await db
    .insert(mentorGroupMembers)
    .values(studentIds.map((studentId) => ({ studentId, groupId: group.id })));
  await db
    .insert(mentorGroupMentors)
    .values({ groupId: group.id, mentorId, startsOn });
}
