import { addStudent } from "@/features/students/add-student";
import type { Database } from "./connect";
import {
  SAMPLE_ACCOUNTS,
  SAMPLE_PPKS_ACTIVITIES,
  SAMPLE_STUDENTS,
  type SampleAccount,
} from "./sample-data";
import {
  accountRoles,
  accounts,
  ppksActivities,
  roleChanges,
  studyPrograms,
} from "./schema";

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

/**
 * Fills a freshly built database with the sample data. Every role given is
 * logged as the work of the first sample account, the sample Kepala Unit,
 * who is logged as adding themselves.
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
    await tx
      .insert(ppksActivities)
      .values(
        SAMPLE_PPKS_ACTIVITIES.map((activity) => ({ ...activity, ...changed })),
      );
  });
}
