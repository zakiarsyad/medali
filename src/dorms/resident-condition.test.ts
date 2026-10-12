import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { studentSemester } from "@/academic-periods/student-semester";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestStudent,
  DAY,
  ODD_2026,
} from "@/features/dorm/test-records";
import { readDormCohorts } from "./dorm-cohorts";
import { dormInSql, livesIn } from "./resident-condition";
import { dormOf } from "./resident-rule";

const inTestDatabase = withTestDatabase();

const STATUSES = ["active", "on_leave", "inactive"] as const;
const PATHS = ["regular", "transfer"] as const;
const SEXES = ["female", "male"] as const;
const COHORTS = [2026, 2025, 2023];
const YES_NO = [false, true];

type NewStudent = Omit<typeof students.$inferInsert, "studyProgramId">;

/** One student for every mix of what the rule looks at. */
function everyKindOfStudent(): NewStudent[] {
  const kinds: NewStudent[] = [];
  for (const status of STATUSES) {
    for (const entryPath of PATHS) {
      for (const sex of SEXES) {
        for (const cohortYear of COHORTS) {
          for (const isInternational of YES_NO) {
            for (const isSeedling of YES_NO) {
              const place = String(kinds.length).padStart(4, "0");
              kinds.push({
                nim: `992226${place}`,
                name: `Mahasiswa Uji ${place}`,
                status,
                entryPath,
                sex,
                cohortYear,
                isInternational,
                isSeedling,
              });
            }
          }
        }
      }
    }
  }
  return kinds;
}

describe("readDormCohorts", () => {
  it("gives the angkatan in semester 1 or 2 of the running period", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      await addTestStudent(db, program, { nim: "9922260001", name: "Uji A" });
      await addTestStudent(db, program, {
        nim: "9922250001",
        name: "Uji B",
        cohortYear: 2025,
      });

      const cohorts = await readDormCohorts(db, DAY);

      expect(cohorts).toContain(2026);
      expect(cohorts).not.toContain(2025);
    });
  });

  it("gives null, not an empty list, when no period runs", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      await addTestStudent(db, program, { nim: "9922260001", name: "Uji A" });

      expect(await readDormCohorts(db, DAY)).toBeNull();
    });
  });
});

describe("dormInSql", () => {
  it("gives every kind of student the dorm the rule gives", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const studyProgramId = await addTestProgram(db, "Prodi Uji Asrama B");
      const kinds = everyKindOfStudent();
      await db
        .insert(students)
        .values(kinds.map((kind) => ({ ...kind, studyProgramId })));
      const cohorts = (await readDormCohorts(db, DAY)) ?? [];

      const rows = await db
        .select({ student: students, dorm: dormInSql(cohorts) })
        .from(students)
        .where(eq(students.studyProgramId, studyProgramId));

      expect(rows).toHaveLength(kinds.length);
      for (const { student, dorm } of rows) {
        const semester = studentSemester(student.cohortYear, ODD_2026);
        expect(dorm).toBe(dormOf(student, semester));
      }
    });
  });

  it("gives a removed student no dorm", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      const id = await addTestStudent(db, program, {
        nim: "9922260001",
        name: "Uji A",
        deletedAt: new Date(),
      });

      const [row] = await db
        .select({ dorm: dormInSql([2026]) })
        .from(students)
        .where(eq(students.id, id));

      expect(row?.dorm).toBeNull();
    });
  });

  it("gives a Reguler student no dorm when no angkatan lives there", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      const id = await addTestStudent(db, program, {
        nim: "9922260001",
        name: "Uji A",
      });

      const [row] = await db
        .select({ dorm: dormInSql([]) })
        .from(students)
        .where(eq(students.id, id));

      expect(row?.dorm).toBeNull();
    });
  });
});

describe("livesIn", () => {
  it("finds only the residents of the dorm asked for", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      const woman = await addTestStudent(db, program, {
        nim: "9922260001",
        name: "Uji A",
      });
      const man = await addTestStudent(db, program, {
        nim: "9922260002",
        name: "Uji B",
        sex: "male",
      });

      const found = await db
        .select({ id: students.id })
        .from(students)
        .where(livesIn("dana_rakca", [2026]));

      const ids = found.map((row) => row.id);
      expect(ids).toContain(woman);
      expect(ids).not.toContain(man);
    });
  });
});
