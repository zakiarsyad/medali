// Sample Tahun akademik of this file: 2720 to 2720.
import { and, asc, eq, type SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { activityScheduleParticipants, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  type CandidateStudent,
  isChosen,
  type ParticipantChoice,
  takesPart,
} from "./chosen-participants";
import {
  chosenBy,
  readParticipantChoices,
  takingPartIn,
} from "./chosen-students";
import {
  addTestActivity,
  addTestActor,
  addTestPeriods,
  addTestProgram,
  addTestSchedule,
  addTestStudents,
} from "./test-records";

/*
 * This file's own sample values: the Tahun akademik 2720, the program
 * UJIPESERTAPILIH and the NIMs 9974500000 to 9974500099.
 */

const inTestDatabase = withTestDatabase();

interface Records {
  programId: number;
  /** The key of each stored student, by NIM. */
  idsByNim: Map<string, string>;
  /** The key of a schedule of each kind of choice, with its choice. */
  schedules: { id: string; choice: ParticipantChoice }[];
}

async function addStudents(db: Database, programId: number) {
  await addTestStudents(db, programId, [
    {
      nim: "9974500001",
      name: "Uji Pilih Satu",
      cohortYear: 2720,
      className: "U-01",
    },
    {
      nim: "9974500002",
      name: "Uji Pilih Dua",
      cohortYear: 2720,
      className: "U-02",
    },
    {
      nim: "9974500003",
      name: "Uji Pilih Tiga",
      cohortYear: 2719,
      className: "U-01",
      status: "inactive",
    },
    {
      nim: "9974500004",
      name: "Uji Pilih Empat",
      cohortYear: 2719,
      className: null,
    },
    {
      nim: "9974500005",
      name: "Uji Pilih Lima",
      cohortYear: 2719,
      className: "U-01",
      status: "on_leave",
    },
    {
      nim: "9974500006",
      name: "Uji Pilih Enam",
      cohortYear: 2720,
      className: "U-01",
      deletedAt: new Date(),
    },
  ]);
}

async function addRecords(db: Database): Promise<Records> {
  const staff = await addTestActor(db, "Pegawai Uji Peserta Pilih", [
    "upk_staff",
  ]);
  const activityId = await addTestActivity(db, staff.id, { semester: null });
  const periods = await addTestPeriods(db, 2720);
  const programId = await addTestProgram(db, "UJIPESERTAPILIH");
  await addStudents(db, programId);
  const stored = await db
    .select({ id: students.id, nim: students.nim })
    .from(students)
    .where(eq(students.studyProgramId, programId));
  const idsByNim = new Map(stored.map(({ id, nim }) => [nim, id]));
  // In the order they are read back in.
  const chosenIds = ["9974500001", "9974500003"]
    .map((nim) => idsByNim.get(nim) ?? "")
    .sort();
  const choices: ParticipantChoice[] = [
    { kind: "students", studentIds: chosenIds },
    { kind: "classes", classNames: ["U-01"] },
    { kind: "cohorts", cohortYears: [2719, 2720] },
  ];
  const schedules: Records["schedules"] = [];
  for (const choice of choices) {
    const id = await addTestSchedule(db, {
      activityId,
      academicPeriodId: periods.oddId,
      changedBy: staff.id,
      startsOn: "2720-09-10",
    });
    await db.insert(activityScheduleParticipants).values(rowsOf(id, choice));
    schedules.push({ id, choice });
  }
  return { programId, idsByNim, schedules };
}

function rowsOf(scheduleId: string, choice: ParticipantChoice) {
  switch (choice.kind) {
    case "students":
      return choice.studentIds.map((studentId) => ({ scheduleId, studentId }));
    case "classes":
      return choice.classNames.map((className) => ({ scheduleId, className }));
    case "cohorts":
      return choice.cohortYears.map((cohortYear) => ({
        scheduleId,
        cohortYear,
      }));
  }
}

/** The students of this file, as the rule reads them, with their NIM. */
async function candidates(
  db: Database,
  programId: number,
): Promise<(CandidateStudent & { nim: string })[]> {
  const stored = await db
    .select()
    .from(students)
    .where(eq(students.studyProgramId, programId));
  return stored.map((student) => ({
    id: student.id,
    nim: student.nim,
    className: student.className,
    cohortYear: student.cohortYear,
    isActive: student.status === "active" && student.deletedAt === null,
  }));
}

async function nimsWhere(
  db: Database,
  programId: number,
  condition: SQL,
): Promise<string[]> {
  const found = await db
    .select({ nim: students.nim })
    .from(students)
    .where(and(eq(students.studyProgramId, programId), condition))
    .orderBy(asc(students.nim));
  return found.map(({ nim }) => nim);
}

describe("takingPartIn", () => {
  it("finds in the database the students the rule lets take part, for every kind of choice", async () => {
    await inTestDatabase(async (db) => {
      const { programId, schedules } = await addRecords(db);
      const all = await candidates(db, programId);

      for (const { id, choice } of schedules) {
        const expected = all
          .filter((student) => takesPart(student, choice))
          .map(({ nim }) => nim)
          .sort();

        expect(await nimsWhere(db, programId, takingPartIn(id))).toEqual(
          expected,
        );
      }
    });
  });

  it("counts only Aktif students: those chosen who are Non aktif, on Cuti or removed are left out", async () => {
    await inTestDatabase(async (db) => {
      const { programId, schedules } = await addRecords(db);
      const [byStudent, byClass, byCohort] = schedules;

      expect(
        await nimsWhere(db, programId, takingPartIn(byStudent?.id ?? "")),
      ).toEqual(["9974500001"]);
      expect(
        await nimsWhere(db, programId, takingPartIn(byClass?.id ?? "")),
      ).toEqual(["9974500001"]);
      expect(
        await nimsWhere(db, programId, takingPartIn(byCohort?.id ?? "")),
      ).toEqual(["9974500001", "9974500002", "9974500004"]);
    });
  });
});

describe("chosenBy", () => {
  it("finds the students a choice names, whatever their status, as the rule does", async () => {
    await inTestDatabase(async (db) => {
      const { programId, schedules } = await addRecords(db);
      const all = await candidates(db, programId);

      for (const { id, choice } of schedules) {
        const expected = all
          .filter((student) => isChosen(student, choice))
          .map(({ nim }) => nim)
          .sort();

        expect(await nimsWhere(db, programId, chosenBy(id))).toEqual(expected);
      }
      const [byStudent] = schedules;
      expect(
        await nimsWhere(db, programId, chosenBy(byStudent?.id ?? "")),
      ).toEqual(["9974500001", "9974500003"]);
    });
  });
});

describe("readParticipantChoices", () => {
  it("gives back the choice each schedule was stored with", async () => {
    await inTestDatabase(async (db) => {
      const { schedules } = await addRecords(db);

      const read = await readParticipantChoices(
        db,
        schedules.map(({ id }) => id),
      );

      for (const { id, choice } of schedules) {
        expect(read.get(id)).toEqual(choice);
      }
    });
  });

  it("reads nothing for no schedule", async () => {
    await inTestDatabase(async (db) => {
      expect((await readParticipantChoices(db, [])).size).toBe(0);
    });
  });
});
