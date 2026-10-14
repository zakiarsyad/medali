import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  sikuAdjustmentStudents,
  sikuAdjustments,
} from "@/db/schema";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { SikuKind, SikuReason } from "./siku-ids";

/** Made-up records for the checks of this area. */

export interface TestActor {
  id: string;
  roles: RoleId[];
  studyProgramId: number | null;
  studentId: string | null;
}

export async function addTestActor(
  db: Database,
  name: string,
  roles: RoleId[],
  more: Partial<Pick<TestActor, "studyProgramId" | "studentId">> = {},
): Promise<TestActor> {
  const [account] = await db
    .insert(accounts)
    .values({ name, ...more })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return {
    id: account.id,
    roles,
    studyProgramId: account.studyProgramId,
    studentId: account.studentId,
  };
}

/** The odd and the even period of a year far from those of other files. */
export async function addTestYear(
  db: Database,
  year: number,
): Promise<{ odd: string; even: string }> {
  const [odd, even] = await db
    .insert(academicPeriods)
    .values([
      {
        startYear: year,
        term: "odd",
        startsOn: `${year}-08-01`,
        endsOn: `${year + 1}-01-31`,
      },
      {
        startYear: year,
        term: "even",
        startsOn: `${year + 1}-02-01`,
        endsOn: `${year + 1}-07-31`,
      },
    ])
    .returning();
  if (!odd || !even) throw new Error("The periods were not added.");
  return { odd: odd.id, even: even.id };
}

/**
 * A program and Aktif students of an angkatan in it, named by place.
 * `nims` are the NIMs of the file's own block.
 */
export async function addTestStudents(
  db: Database,
  program: string,
  year: number,
  nims: string[],
): Promise<{ programId: number; studentIds: string[] }> {
  const programId = await addTestProgram(db, program);
  const studentIds: string[] = [];
  for (const [place, nim] of nims.entries()) {
    studentIds.push(
      await addTestStudent(db, programId, {
        nim,
        name: `Mahasiswa Uji SIKU ${place + 1}`,
        cohortYear: year,
      }),
    );
  }
  return { programId, studentIds };
}

export interface TestEntry {
  kind: SikuKind;
  reason: SikuReason;
  points: number;
  day: string;
  periodId: string;
  studentIds: string[];
  cancelled?: boolean;
}

/** An entry kept as it is, without the rules that check a sent one. */
export async function addTestEntry(
  db: Database,
  by: TestActor,
  entry: TestEntry,
): Promise<string> {
  const id = crypto.randomUUID();
  const moment = new Date(`${entry.day}T10:00:00+07:00`);
  await db.insert(sikuAdjustments).values({
    id,
    kind: entry.kind,
    reason: entry.reason,
    points: entry.points,
    day: entry.day,
    note: "Catatan uji",
    basis: entry.reason === "director_decision" ? "SK uji" : "",
    periodId: entry.periodId,
    enteredBy: by.id,
    enteredAs: "assessor",
    enteredAt: moment,
    cancelledBy: entry.cancelled ? by.id : null,
    cancelledAt: entry.cancelled ? moment : null,
  });
  await db
    .insert(sikuAdjustmentStudents)
    .values(
      entry.studentIds.map((studentId) => ({ adjustmentId: id, studentId })),
    );
  return id;
}
