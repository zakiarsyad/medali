// Sample Tahun akademik of this file: 4420 to 4420.
// Sample NIMs of this file: 9944210000 to 9944210099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { PENALTIES_START, type PenaltiesParams } from "./penalty-address";
import { readPenaltyBoard } from "./penalty-board";
import {
  addPenaltyGroup,
  addTestPenalty,
  NO_SOCIAL_WORK,
} from "./test-discipline-penalties";
import {
  addNoteActor,
  addNotePeriods,
  addNoteStudents,
} from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

/** A day of Ganjil 4420/4421, which runs then. */
const TODAY = "4420-10-20";

interface Setting {
  officer: AccountForAccess;
  /** Students of Prodi A: Mahasiswa Uji Hukuman A 1 to 3. */
  inA: string[];
  /** A student of Prodi B: Mahasiswa Uji Hukuman B 1. */
  inB: string;
  programA: number;
  programB: number;
}

async function setting(db: Database): Promise<Setting> {
  await addNotePeriods(db, 4420);
  const a = await addNoteStudents(
    db,
    "Prodi Uji Hukuman A",
    "Mahasiswa Uji Hukuman A",
    ["9944210001", "9944210002", "9944210003"],
  );
  const b = await addNoteStudents(
    db,
    "Prodi Uji Hukuman B",
    "Mahasiswa Uji Hukuman B",
    ["9944210011"],
  );
  const officer = await addNoteActor(db, "Pembina Uji Daftar Hukuman", [
    "discipline_officer",
  ]);
  return {
    officer,
    inA: a.studentIds,
    inB: b.studentIds[0] ?? "",
    programA: a.programId,
    programB: b.programId,
  };
}

function read(
  db: Database,
  actor: AccountForAccess,
  more: Partial<PenaltiesParams> = {},
) {
  return readPenaltyBoard(db, actor, { ...PENALTIES_START, ...more }, TODAY);
}

async function reader(db: Database, roles: RoleId[], programId?: number) {
  return addNoteActor(
    db,
    "Pembaca Uji Daftar Hukuman",
    roles,
    programId ?? null,
  );
}

const DISMISSED = {
  category: "heavy",
  level: 2,
  status: "set",
  ...NO_SOCIAL_WORK,
} as const;

describe("readPenaltyBoard", () => {
  it("counts the penalties of each Kategori, and those whose kerja sosial ends today or later", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB } = await setting(db);
      const [one = "", two = ""] = inA;
      // Ends 4420-10-07: finished.
      await addTestPenalty(db, one, officer.id, "4420-10-01");
      // Ends 4420-10-20: today, not finished.
      await addTestPenalty(db, two, officer.id, "4420-10-14");
      await addTestPenalty(db, inB, officer.id, "4420-10-15", {
        category: "medium",
        level: 2,
        socialWorkEndsOn: "4420-11-13",
      });
      await addTestPenalty(db, inB, officer.id, "4420-10-16", DISMISSED);

      const board = await read(db, officer);

      expect(board?.numbers).toEqual({
        light: 2,
        medium: 1,
        heavy: 1,
        unfinishedWork: 2,
      });
      expect(board?.menteesOnly).toBe(false);
    });
  });

  it("lists the penalties, the latest first, with what Rincian shows, the semester of the Tanggal and who recorded it", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      const [one = ""] = inA;
      await db
        .update(students)
        .set({ cohortYear: 4419 })
        .where(eq(students.id, one));
      const early = await addTestPenalty(db, one, officer.id, "4420-09-01");
      const later = await addTestPenalty(db, one, officer.id, "4420-10-01", {
        category: "heavy",
        level: 1,
        decisionNumber: "KEP-01/UJI",
        socialWorkForms: ["staff_help", "other"],
        socialWorkOther: "Menata arsip",
        socialWorkPlace: "outside",
        socialWorkStartsOn: "4420-10-02",
        socialWorkEndsOn: "4421-06-01",
      });

      const board = await read(db, officer);

      expect(board?.list.rows.map((row) => row.id)).toEqual([later, early]);
      expect(board?.list.rows[0]).toEqual({
        id: later,
        studentId: one,
        name: "Mahasiswa Uji Hukuman A 1",
        nim: "9944210001",
        program: "Prodi Uji Hukuman A",
        day: "4420-10-01",
        description: "Terlambat mengikuti apel pagi tiga kali",
        category: "heavy",
        level: 1,
        status: "imposed",
        decisionNumber: "KEP-01/UJI",
        socialWorkForms: ["staff_help", "other"],
        socialWorkOther: "Menata arsip",
        socialWorkPlace: "outside",
        socialWorkStartsOn: "4420-10-02",
        socialWorkEndsOn: "4421-06-01",
        savedByName: "Pembina Uji Daftar Hukuman",
        semester: 3,
      });
    });
  });

  it("narrows the list by name or NIM, Kategori and status, and counts what matches", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB } = await setting(db);
      const [one = "", two = ""] = inA;
      await addTestPenalty(db, one, officer.id, "4420-09-01");
      await addTestPenalty(db, two, officer.id, "4420-09-02", {
        category: "medium",
        level: 1,
      });
      await addTestPenalty(db, inB, officer.id, "4420-09-03", DISMISSED);

      const byName = await read(db, officer, { query: "hukuman a 2" });
      const byNim = await read(db, officer, { query: "9944210011" });
      const light = await read(db, officer, { category: "light" });
      const set = await read(db, officer, { status: "set" });
      const none = await read(db, officer, {
        category: "light",
        status: "set",
      });

      expect(byName?.list.rows.map((row) => row.studentId)).toEqual([two]);
      expect(byNim?.list.rows.map((row) => row.studentId)).toEqual([inB]);
      expect(light?.list.rows.map((row) => row.studentId)).toEqual([one]);
      expect(set?.list.rows.map((row) => row.studentId)).toEqual([inB]);
      expect(none?.list).toEqual(
        expect.objectContaining({ matching: 0, rows: [] }),
      );
      expect(none?.numbers.heavy).toBe(1);
    });
  });

  it("gives Ketua Program Studi the numbers and penalties of their own program only, whatever they search for", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB, programA } = await setting(db);
      await addTestPenalty(db, inA[0] ?? "", officer.id, "4420-09-01");
      await addTestPenalty(db, inB, officer.id, "4420-09-01", DISMISSED);
      const kaprodi = await reader(db, ["head_of_program"], programA);
      const director = await reader(db, ["director"]);

      const own = await read(db, kaprodi);
      expect(own?.numbers).toEqual({
        light: 1,
        medium: 0,
        heavy: 0,
        unfinishedWork: 0,
      });
      expect(own?.list.matching).toBe(1);
      expect(own?.menteesOnly).toBe(false);
      const outside = await read(db, kaprodi, { query: "9944210011" });
      expect(outside?.list.matching).toBe(0);
      expect((await read(db, director))?.list.matching).toBe(2);
    });
  });

  it("gives Pengasuh the penalties of their own mentees only, and says so", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA, inB, programA } = await setting(db);
      const [one = "", two = ""] = inA;
      const mentor = await reader(db, ["mentor"]);
      await addPenaltyGroup(db, programA, [one], mentor.id);
      await addTestPenalty(db, one, officer.id, "4420-09-01");
      await addTestPenalty(db, two, officer.id, "4420-09-01");
      await addTestPenalty(db, inB, officer.id, "4420-09-01");

      const board = await read(db, mentor);

      expect(board?.list.rows.map((row) => row.studentId)).toEqual([one]);
      expect(board?.numbers.light).toBe(1);
      expect(board?.menteesOnly).toBe(true);
      const outside = await read(db, mentor, { query: "9944210002" });
      expect(outside?.list.matching).toBe(0);
    });
  });

  it.each([
    "student",
    "counsellor",
    "assessor",
    "upk_staff",
    "dorm_manager",
    "bam_bphk",
  ] as const)("reads nothing for %s", async (role) => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      await addTestPenalty(db, inA[0] ?? "", officer.id, "4420-09-01");
      const other = await reader(db, [role]);

      expect(await read(db, other)).toBeNull();
    });
  });

  it("shows 25 penalties a page, and the last page for a page past the end", async () => {
    await inTestDatabase(async (db) => {
      const { officer, inA } = await setting(db);
      for (let day = 1; day <= 26; day += 1) {
        const date = `4420-09-${String(day).padStart(2, "0")}`;
        await addTestPenalty(db, inA[day % 3] ?? "", officer.id, date);
      }

      const first = await read(db, officer);
      const second = await read(db, officer, { page: 2 });
      const beyond = await read(db, officer, { page: 9 });

      expect(first?.list.rows).toHaveLength(25);
      expect(first?.list.matching).toBe(26);
      expect(second?.list.rows.map((row) => row.day)).toEqual(["4420-09-01"]);
      expect(beyond?.list.page).toBe(2);
    });
  });
});
