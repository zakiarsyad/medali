import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  activitySchedules,
  ppksActivities,
  students,
  studyPrograms,
} from "@/db/schema";

/**
 * Made-up records for the checks of this area. Each file of checks uses
 * Tahun akademik, a program name and a block of NIMs of its own: the
 * database makes two checks that add the same one wait for each other.
 */

export interface TestActor {
  id: string;
  roles: RoleId[];
}

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
): Promise<TestActor> {
  const [account] = await db.insert(accounts).values({ name }).returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles };
}

type TestActivity = Partial<typeof ppksActivities.$inferInsert>;

/** A stored PPKS activity of semester 3, unless told otherwise. */
export async function addTestActivity(
  db: Database,
  byId: string,
  more: TestActivity = {},
): Promise<string> {
  const [activity] = await db
    .insert(ppksActivities)
    .values({
      semester: 3,
      name: "Kegiatan uji jadwal",
      valueKeys: ["M", "D"],
      indicatorCodes: ["M2", "D2"],
      targetParticipants: 40,
      isRequired: true,
      description: "",
      changedAt: new Date(),
      changedBy: byId,
      ...more,
    })
    .returning({ id: ppksActivities.id });
  if (!activity) throw new Error("The activity was not added.");
  return activity.id;
}

export interface TestPeriods {
  /** Ganjil of the year: 1 August to 31 January. */
  oddId: string;
  /** Genap of the year: 1 March to 31 July, so February is between the two. */
  evenId: string;
}

/** The two periods of a Tahun akademik, with a month between them. */
export async function addTestPeriods(
  db: Database,
  startYear: number,
): Promise<TestPeriods> {
  const [odd, even] = await db
    .insert(academicPeriods)
    .values([
      {
        startYear,
        term: "odd",
        startsOn: `${startYear}-08-01`,
        endsOn: `${startYear + 1}-01-31`,
      },
      {
        startYear,
        term: "even",
        startsOn: `${startYear + 1}-03-01`,
        endsOn: `${startYear + 1}-07-31`,
      },
    ])
    .returning({ id: academicPeriods.id });
  if (!odd || !even) throw new Error("The periods were not added.");
  return { oddId: odd.id, evenId: even.id };
}

type TestSchedule = Pick<
  typeof activitySchedules.$inferInsert,
  "activityId" | "academicPeriodId" | "changedBy" | "startsOn"
> &
  Partial<typeof activitySchedules.$inferInsert>;

/** A stored schedule of one morning, with an upload range of 1 hari. */
export async function addTestSchedule(
  db: Database,
  schedule: TestSchedule,
): Promise<string> {
  const [added] = await db
    .insert(activitySchedules)
    .values({
      endsOn: schedule.startsOn,
      startTime: "07:30",
      endTime: "11:30",
      uploadCount: 1,
      uploadUnit: "day",
      location: "Aula uji",
      isRequired: true,
      changedAt: new Date(),
      ...schedule,
    })
    .returning({ id: activitySchedules.id });
  if (!added) throw new Error("The schedule was not added.");
  return added.id;
}

/** A study program whose name is also its code. */
export async function addTestProgram(
  db: Database,
  name: string,
): Promise<number> {
  const [program] = await db
    .insert(studyPrograms)
    .values({ name, code: name })
    .returning();
  if (!program) throw new Error("The study program was not added.");
  return program.id;
}

type TestStudent = Pick<
  typeof students.$inferInsert,
  "nim" | "name" | "cohortYear"
> &
  Partial<typeof students.$inferInsert>;

export async function addTestStudents(
  db: Database,
  studyProgramId: number,
  added: TestStudent[],
): Promise<void> {
  await db.insert(students).values(
    added.map((student) => ({
      studyProgramId,
      entryPath: "regular" as const,
      sex: "female" as const,
      ...student,
    })),
  );
}
