import { campusDay } from "@/academic-periods/campus-day";
import { addStudent, addStudents } from "@/features/students/add-student";
import type { Database } from "./connect";
import {
  SAMPLE_ACCOUNTS,
  SAMPLE_PPKS_ACTIVITIES,
  SAMPLE_SPECIAL_ACTIVITIES,
  SAMPLE_STUDENTS,
  type SampleAccount,
  type SamplePeriod,
  samplePeriods,
} from "./sample-data";
import { sampleFirstYears } from "./sample-dorms";
import { sampleGroupedFirstYears } from "./sample-new-intake";
import {
  academicPeriodChanges,
  academicPeriods,
  accountRoles,
  accounts,
  ppksActivities,
  roleChanges,
  studyPrograms,
} from "./schema";
import { addSampleActivityAttendances } from "./seed-activity-attendances";
import { addSampleActivitySchedules } from "./seed-activity-schedules";
import { addSampleDorms } from "./seed-dorms";
import { addSampleMentorEvaluations } from "./seed-mentor-evaluations";
import { addSampleMentorGroups } from "./seed-mentor-groups";
import { addSampleMentorReplacements } from "./seed-mentor-replacements";
import { addSampleMentoringMeetings } from "./seed-mentoring-meetings";
import { addSampleMentoringNotes } from "./seed-mentoring-notes";
import { addSampleMentoringScores } from "./seed-mentoring-scores";

const SAMPLE_EMAIL_DOMAIN = "contoh.pknstan.ac.id";

function sampleEmail(name: string): string {
  return `${name.toLowerCase().replaceAll(" ", ".")}@${SAMPLE_EMAIL_DOMAIN}`;
}

function sampleNip(place: number): string {
  return `19800101200501${String(1000 + place)}`;
}

async function addSampleAccount(
  db: Database,
  account: SampleAccount,
  place: number,
  programIds: Map<string, number>,
  by: string | null,
): Promise<string> {
  const [added] = await db
    .insert(accounts)
    .values({
      name: account.name,
      title: account.title,
      nip: sampleNip(place),
      email: sampleEmail(account.name),
      unit: account.unit,
      studyProgramId:
        account.studyProgram === undefined
          ? null
          : programId(programIds, account.studyProgram),
    })
    .returning({ id: accounts.id });
  if (!added) throw new Error(`The account ${account.name} was not added.`);
  await db
    .insert(accountRoles)
    .values(account.roles.map((role) => ({ accountId: added.id, role })));
  await db.insert(roleChanges).values({
    accountId: added.id,
    changedBy: by ?? added.id,
    action: "added",
    rolesBefore: [],
    rolesAfter: account.roles,
  });
  return added.id;
}

function programId(programIds: Map<string, number>, name: string): number {
  const id = programIds.get(name);
  if (id === undefined) {
    throw new Error(
      `The study program ${name} is missing. Apply the table changes first.`,
    );
  }
  return id;
}

async function studyProgramIds(db: Database): Promise<Map<string, number>> {
  const programs = await db.select().from(studyPrograms);
  return new Map(programs.map((program) => [program.name, program.id]));
}

async function hasAccounts(db: Database): Promise<boolean> {
  const [found] = await db.select({ id: accounts.id }).from(accounts).limit(1);
  return found !== undefined;
}

async function addSamplePeriods(
  db: Database,
  periods: SamplePeriod[],
  by: string,
): Promise<void> {
  const added = await db.insert(academicPeriods).values(periods).returning();
  await db.insert(academicPeriodChanges).values(
    added.map((period) => ({
      periodId: period.id,
      changedBy: by,
      action: "added" as const,
      startsOnAfter: period.startsOn,
      endsOnAfter: period.endsOn,
    })),
  );
}

/** Adds the students in their first year of a period, who fill the dorms. */
async function addSampleFirstYears(
  db: Database,
  period: SamplePeriod,
  programIds: Map<string, number>,
  by: string,
): Promise<void> {
  const firstYears = sampleFirstYears(period.startYear);
  const added = await addStudents(
    db,
    firstYears.map(({ studyProgram, ...student }) => ({
      ...student,
      studyProgramId: programId(programIds, studyProgram),
    })),
    by,
  );
  if (added.length !== firstYears.length) {
    throw new Error("A sample NIM of the first year is used twice.");
  }
}

/**
 * Fills a freshly built database with the sample data, among it the
 * students in their first year of the running period, the dorm rooms
 * with some of the residents in them, and the kelompok pengasuhan of
 * every sample student but those of the new angkatan, whose groups are
 * still to be formed, with a few evaluations of their mentors, one
 * replacement of a mentor, a few notes their mentors wrote, the first two
 * meetings of the running period with their attendance lists and the
 * scores of that period for part of the groups, and schedules of the PPKS
 * activities that are over, open today and still to come, with the
 * attendance of the sample students at them in every status. Every role
 * given is logged as the
 * work of the first sample account, the sample Kepala Unit, who is logged
 * as adding themselves.
 */
export async function fillWithSampleData(db: Database): Promise<void> {
  await db.transaction(async (tx) => {
    if (await hasAccounts(tx)) {
      throw new Error("Sample data goes only into a freshly built database.");
    }
    const programIds = await studyProgramIds(tx);

    let sampleActor: string | null = null;
    for (const [place, account] of SAMPLE_ACCOUNTS.entries()) {
      const id = await addSampleAccount(
        tx,
        account,
        place,
        programIds,
        sampleActor,
      );
      sampleActor ??= id;
    }
    if (sampleActor === null) throw new Error("There are no sample accounts.");
    for (const { studyProgram, ...student } of SAMPLE_STUDENTS) {
      const studyProgramId = programId(programIds, studyProgram);
      const added = await addStudent(
        tx,
        { ...student, studyProgramId },
        sampleActor,
      );
      if (!added) {
        throw new Error(`The sample NIM ${student.nim} is used twice.`);
      }
    }
    const changed = { changedAt: new Date(), changedBy: sampleActor };
    const special = SAMPLE_SPECIAL_ACTIVITIES.map((activity) => ({
      ...activity,
      semester: null,
    }));
    await tx.insert(ppksActivities).values(
      [...SAMPLE_PPKS_ACTIVITIES, ...special].map((activity) => ({
        ...activity,
        ...changed,
      })),
    );
    const today = campusDay();
    const periods = samplePeriods(today);
    const [running] = periods;
    if (!running) throw new Error("There are no sample periods.");
    await addSamplePeriods(tx, periods, sampleActor);
    const schedules = await addSampleActivitySchedules(
      tx,
      periods,
      today,
      sampleActor,
    );
    await addSampleActivityAttendances(tx, schedules, SAMPLE_STUDENTS, today);
    await addSampleFirstYears(tx, running, programIds, sampleActor);
    await addSampleDorms(tx, running);
    const grouped = [
      ...SAMPLE_STUDENTS,
      ...sampleGroupedFirstYears(running.startYear),
    ];
    const groups = await addSampleMentorGroups(tx, grouped, today);
    await addSampleMentoringNotes(tx, groups, grouped, today);
    await addSampleMentoringMeetings(tx, groups, grouped, running, today);
    await addSampleMentoringScores(tx, groups, grouped, running, today);
    await addSampleMentorEvaluations(tx, groups, periods, sampleActor);
    await addSampleMentorReplacements(tx, groups, sampleActor);
  });
}
