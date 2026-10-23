// Sample NIMs of this file: 9986200100 to 9986200199.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { dormInSql } from "@/dorms/resident-condition";
import { addTestStudent } from "@/dorms/test-records";
import { STARTING_LIMITS } from "@/health-notes/fitness-ids";
import { addTestNote, type TestNote } from "@/health-notes/test-health";
import {
  type FitnessFilter,
  type FitnessParams,
  START_PARAMS,
} from "./fitness-address";
import { readFitnessList, readFitnessNumbers } from "./fitness-board";
import { fitnessVisibleTo, healthReadableTo } from "./fitness-readers";
import { dormCohortsOn } from "./health-subject";
import {
  addTestActor,
  addTestGroup,
  addTestScores,
  addTestStudents,
} from "./test-fitness";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-16";

/**
 * Program A, the program of the Ketua Program Studi, with A1 to A3 and a
 * Non aktif A4, and program B with B1 and B2. A1 and A2 are in the group
 * of the Pengasuh, B1 and B2 in another. A1 has 90 this year, A2 60 last
 * year, and B1 40 then a correction of 75 saved later with an earlier
 * test day. A3 and B2 are not tested.
 */
async function addBoard(db: Database) {
  const kepala = await addTestActor(db, "Kepala Uji Jasmani", ["head_of_unit"]);
  const a = await addTestStudents(db, "Prodi Uji Jasmani A", [
    "9986200101",
    "9986200102",
    "9986200103",
    "9986200104",
  ]);
  const b = await addTestStudents(db, "Prodi Uji Jasmani B", [
    "9986200111",
    "9986200112",
  ]);
  const [a1 = "", a2 = "", a3 = "", a4 = ""] = a.studentIds;
  const [b1 = "", b2 = ""] = b.studentIds;
  await db
    .update(students)
    .set({ status: "inactive" })
    .where(eq(students.id, a4));
  const mentor = await addTestActor(db, "Pengasuh Uji Jasmani", ["mentor"]);
  const other = await addTestActor(db, "Pengasuh Lain Uji Jasmani", ["mentor"]);
  const groupA = await addTestGroup(db, a.programId, [a1, a2, a4], {
    mentorId: mentor.id,
  });
  const groupB = await addTestGroup(db, b.programId, [b1, b2], {
    mentorId: other.id,
  });
  await addTestScores(db, kepala, {
    groupId: groupA,
    testedOn: "2025-11-20",
    enteredAt: new Date("2025-11-20T03:00:00Z"),
    scores: [{ studentId: a2, score: 60 }],
  });
  await addTestScores(db, kepala, {
    groupId: groupA,
    testedOn: "2026-10-01",
    enteredAt: new Date("2026-10-01T03:00:00Z"),
    scores: [
      { studentId: a1, score: 90 },
      { studentId: a4, score: 30 },
    ],
  });
  await addTestScores(db, kepala, {
    groupId: groupB,
    testedOn: "2026-10-10",
    enteredAt: new Date("2026-10-10T03:00:00Z"),
    scores: [{ studentId: b1, score: 40 }],
  });
  await addTestScores(db, kepala, {
    groupId: groupB,
    testedOn: "2026-10-01",
    enteredAt: new Date("2026-10-12T03:00:00Z"),
    scores: [{ studentId: b1, score: 75 }],
  });
  const head = await addTestActor(db, "Kaprodi Uji Jasmani", [
    "head_of_program",
  ]);
  return {
    kepala,
    head: { ...head, studyProgramId: a.programId },
    mentor,
    other,
    programA: a.programId,
    ids: { a1, a2, a3, b1, b2 },
  };
}

function idsOf(list: { rows: { id: string }[] }): string[] {
  return list.rows.map((row) => row.id);
}

describe("readFitnessNumbers", () => {
  it("counts every Aktif student for Kepala Unit by the latest score, the correction saved last among them", async () => {
    await inTestDatabase(async (db) => {
      const { kepala } = await addBoard(db);

      const numbers = await readFitnessNumbers(
        db,
        fitnessVisibleTo(kepala),
        STARTING_LIMITS,
        TODAY,
      );

      expect(numbers).toEqual({
        students: 5,
        testedThisYear: 2,
        meanScore: 75,
        byCategory: { excellent: 1, good: 1, attention: 1, medical: 0 },
        untested: 2,
      });
    });
  });

  it("works the categories out again with new limits: with Baik from 76, 75 is Perlu perhatian", async () => {
    await inTestDatabase(async (db) => {
      const { kepala } = await addBoard(db);

      const numbers = await readFitnessNumbers(
        db,
        fitnessVisibleTo(kepala),
        { ...STARTING_LIMITS, goodFrom: 76 },
        TODAY,
      );

      expect(numbers.byCategory).toEqual({
        excellent: 1,
        good: 0,
        attention: 2,
        medical: 0,
      });
    });
  });

  it("counts only the own program for Ketua Program Studi", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addBoard(db);

      const numbers = await readFitnessNumbers(
        db,
        fitnessVisibleTo(head),
        STARTING_LIMITS,
        TODAY,
      );

      expect(numbers.students).toBe(3);
      expect(numbers.byCategory).toEqual({
        excellent: 1,
        good: 0,
        attention: 1,
        medical: 0,
      });
    });
  });
});

describe("readFitnessList", () => {
  it("shows Kepala Unit every Aktif student, the lowest score first and Belum dites last", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addBoard(db);

      const list = await readFitnessList(
        db,
        fitnessVisibleTo(kepala),
        STARTING_LIMITS,
        START_PARAMS,
      );

      expect(idsOf(list)).toEqual([ids.a2, ids.b1, ids.a1, ids.b2, ids.a3]);
      expect(list.matching).toBe(5);
      expect(list.rows[1]).toEqual({
        id: ids.b1,
        name: "Mahasiswa Uji Jasmani 1",
        nim: "9986200111",
        program: "Prodi Uji Jasmani B",
        latest: { score: 75, testedOn: "2026-10-01" },
        final: { category: "good", fromNote: false },
        health: null,
      });
      expect(list.rows[3]?.latest).toBeNull();
    });
  });

  it("narrows to a category with the limits in force, and to Belum dites", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addBoard(db);
      const visible = fitnessVisibleTo(kepala);

      const good = await readFitnessList(db, visible, STARTING_LIMITS, {
        ...START_PARAMS,
        filter: "good",
      });
      const stricter = await readFitnessList(
        db,
        visible,
        { ...STARTING_LIMITS, goodFrom: 76 },
        { ...START_PARAMS, filter: "attention" },
      );
      const untested = await readFitnessList(db, visible, STARTING_LIMITS, {
        ...START_PARAMS,
        filter: "untested",
      });

      expect(idsOf(good)).toEqual([ids.b1]);
      expect(idsOf(stricter)).toEqual([ids.a2, ids.b1]);
      expect(idsOf(untested)).toEqual([ids.b2, ids.a3]);
    });
  });

  it("finds a student by NIM", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addBoard(db);

      const list = await readFitnessList(
        db,
        fitnessVisibleTo(kepala),
        STARTING_LIMITS,
        { ...START_PARAMS, query: "9986200112" },
      );

      expect(idsOf(list)).toEqual([ids.b2]);
    });
  });

  it("shows Ketua Program Studi only the students of their own program", async () => {
    await inTestDatabase(async (db) => {
      const { head, ids } = await addBoard(db);

      const list = await readFitnessList(
        db,
        fitnessVisibleTo(head),
        STARTING_LIMITS,
        START_PARAMS,
      );

      expect(idsOf(list)).toEqual([ids.a2, ids.a1, ids.a3]);
    });
  });

  it("shows Pengasuh only the Aktif members of the groups they hold", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, ids } = await addBoard(db);

      const list = await readFitnessList(
        db,
        fitnessVisibleTo(mentor),
        STARTING_LIMITS,
        START_PARAMS,
      );

      expect(idsOf(list)).toEqual([ids.a2, ids.a1]);
    });
  });

  it("shows a student and Konselor nobody, not even the student themselves", async () => {
    await inTestDatabase(async (db) => {
      const { ids } = await addBoard(db);
      const student = await addTestActor(db, "Mahasiswa Uji Jasmani", [
        "student",
      ]);
      const counsellor = await addTestActor(db, "Konselor Uji Jasmani", [
        "counsellor",
      ]);

      for (const account of [{ ...student, studentId: ids.a1 }, counsellor]) {
        const visible = fitnessVisibleTo(account);
        const list = await readFitnessList(
          db,
          visible,
          STARTING_LIMITS,
          START_PARAMS,
        );
        const numbers = await readFitnessNumbers(
          db,
          visible,
          STARTING_LIMITS,
          TODAY,
        );
        expect(list.rows).toEqual([]);
        expect(numbers.students).toBe(0);
      }
    });
  });

  it("shows 25 students a page", async () => {
    await inTestDatabase(async (db) => {
      const { kepala } = await addBoard(db);
      const { programId } = await addTestStudents(db, "Prodi Uji Jasmani C", [
        "9986200121",
      ]);
      for (let place = 22; place <= 42; place += 1) {
        await addTestStudent(db, programId, {
          nim: `99862001${place}`,
          name: `Mahasiswa Uji Jasmani C${place}`,
        });
      }

      const first = await readFitnessList(
        db,
        fitnessVisibleTo(kepala),
        STARTING_LIMITS,
        START_PARAMS,
      );
      const second = await readFitnessList(
        db,
        fitnessVisibleTo(kepala),
        STARTING_LIMITS,
        { ...START_PARAMS, page: 2 },
      );

      expect(first.matching).toBe(27);
      expect(first.rows).toHaveLength(25);
      expect(second.rows).toHaveLength(2);
      expect(second.page).toBe(2);
    });
  });
});

/**
 * The board with health notes: A1 (90, Prima) has a note "Perlu
 * perhatian" saved after an earlier "Baik"; B1 (75, Baik) a note "Baik";
 * A3 (no test) a note "Perlu perhatian"; B2 (no test) a note that
 * follows the test.
 */
async function addBoardWithNotes(db: Database) {
  const board = await addBoard(db);
  const { kepala, ids } = board;
  const note = (studentId: string, savedOn: string, more: Partial<TestNote>) =>
    addTestNote(db, kepala, {
      studentId,
      savedAt: new Date(`${savedOn}T03:00:00Z`),
      ...more,
    });
  await note(ids.a1, "2026-10-01", { category: "good", advice: "Lama." });
  await note(ids.a1, "2026-10-12", {
    category: "attention",
    illnesses: [{ illness: "asthma", note: "sejak SMP" }],
    advice: "Rahasia A1.",
  });
  await note(ids.b1, "2026-10-12", { category: "good", advice: "Rahasia B1." });
  await note(ids.a3, "2026-10-12", {
    category: "attention",
    advice: "Rahasia A3.",
  });
  await note(ids.b2, "2026-10-12", { category: null, advice: "Rahasia B2." });
  return board;
}

describe("the final category on the tab", () => {
  it("counts each student in the more serious of the test and the latest note", async () => {
    await inTestDatabase(async (db) => {
      const { kepala } = await addBoardWithNotes(db);

      const numbers = await readFitnessNumbers(
        db,
        fitnessVisibleTo(kepala),
        STARTING_LIMITS,
        TODAY,
      );

      expect(numbers.byCategory).toEqual({
        excellent: 0,
        good: 1,
        attention: 3,
        medical: 0,
      });
      expect(numbers.untested).toBe(2);
    });
  });

  it("lists the most serious final category first, then the lowest score, and marks a category from a note", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addBoardWithNotes(db);

      const list = await readFitnessList(
        db,
        fitnessVisibleTo(kepala),
        STARTING_LIMITS,
        START_PARAMS,
        healthReadableTo(kepala, []),
      );

      expect(idsOf(list)).toEqual([ids.a2, ids.a1, ids.a3, ids.b1, ids.b2]);
      const a1 = list.rows[1];
      expect(a1?.final).toEqual({ category: "attention", fromNote: true });
      expect(a1?.health?.note?.advice).toBe("Rahasia A1.");
      expect(a1?.health?.note?.illnesses).toEqual([
        { illness: "asthma", note: "sejak SMP" },
      ]);
      expect(list.rows[0]?.health).toEqual({ note: null });
      expect(list.rows[3]?.final).toEqual({
        category: "good",
        fromNote: false,
      });
    });
  });

  it("narrows by the final category", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addBoardWithNotes(db);
      const read = (filter: FitnessFilter) =>
        readFitnessList(
          db,
          fitnessVisibleTo(kepala),
          STARTING_LIMITS,
          { ...START_PARAMS, filter },
          healthReadableTo(kepala, []),
        );

      expect(idsOf(await read("attention"))).toEqual([ids.a2, ids.a1, ids.a3]);
      expect(idsOf(await read("excellent"))).toEqual([]);
    });
  });

  it("narrows Belum dites to every student with no test, a note with a category among them, as the line under Kategori counts them", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, ids } = await addBoardWithNotes(db);
      const visible = fitnessVisibleTo(kepala);

      const untested = await readFitnessList(
        db,
        visible,
        STARTING_LIMITS,
        { ...START_PARAMS, filter: "untested" },
        healthReadableTo(kepala, []),
      );
      const numbers = await readFitnessNumbers(
        db,
        visible,
        STARTING_LIMITS,
        TODAY,
      );

      expect(idsOf(untested)).toEqual([ids.a3, ids.b2]);
      expect(untested.matching).toBe(numbers.untested);
    });
  });

  it.each<RoleId>(["director", "head_of_program"])(
    "gives %s the category only: no note, no mark, and no note text sent",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { programA, ids } = await addBoardWithNotes(db);
        const actor = await addTestActor(db, "Pimpinan Uji Jasmani", [role], {
          studyProgramId: programA,
        });

        const list = await readFitnessList(
          db,
          fitnessVisibleTo(actor),
          STARTING_LIMITS,
          START_PARAMS,
          healthReadableTo(actor, []),
        );

        const a1 = list.rows.find((row) => row.id === ids.a1);
        expect(a1?.final).toEqual({ category: "attention", fromNote: false });
        for (const row of list.rows) expect(row.health).toBeNull();
        expect(JSON.stringify(list)).not.toContain("Rahasia");
      });
    },
  );

  it("gives a Ketua Program Studi who is also Pengasuh the notes of their own mentees only", async () => {
    await inTestDatabase(async (db) => {
      const { other, programA, ids } = await addBoardWithNotes(db);
      const roles: RoleId[] = ["head_of_program", "mentor"];
      const both = { ...other, roles, studyProgramId: programA };

      const list = await readFitnessList(
        db,
        fitnessVisibleTo(both),
        STARTING_LIMITS,
        START_PARAMS,
        healthReadableTo(both, []),
      );

      const byId = new Map(list.rows.map((row) => [row.id, row]));
      expect(byId.get(ids.a1)?.health).toBeNull();
      expect(byId.get(ids.a1)?.final.fromNote).toBe(false);
      expect(byId.get(ids.b1)?.health?.note?.advice).toBe("Rahasia B1.");
      expect(JSON.stringify(list)).not.toContain("Rahasia A");
    });
  });
});

/**
 * The board with notes and two Pembibitan students of program A, who live
 * in Wismantara whether a period runs or not: R1, a mentee of the
 * Pengasuh, tested at 90 with a later note "Perlu perhatian", and R2, of
 * no Pengasuh, with a note "Baik". Penilai Mahasiswa is added too.
 */
async function addBoardWithResidents(db: Database) {
  const board = await addBoardWithNotes(db);
  const { kepala, mentor, programA } = board;
  const resident = (nim: string, name: string) =>
    addTestStudent(db, programA, { nim, name, isSeedling: true });
  const r1 = await resident("9986200131", "Mahasiswa Uji Asrama 1");
  const r2 = await resident("9986200132", "Mahasiswa Uji Asrama 2");
  const groupR = await addTestGroup(db, programA, [r1], {
    mentorId: mentor.id,
    number: 2,
  });
  await addTestScores(db, kepala, {
    groupId: groupR,
    testedOn: "2026-10-01",
    enteredAt: new Date("2026-10-01T03:00:00Z"),
    scores: [{ studentId: r1, score: 90 }],
  });
  await addTestNote(db, kepala, {
    studentId: r1,
    savedAt: new Date("2026-10-12T03:00:00Z"),
    category: "attention",
    illnesses: [{ illness: "asthma", note: "sejak kecil" }],
    advice: "Asrama R1.",
  });
  await addTestNote(db, kepala, {
    studentId: r2,
    savedAt: new Date("2026-10-12T03:00:00Z"),
    category: "good",
    advice: "Asrama R2.",
  });
  const penilai = await addTestActor(db, "Penilai Uji Jasmani", ["assessor"]);
  const cohorts = await dormCohortsOn(db, TODAY);
  const residents = await db
    .select({ id: students.id })
    .from(students)
    .where(sql`${dormInSql(cohorts)} is not null`);
  return {
    ...board,
    penilai,
    cohorts,
    residentIds: residents.map((row) => row.id),
    ids: { ...board.ids, r1, r2 },
  };
}

describe("a dorm resident's note on the tab", () => {
  it("gives Penilai Mahasiswa a resident's category only, and the note of a student outside the dorm", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, cohorts, residentIds, ids } =
        await addBoardWithResidents(db);
      expect(residentIds).toEqual(expect.arrayContaining([ids.r1, ids.r2]));
      expect(residentIds).not.toContain(ids.a1);

      const list = await readFitnessList(
        db,
        fitnessVisibleTo(penilai),
        STARTING_LIMITS,
        START_PARAMS,
        healthReadableTo(penilai, cohorts),
      );

      const byId = new Map(list.rows.map((row) => [row.id, row]));
      expect(byId.get(ids.r1)?.final).toEqual({
        category: "attention",
        fromNote: false,
      });
      expect(byId.get(ids.r1)?.health).toBeNull();
      expect(byId.get(ids.r2)?.final.category).toBe("good");
      expect(byId.get(ids.r2)?.health).toBeNull();
      expect(byId.get(ids.a1)?.final).toEqual({
        category: "attention",
        fromNote: true,
      });
      expect(byId.get(ids.a1)?.health?.note?.advice).toBe("Rahasia A1.");
      expect(JSON.stringify(list)).not.toContain("Asrama R");
      expect(JSON.stringify(list)).not.toContain("sejak kecil");
    });
  });

  it("sends Penilai Mahasiswa no resident's note text by search, filter or page", async () => {
    await inTestDatabase(async (db) => {
      const { penilai, cohorts, ids } = await addBoardWithResidents(db);
      const read = (params: Partial<FitnessParams>) =>
        readFitnessList(
          db,
          fitnessVisibleTo(penilai),
          STARTING_LIMITS,
          { ...START_PARAMS, ...params },
          healthReadableTo(penilai, cohorts),
        );

      const asked = [
        await read({ query: "9986200131" }),
        await read({ query: "Uji Asrama" }),
        await read({ filter: "attention" }),
        await read({ filter: "good" }),
        await read({ query: "9986200131", filter: "attention", page: 1 }),
        await read({ page: 2 }),
      ];

      expect(idsOf(asked[0] ?? { rows: [] })).toEqual([ids.r1]);
      expect(idsOf(asked[2] ?? { rows: [] })).toContain(ids.r1);
      expect(idsOf(asked[3] ?? { rows: [] })).toContain(ids.r2);
      for (const list of asked) {
        expect(JSON.stringify(list)).not.toContain("Asrama R");
      }
    });
  });

  it("gives Kepala Unit a resident's note, and Pengasuh that of an own mentee", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, mentor, cohorts, ids } = await addBoardWithResidents(db);
      const read = (account: typeof kepala) =>
        readFitnessList(
          db,
          fitnessVisibleTo(account),
          STARTING_LIMITS,
          START_PARAMS,
          healthReadableTo(account, cohorts),
        );

      const forKepala = new Map(
        (await read(kepala)).rows.map((row) => [row.id, row]),
      );
      const forMentor = new Map(
        (await read(mentor)).rows.map((row) => [row.id, row]),
      );

      expect(forKepala.get(ids.r1)?.final.fromNote).toBe(true);
      expect(forKepala.get(ids.r1)?.health?.note?.illnesses).toEqual([
        { illness: "asthma", note: "sejak kecil" },
      ]);
      expect(forKepala.get(ids.r2)?.health?.note?.advice).toBe("Asrama R2.");
      expect(forMentor.get(ids.r1)?.health?.note?.advice).toBe("Asrama R1.");
    });
  });

  it("gives Penilai Mahasiswa who is also Pengasuh the notes of their own resident mentees only", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, cohorts, ids } = await addBoardWithResidents(db);
      const roles: RoleId[] = ["assessor", "mentor"];
      const both = { ...mentor, roles };

      const list = await readFitnessList(
        db,
        fitnessVisibleTo(both),
        STARTING_LIMITS,
        START_PARAMS,
        healthReadableTo(both, cohorts),
      );

      const byId = new Map(list.rows.map((row) => [row.id, row]));
      expect(byId.get(ids.r1)?.health?.note?.advice).toBe("Asrama R1.");
      expect(byId.get(ids.r2)?.final.category).toBe("good");
      expect(byId.get(ids.r2)?.health).toBeNull();
      expect(byId.get(ids.b1)?.health?.note?.advice).toBe("Rahasia B1.");
      expect(JSON.stringify(list)).not.toContain("Asrama R2.");
    });
  });
});
