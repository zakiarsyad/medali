import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { fixedCharacterGrades, semesterClosings } from "@/db/schema";
import { type Save, withOwnTestDatabase } from "@/db/test-database-at-once";
import {
  addTestPeriods,
  addTestProgram,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import type { Parsed } from "@/parsed";
import { closeSemester } from "./close-semester";
import { addTestActor } from "./test-records";

/*
 * A closed semester cannot be deleted, so no rows are removed after a
 * check: each check closes a period of its own, and the database is
 * dropped at the end.
 */
const own = withOwnTestDatabase("closings");

/** A day after both periods of every year below have ended. */
const TODAY = "5140-09-01";

let kepala: Awaited<ReturnType<typeof addTestActor>>;
let other: Awaited<ReturnType<typeof addTestActor>>;

beforeAll(async () => {
  kepala = await addTestActor(own.db, "Kepala Uji Tutup Serentak", [
    "head_of_unit",
  ]);
  other = await addTestActor(own.db, "Kepala Lain Uji Tutup Serentak", [
    "head_of_unit",
  ]);
  const programId = await addTestProgram(own.db, "UJITUTUPSERENTAK");
  for (const nim of ["9951330001", "9951330002"]) {
    await addTestStudentAccount(own.db, programId, {
      nim,
      name: `Mahasiswa Uji Tutup Serentak ${nim}`,
      cohortYear: 5129,
    });
  }
});

function close(
  by: { id: string; roles: typeof kepala.roles },
  id: string,
): Save<Parsed<string>> {
  return (db) => closeSemester(db, by, id, true, TODAY);
}

async function closingsOf(periodId: string) {
  return own.db
    .select()
    .from(semesterClosings)
    .where(eq(semesterClosings.periodId, periodId));
}

describe("two closings of one period sent at the same moment", () => {
  it("closes it once, and the second sees that it is closed", async () => {
    const { oddId } = await addTestPeriods(own.db, 5130);

    const both = await own.atOnce(close(kepala, oddId), close(other, oddId));

    expect(both.sooner).toEqual({ ok: true, value: "Ganjil 5130/5131" });
    expect(both.later).toEqual({
      ok: false,
      error: "Semester ini sudah ditutup.",
    });
    const closings = await closingsOf(oddId);
    expect(closings).toHaveLength(1);
    expect(closings[0]?.closedBy).toBe(kepala.id);
    const grades = await own.db
      .select()
      .from(fixedCharacterGrades)
      .where(eq(fixedCharacterGrades.closingId, closings[0]?.id ?? ""));
    expect(grades).toHaveLength(2);
  });
});
