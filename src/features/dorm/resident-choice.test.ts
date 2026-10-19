// Sample Tahun akademik of this file: 3500 to 3500.
// Sample NIMs of this file: 9935000100 to 9935000199.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  dormResidentChoiceChanges,
  dormResidentChoices,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readDormCohorts } from "@/dorms/dorm-cohorts";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { holdStudent, saveChosenDorm } from "./resident-choice";
import { addTestActor, addTestCompanion } from "./test-records";

const inTestDatabase = withTestDatabase();

/** Angkatan 3500 is in semester 1 in it, angkatan 3499 in semester 3. */
const ODD_3500 = {
  startYear: 3500,
  term: "odd",
  startsOn: "3500-08-01",
  endsOn: "3501-01-31",
} as const;
const DAY = "3500-10-12";

/** A Reguler woman of semester 3, who lives in no dorm by the usual rule. */
async function addSenior(db: Database, nim: string) {
  await db.insert(academicPeriods).values(ODD_3500).onConflictDoNothing();
  const program = await addTestProgram(db, "Prodi Uji Pilihan Asrama");
  return addTestStudent(db, program, { nim, name: "Uji", cohortYear: 3499 });
}

async function held(db: Database, studentId: string) {
  const cohorts = (await readDormCohorts(db, DAY)) ?? [];
  return db.transaction((tx) => holdStudent(tx, cohorts, studentId));
}

async function logOf(db: Database, studentId: string) {
  const lines = await db
    .select()
    .from(dormResidentChoiceChanges)
    .where(eq(dormResidentChoiceChanges.studentId, studentId))
    .orderBy(asc(dormResidentChoiceChanges.changedAt));
  return lines.map((line) => [line.dormBefore, line.dormAfter, line.changedBy]);
}

describe("saveChosenDorm", () => {
  it("keeps the choice, and logs who made it with the dorm before and after", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db, "9935000101");
      const manager = await addTestActor(db, "Pengelola Uji", ["dorm_manager"]);

      await saveChosenDorm(db, manager.id, {
        studentId,
        before: null,
        after: "dana_rakca",
        note: "Pindahan",
      });

      const [choice] = await db
        .select()
        .from(dormResidentChoices)
        .where(eq(dormResidentChoices.studentId, studentId));
      expect(choice).toMatchObject({
        dorm: "dana_rakca",
        note: "Pindahan",
        setBy: manager.id,
      });
      expect(await logOf(db, studentId)).toEqual([
        [null, "dana_rakca", manager.id],
      ]);
      expect((await held(db, studentId))?.dorm).toBe("dana_rakca");
    });
  });

  it("puts a new choice in place of the one before, and logs both", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db, "9935000102");
      const manager = await addTestActor(db, "Pengelola Uji", ["dorm_manager"]);
      const first = { studentId, before: null, after: "dana_rakca" as const };
      await saveChosenDorm(db, manager.id, { ...first, note: "Catatan" });

      await saveChosenDorm(db, manager.id, {
        studentId,
        before: "dana_rakca",
        after: null,
        note: null,
      });

      const choices = await db
        .select({ dorm: dormResidentChoices.dorm })
        .from(dormResidentChoices)
        .where(eq(dormResidentChoices.studentId, studentId));
      expect(choices).toEqual([{ dorm: null }]);
      expect(await logOf(db, studentId)).toEqual([
        [null, "dana_rakca", manager.id],
        ["dana_rakca", null, manager.id],
      ]);
      expect((await held(db, studentId))?.dorm).toBeNull();
    });
  });
});

describe("holdStudent", () => {
  it("tells an Aktif kakak pendamping, and the dorm they serve", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db, "9935000103");
      await addTestCompanion(db, studentId);

      expect(await held(db, studentId)).toEqual({
        name: "Uji",
        sex: "female",
        isActive: true,
        dorm: "dana_rakca",
        isCompanion: true,
      });
    });
  });

  it("gives nothing for a student who is not found", async () => {
    await inTestDatabase(async (db) => {
      await addSenior(db, "9935000104");
      const nobody = "00000000-0000-4000-8000-000000000000";

      expect(await held(db, nobody)).toBeNull();
    });
  });
});
