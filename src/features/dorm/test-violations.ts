import { asc, eq } from "drizzle-orm";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  accounts,
  dormViolationChanges,
  dormViolations,
} from "@/db/schema";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { SentViolationRow, SentViolations } from "./violation-input";

/** Made-up residents and BAM members for the checks of dorm violations. */

export interface ViolationSetting {
  /** Reguler women of the year's angkatan, who live in Dana Rakca. */
  residents: string[];
  /** A Reguler man of that angkatan, who lives in Cipta Bakti. */
  otherDorm: string;
  /** A student of an angkatan five years before, who lives in no dorm. */
  outsider: string;
}

/**
 * The odd period of a year far from those of other files, and students
 * of a program of the file's own. `nims` are 5 NIMs of the file's block.
 */
export async function addViolationSetting(
  db: Database,
  year: number,
  program: string,
  nims: [string, string, string, string, string],
): Promise<ViolationSetting> {
  await db.insert(academicPeriods).values({
    startYear: year,
    term: "odd",
    startsOn: `${year}-08-01`,
    endsOn: `${year + 1}-01-31`,
  });
  const programId = await addTestProgram(db, program);
  const [first, second, third, man, old] = nims;
  const resident = (nim: string, name: string) =>
    addTestStudent(db, programId, { nim, name, cohortYear: year });
  return {
    residents: [
      await resident(first, "Ani Uji Pelanggaran"),
      await resident(second, "Bea Uji Pelanggaran"),
      await resident(third, "Cici Uji Pelanggaran"),
    ],
    otherDorm: await addTestStudent(db, programId, {
      nim: man,
      name: "Dodi Uji Pelanggaran",
      cohortYear: year,
      sex: "male",
    }),
    outsider: await addTestStudent(db, programId, {
      nim: old,
      name: "Euis Uji Pelanggaran",
      cohortYear: year - 5,
    }),
  };
}

/** An account with roles, of a student when one is given. */
export async function addViolationActor(
  db: Database,
  name: string,
  roles: RoleId[],
  studentId: string | null = null,
): Promise<AccountForAccess> {
  const [account] = await db
    .insert(accounts)
    .values({ name, studentId })
    .returning();
  if (!account) throw new Error("The account was not added.");
  return { id: account.id, roles, studyProgramId: null, studentId };
}

/** A row of the list with nothing wrong in it. */
export function sentRow(
  studentId: string,
  more: Partial<SentViolationRow> = {},
): SentViolationRow {
  return {
    studentId,
    reason: "Terlambat apel pagi",
    punishment: "warning",
    otherPunishment: "",
    ...more,
  };
}

/** A list of a day, announced at 21:00 that day. */
export function sentList(
  day: string,
  rows: SentViolationRow[],
  more: Partial<SentViolations> = {},
): SentViolations {
  return { day, announceDay: day, announceTime: "21:00", rows, ...more };
}

/** The violations kept under a key, the earliest entered first. */
export function violationsUnder(db: Database, key: string) {
  return db
    .select()
    .from(dormViolations)
    .where(eq(dormViolations.batchId, key))
    .orderBy(asc(dormViolations.enteredAt));
}

/** The log lines of a violation, the earliest first. */
export function linesOf(db: Database, violationId: string) {
  return db
    .select()
    .from(dormViolationChanges)
    .where(eq(dormViolationChanges.violationId, violationId))
    .orderBy(asc(dormViolationChanges.changedAt));
}
