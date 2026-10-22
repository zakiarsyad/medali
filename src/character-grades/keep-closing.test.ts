// Sample Tahun akademik of this file: 5120 to 5120.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  fixedCharacterGrades,
  semesterClosings,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestActor,
  addTestProgram,
  addTestStudentAccount,
} from "@/features/activities/test-records";
import { sourceFilesEndingWith } from "@/ui/source-files";
import type { GradeRow } from "./grade-list";
import { keepClosing } from "./keep-closing";
import { STARTING_SCHEME } from "./scheme-ids";

/*
 * This file's own sample values: the Tahun akademik 5120, the program
 * UJISIMPANTUTUP, and the NIMs 9951320000 to 9951320099.
 */

const inTestDatabase = withTestDatabase();

async function addRecords(db: Database) {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 5120,
      term: "odd",
      startsOn: "5120-08-01",
      endsOn: "5121-01-31",
    })
    .returning();
  if (!period) throw new Error("The period was not added.");
  const programId = await addTestProgram(db, "UJISIMPANTUTUP");
  const student = (nim: string) =>
    addTestStudentAccount(db, programId, {
      nim,
      name: `Mahasiswa Uji Simpan ${nim}`,
      cohortYear: 5119,
    });
  const ani = await student("9951320001");
  const budi = await student("9951320002");
  const kepala = await addTestActor(db, "Kepala Uji Simpan Tutup", [
    "head_of_unit",
  ]);
  return { periodId: period.id, ani, budi, kepala };
}

function row(studentId: string, more: Partial<GradeRow> = {}): GradeRow {
  return {
    student: { id: studentId, name: "-", nim: "-", program: "-" },
    attendance: { percent: 90, attended: 9, counted: 10 },
    mentoring: 80,
    siku: { score: 66, adjusted: true, note: "SIKU 65 +1" },
    skpm: 72,
    grade: { complete: true, final: 77, letter: "B", passes: true },
    limited: false,
    ...more,
  };
}

describe("keepClosing", () => {
  it("keeps the closing with the scheme and every grade", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);

      const counts = await keepClosing(db, {
        periodId: records.periodId,
        closedBy: records.kepala.id,
        scheme: STARTING_SCHEME,
        rows: [
          row(records.ani.studentId),
          row(records.budi.studentId, {
            mentoring: null,
            grade: { complete: false },
          }),
        ],
      });

      expect(counts).toEqual({ students: 2, complete: 1, incomplete: 1 });
      const [closing] = await db.select().from(semesterClosings);
      expect(closing).toMatchObject({
        attendanceWeight: 25,
        mentoringWeight: 25,
        sikuWeight: 25,
        skpmWeight: 25,
        aFrom: 85,
        bFrom: 70,
        cFrom: 60,
        dFrom: 50,
        passLetter: "B",
      });
      expect(await db.select().from(fixedCharacterGrades)).toHaveLength(2);
    });
  });

  it("keeps nothing when one grade cannot be kept", async () => {
    await inTestDatabase(async (db) => {
      const records = await addRecords(db);
      // A score before the limit on a grade that is not limited is refused.
      const broken = row(records.budi.studentId, {
        grade: {
          complete: true,
          final: 70,
          letter: "B",
          passes: true,
          limitedFrom: 77,
        },
      });

      await expect(
        db.transaction((tx) =>
          keepClosing(tx, {
            periodId: records.periodId,
            closedBy: records.kepala.id,
            scheme: STARTING_SCHEME,
            rows: [row(records.ani.studentId), broken],
          }),
        ),
      ).rejects.toThrow();

      expect(await db.select().from(semesterClosings)).toEqual([]);
      expect(await db.select().from(fixedCharacterGrades)).toEqual([]);
    });
  });
});

const WRITES_FIXED_GRADES =
  /\.(?:insert|update|delete)\(\s*(?:fixedCharacterGrades|semesterClosings)\b/;

describe("what writes a closing or a fixed grade", () => {
  it("is only the closing itself: no other code adds, changes or deletes one", () => {
    const writers = [
      ...sourceFilesEndingWith(".ts"),
      ...sourceFilesEndingWith(".tsx"),
    ]
      .filter((path) => !/\.test\.tsx?$/.test(path))
      .filter((path) => WRITES_FIXED_GRADES.test(readFileSync(path, "utf8")));

    expect(writers).toEqual(["src/character-grades/keep-closing.ts"]);
  });
});
