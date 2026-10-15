// Sample Tahun akademik of this file: 3209 to 3210.
// Sample NIMs of this file: 9985010000 to 9985010099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { START_PARAMS } from "./skpm-address";
import { readSkpmDetail, readSkpmList, readSkpmNumbers } from "./skpm-board";
import { skpmVisibleTo } from "./skpm-readers";
import {
  addTestActor,
  addTestGroup,
  addTestPeriod,
  addTestStudents,
  addTestUpload,
} from "./test-skpm";

const inTestDatabase = withTestDatabase();

const EARLY = new Date("3210-09-01T03:00:00Z");
const MIDDLE = new Date("3210-10-01T03:00:00Z");
const LATE = new Date("3210-11-01T03:00:00Z");

async function addRecords(db: Database) {
  const periodId = await addTestPeriod(db, 3210);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Data SKPM",
    3210,
    ["9985010001", "9985010002", "9985010003"],
  );
  const [ani, budi, citra] = studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji SKPM", ["assessor"]);
  const kepala = await addTestActor(db, "Kepala Uji SKPM", ["head_of_unit"]);
  return { periodId, programId, ani, budi, citra, penilai, kepala };
}

describe("Data SKPM for a role that sees every student", () => {
  it("adds up each student's rows into Kegiatan, Total poin and Nilai SKPM, the most points first and Belum ada data last", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, budi, citra, penilai } = await addRecords(db);
      await addTestUpload(db, penilai, {
        mode: "add",
        periodId,
        enteredAt: EARLY,
        rows: [
          { studentId: ani, points: 8 },
          { studentId: ani, points: 12 },
          { studentId: ani, points: 10 },
          { studentId: budi, points: 65 },
        ],
      });
      const visible = skpmVisibleTo(penilai);

      const list = await readSkpmList(db, visible, 50, {
        ...START_PARAMS,
        query: "Uji SKPM",
      });

      expect(list.matching).toBe(3);
      expect(list.rows.map((row) => [row.id, row.totals])).toEqual([
        [budi, { activities: 1, total: 65, score: 100 }],
        [ani, { activities: 3, total: 30, score: 60 }],
        [citra, null],
      ]);
    });
  });

  it("narrows the list to those with data, those without, and a search by NIM", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, budi, citra, penilai } = await addRecords(db);
      await addTestUpload(db, penilai, {
        mode: "add",
        periodId,
        enteredAt: EARLY,
        rows: [{ studentId: ani, points: 8 }],
      });
      const visible = skpmVisibleTo(penilai);
      const asked = { ...START_PARAMS, query: "99850100" };

      const withData = await readSkpmList(db, visible, 50, {
        ...asked,
        filter: "with",
      });
      const without = await readSkpmList(db, visible, 50, {
        ...asked,
        filter: "without",
      });
      const one = await readSkpmList(db, visible, 50, {
        ...START_PARAMS,
        query: "9985010002",
      });

      expect(withData.rows.map((row) => row.id)).toEqual([ani]);
      expect(without.rows.map((row) => row.id)).toEqual([budi, citra]);
      expect(one.rows.map((row) => row.id)).toEqual([budi]);
    });
  });

  it("counts nothing of a removed upload, nor of one before the latest Ganti semua data, whatever its period", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, budi, citra, penilai } = await addRecords(db);
      const earlier = await addTestPeriod(db, 3209);
      await addTestUpload(db, penilai, {
        mode: "add",
        periodId: earlier,
        enteredAt: EARLY,
        rows: [{ studentId: ani, points: 40 }],
      });
      await addTestUpload(db, penilai, {
        mode: "replace",
        periodId,
        enteredAt: MIDDLE,
        rows: [{ studentId: budi, points: 20 }],
      });
      await addTestUpload(db, penilai, {
        mode: "add",
        periodId,
        enteredAt: LATE,
        rows: [{ studentId: citra, points: 5 }],
        removed: true,
      });
      const visible = skpmVisibleTo(penilai);

      const list = await readSkpmList(db, visible, 50, {
        ...START_PARAMS,
        query: "99850100",
      });

      expect(
        list.rows.map((row) => [row.id, row.totals?.total ?? null]),
      ).toEqual([
        [budi, 20],
        [ani, null],
        [citra, null],
      ]);
    });
  });

  it("counts the uploads a removed Ganti semua data had replaced again", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, budi, penilai } = await addRecords(db);
      await addTestUpload(db, penilai, {
        mode: "add",
        periodId,
        enteredAt: EARLY,
        rows: [{ studentId: ani, points: 40 }],
      });
      await addTestUpload(db, penilai, {
        mode: "replace",
        periodId,
        enteredAt: MIDDLE,
        rows: [{ studentId: budi, points: 20 }],
        removed: true,
      });
      const visible = skpmVisibleTo(penilai);

      const list = await readSkpmList(db, visible, 50, {
        ...START_PARAMS,
        query: "99850100",
        filter: "with",
      });

      expect(list.rows.map((row) => [row.id, row.totals?.total])).toEqual([
        [ani, 40],
      ]);
    });
  });

  it("gives the four numbers of the Aktif students: with data, mean points, mean Nilai SKPM and the uploads that count", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, programId, ani, budi, kepala } = await addRecords(db);
      await addTestStudent(db, programId, {
        nim: "9985010009",
        name: "Mahasiswa Uji SKPM Cuti",
        status: "on_leave",
      });
      await addTestUpload(db, kepala, {
        mode: "add",
        periodId,
        enteredAt: EARLY,
        rows: [
          { studentId: ani, points: 30 },
          { studentId: budi, points: 17 },
        ],
      });
      const numbers = await readSkpmNumbers(
        db,
        eq(students.studyProgramId, programId),
        50,
      );

      expect(numbers).toEqual({
        students: 3,
        withData: 2,
        meanPoints: 23.5,
        meanScore: 47,
        uploads: 1,
      });
    });
  });

  it("changes every Nilai SKPM with the points for 100", async () => {
    await inTestDatabase(async (db) => {
      const { periodId, ani, penilai } = await addRecords(db);
      await addTestUpload(db, penilai, {
        mode: "add",
        periodId,
        enteredAt: EARLY,
        rows: [{ studentId: ani, points: 30 }],
      });
      const visible = skpmVisibleTo(penilai);

      const detail = await readSkpmDetail(db, visible, 40, ani);

      expect(detail?.totals).toEqual({ activities: 1, total: 30, score: 75 });
    });
  });
});

describe("Data SKPM for a role that sees only some students", () => {
  async function addTwoPrograms(db: Database) {
    const records = await addRecords(db);
    const otherProgram = await addTestProgram(db, "Prodi Uji SKPM Lain");
    const dina = await addTestStudent(db, otherProgram, {
      nim: "9985010011",
      name: "Mahasiswa Uji SKPM Lain",
      cohortYear: 3210,
    });
    await addTestUpload(db, records.penilai, {
      mode: "add",
      periodId: records.periodId,
      enteredAt: EARLY,
      rows: [
        { studentId: records.ani, points: 10 },
        { studentId: records.budi, points: 20 },
        { studentId: dina, points: 30 },
      ],
    });
    return { ...records, dina };
  }

  it("shows Ketua Program Studi only the students of their own program", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, budi, citra } = await addTwoPrograms(db);
      const kaprodi = await addTestActor(
        db,
        "Kaprodi Uji SKPM",
        ["head_of_program"],
        { studyProgramId: programId },
      );

      const list = await readSkpmList(db, skpmVisibleTo(kaprodi), 50, {
        ...START_PARAMS,
        query: "99850100",
      });

      expect(list.rows.map((row) => row.id)).toEqual([budi, ani, citra]);
    });
  });

  it("shows Pengasuh only their own mentees, and gives nothing of another group's student asked for by hand", async () => {
    await inTestDatabase(async (db) => {
      const { programId, ani, budi, dina } = await addTwoPrograms(db);
      const pengasuh = await addTestActor(db, "Pengasuh Uji SKPM", ["mentor"]);
      await addTestGroup(db, { programId, year: 3210 }, pengasuh.id, [ani]);
      const visible = skpmVisibleTo(pengasuh);

      const list = await readSkpmList(db, visible, 50, START_PARAMS);
      const numbers = await readSkpmNumbers(db, visible, 50);
      const own = await readSkpmDetail(db, visible, 50, ani);
      const other = await readSkpmDetail(db, visible, 50, budi);
      const elsewhere = await readSkpmDetail(db, visible, 50, dina);

      expect(list.rows.map((row) => row.id)).toEqual([ani]);
      expect(numbers).toMatchObject({ students: 1, withData: 1 });
      expect(own?.activities.map((row) => row.points)).toEqual([10]);
      expect(other).toBeNull();
      expect(elsewhere).toBeNull();
    });
  });

  it("gives a student nothing, as a student holds no role that opens the tab", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addTwoPrograms(db);
      const student = await addTestActor(
        db,
        "Mahasiswa Uji SKPM",
        ["student"],
        {
          studentId: ani,
        },
      );

      const detail = await readSkpmDetail(db, skpmVisibleTo(student), 50, ani);

      expect(detail).toBeNull();
    });
  });
});
