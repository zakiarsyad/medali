// Sample Tahun akademik of this file: 2460 to 2460.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { studentSemester } from "@/academic-periods/student-semester";
import type { Database } from "@/db/connect";
import { academicPeriods, dormCompanions, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readDormCohorts } from "./dorm-cohorts";
import {
  dormInSql,
  livesIn,
  takesRoomIn,
  usualDormInSql,
} from "./resident-condition";
import { dormOf } from "./resident-rule";
import { addTestProgram, addTestStudent } from "./test-records";

const inTestDatabase = withTestDatabase();

/** The period the checks run in: angkatan 2460 is in semester 1. */
const ODD_2460 = {
  startYear: 2460,
  term: "odd",
  startsOn: "2460-08-01",
  endsOn: "2461-01-31",
} as const;
const DAY = "2460-10-12";

const STATUSES = ["active", "on_leave", "inactive"] as const;
const PATHS = ["regular", "transfer"] as const;
const SEXES = ["female", "male"] as const;
const COHORTS = [2460, 2459, 2457];
const YES_NO = [false, true];

/** The dorm a kakak pendamping of each jenis kelamin serves. */
function servedBy(sex: "female" | "male"): "dana_rakca" | "cipta_bakti" {
  return sex === "female" ? "dana_rakca" : "cipta_bakti";
}

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
      await db.insert(academicPeriods).values(ODD_2460);
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      await addTestStudent(db, program, {
        nim: "9922260001",
        name: "Uji A",
        cohortYear: 2460,
      });
      await addTestStudent(db, program, {
        nim: "9922250001",
        name: "Uji B",
        cohortYear: 2459,
      });

      const cohorts = await readDormCohorts(db, DAY);

      expect(cohorts).toContain(2460);
      expect(cohorts).not.toContain(2459);
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
      await db.insert(academicPeriods).values(ODD_2460);
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
        const semester = studentSemester(student.cohortYear, ODD_2460);
        expect(dorm).toBe(dormOf(student, semester, null));
      }
    });
  });

  it("gives every kind of kakak pendamping the dorm the rule gives", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2460);
      const studyProgramId = await addTestProgram(db, "Prodi Uji Asrama B");
      const kinds = everyKindOfStudent();
      const added = await db
        .insert(students)
        .values(kinds.map((kind) => ({ ...kind, studyProgramId })))
        .returning();
      // Every other one Aktif: a duty stopped with Nonaktifkan counts not.
      const duties = added.map((student, place) => ({
        studentId: student.id,
        dorm: servedBy(student.sex),
        isActive: place % 2 === 0,
      }));
      await db.insert(dormCompanions).values(duties);
      const cohorts = (await readDormCohorts(db, DAY)) ?? [];

      const rows = await db
        .select({
          student: students,
          isActive: dormCompanions.isActive,
          dorm: dormInSql(cohorts),
        })
        .from(students)
        .innerJoin(dormCompanions, eq(dormCompanions.studentId, students.id))
        .where(eq(students.studyProgramId, studyProgramId));

      expect(rows).toHaveLength(kinds.length);
      for (const { student, isActive, dorm } of rows) {
        const semester = studentSemester(student.cohortYear, ODD_2460);
        const served = isActive ? servedBy(student.sex) : null;
        expect(dorm).toBe(dormOf(student, semester, served));
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

/** A Reguler woman of semester 3, who lives in no dorm by the usual rule. */
async function addSenior(db: Database, program: number, nim: string) {
  return addTestStudent(db, program, {
    nim,
    name: "Uji Kakak",
    cohortYear: 2025,
  });
}

async function dormsOf(db: Database, id: string) {
  const [row] = await db
    .select({
      dorm: dormInSql([2026]),
      usual: usualDormInSql([2026]),
      livesThere: livesIn("dana_rakca", [2026]),
      takesRoom: sql`coalesce(${takesRoomIn("dana_rakca", [2026])}, false)`,
    })
    .from(students)
    .where(eq(students.id, id));
  return row;
}

describe("a kakak pendamping", () => {
  it("lives in the dorm they serve while the duty is Aktif, but takes no place in its rooms as a resident", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      const id = await addSenior(db, program, "9922260101");
      await db
        .insert(dormCompanions)
        .values({ studentId: id, dorm: "dana_rakca" });

      expect(await dormsOf(db, id)).toEqual({
        dorm: "dana_rakca",
        usual: null,
        livesThere: true,
        takesRoom: false,
      });
    });
  });

  it("who lives in Wismantara lives in the dorm they serve only", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      const id = await addTestStudent(db, program, {
        nim: "9922260102",
        name: "Uji Kakak",
        isInternational: true,
      });
      await db
        .insert(dormCompanions)
        .values({ studentId: id, dorm: "dana_rakca" });

      expect(await dormsOf(db, id)).toEqual({
        dorm: "dana_rakca",
        usual: "wismantara_putri",
        livesThere: true,
        takesRoom: false,
      });
    });
  });

  it("follows the usual rule again once the duty is stopped", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Asrama B");
      const id = await addSenior(db, program, "9922260103");
      await db
        .insert(dormCompanions)
        .values({ studentId: id, dorm: "dana_rakca", isActive: false });

      expect((await dormsOf(db, id))?.dorm).toBeNull();
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "follows the usual rule again once their status is %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const program = await addTestProgram(db, "Prodi Uji Asrama B");
        const id = await addSenior(db, program, "9922260104");
        await db
          .insert(dormCompanions)
          .values({ studentId: id, dorm: "dana_rakca" });
        await db.update(students).set({ status }).where(eq(students.id, id));

        expect((await dormsOf(db, id))?.dorm).toBeNull();
      });
    },
  );
});
