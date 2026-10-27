// Sample Tahun akademik of this file: 4471 to 4471.
// Sample NIMs of this file: 9987701000 to 9987701099.
import { eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  COACHING_START,
  type CoachingParams,
  readCoachingParams,
} from "./coaching-address";
import { readCoachingBoard, readOpenCoachingCount } from "./coaching-board";
import {
  addCoachingAssessment,
  addCoachingPeriod,
  addCoachingStatus,
  INTENSIVE,
  LIGHT,
  MODERATE,
  NOT_LISTED,
} from "./test-coaching";
import { addPenaltyGroup } from "./test-discipline-penalties";
import { addNoteActor, addNoteStudents } from "./test-violation-notes";

const inTestDatabase = withTestDatabase();

const TODAY = "4471-09-15";
const EARLIER = new Date("4471-08-10T03:00:00Z");
const LATER = new Date("4471-09-01T03:00:00Z");

interface Setting {
  kepala: AccountForAccess;
  /** Prodi A: Mahasiswa Uji Pembinaan A 1 to 4. */
  inA: string[];
  /** Prodi B: Mahasiswa Uji Pembinaan B 1. */
  inB: string;
  programA: number;
  periodId: string;
}

/**
 * A 1 Intensif, A 2 Sedang, A 3 Ringan, A 4 not listed, and B 1 Sedang
 * with a lower Rerata than A 2, all of angkatan 4470, in semester 3.
 */
async function setting(db: Database): Promise<Setting> {
  const periodId = await addCoachingPeriod(db, 4471);
  const a = await addNoteStudents(
    db,
    "Prodi Uji Pembinaan A",
    "Mahasiswa Uji Pembinaan A",
    ["9987701001", "9987701002", "9987701003", "9987701004"],
  );
  const b = await addNoteStudents(
    db,
    "Prodi Uji Pembinaan B",
    "Mahasiswa Uji Pembinaan B",
    ["9987701011"],
  );
  const inB = b.studentIds[0] ?? "";
  await db
    .update(students)
    .set({ cohortYear: 4470 })
    .where(inArray(students.id, [...a.studentIds, inB]));
  const kepala = await addNoteActor(db, "Kepala Uji Pembinaan", [
    "head_of_unit",
  ]);
  const sets = [INTENSIVE, MODERATE, LIGHT, NOT_LISTED];
  for (const [place, scores] of sets.entries()) {
    const studentId = a.studentIds[place] ?? "";
    await addCoachingAssessment(
      db,
      studentId,
      kepala.id,
      periodId,
      scores,
      LATER,
    );
  }
  const lower = { ...MODERATE, M: 60 };
  await addCoachingAssessment(db, inB, kepala.id, periodId, lower, LATER);
  return { kepala, inA: a.studentIds, inB, programA: a.programId, periodId };
}

function read(
  db: Database,
  actor: AccountForAccess,
  more: Partial<CoachingParams> = {},
) {
  return readCoachingBoard(db, actor, { ...COACHING_START, ...more }, TODAY);
}

function reader(db: Database, roles: RoleId[], programId?: number) {
  return addNoteActor(db, "Pembaca Uji Pembinaan", roles, programId ?? null);
}

type Board = Awaited<ReturnType<typeof read>>;

function idsOf(board: Board): string[] {
  return board?.list.rows.map((row) => row.studentId) ?? [];
}

describe("readCoachingBoard", () => {
  it("lists the students the rule lists, Intensif first then the lowest Rerata, with all a row shows", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA, inB, programA } = await setting(db);
      const [one = "", two = "", three = ""] = inA;
      const mentor = await reader(db, ["mentor"]);
      await addPenaltyGroup(db, programA, [one], mentor.id);
      await addCoachingStatus(db, two, kepala.id, "monitoring", "Dipantau.");

      const board = await read(db, kepala);

      expect(idsOf(board)).toEqual([one, inB, two, three]);
      expect(board?.list.rows[0]).toEqual({
        studentId: one,
        name: "Mahasiswa Uji Pembinaan A 1",
        nim: "9987701001",
        program: "Prodi Uji Pembinaan A",
        semester: 3,
        mentorName: "Pembaca Uji Pembinaan",
        level: "intensive",
        weakest: "M",
        weakestScore: 55,
        rerata: 58.3,
        status: "identified",
        note: "",
        version: 0,
        mayChange: true,
      });
      expect(board?.list.rows[2]).toEqual(
        expect.objectContaining({
          level: "moderate",
          status: "monitoring",
          note: "Dipantau.",
          version: 1,
          mentorName: null,
        }),
      );
      expect(board?.list.rows[3]?.level).toBe("light");
      expect(board?.menteesOnly).toBe(false);
    });
  });

  it("counts Belum selesai out of all identified, and each level among those not yet Selesai", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA, inB } = await setting(db);
      const [one = "", two = ""] = inA;
      await addCoachingStatus(db, one, kepala.id, "done");
      await addCoachingStatus(db, inB, kepala.id, "counselling");

      const board = await read(db, kepala);

      expect(board?.numbers).toEqual({
        open: 3,
        identified: 4,
        intensive: 0,
        moderate: 2,
        light: 1,
      });
      expect(idsOf(board)).not.toContain(one);
      expect(idsOf(board)).toContain(two);
      expect(await readOpenCoachingCount(db, kepala)).toBe(3);
    });
  });

  it("goes by the latest assessment alone, and leaves out a student who is not Aktif", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA, periodId } = await setting(db);
      const [one = "", two = "", , four = ""] = inA;
      await addCoachingAssessment(
        db,
        four,
        kepala.id,
        periodId,
        INTENSIVE,
        EARLIER,
      );
      const later = new Date("4471-09-10T03:00:00Z");
      await addCoachingAssessment(
        db,
        one,
        kepala.id,
        periodId,
        NOT_LISTED,
        later,
      );
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, two));

      const board = await read(db, kepala);

      expect(idsOf(board)).not.toContain(one);
      expect(idsOf(board)).not.toContain(two);
      expect(idsOf(board)).not.toContain(four);
      expect(board?.numbers.identified).toBe(2);
    });
  });

  it("narrows the list by name or NIM, level and status, and says nothing matches with no rows", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA, inB } = await setting(db);
      const [one = "", two = "", three = ""] = inA;
      await addCoachingStatus(db, one, kepala.id, "done");
      await addCoachingStatus(db, two, kepala.id, "counselling");

      const byName = await read(db, kepala, { query: "pembinaan a 3" });
      const byNim = await read(db, kepala, { query: "9987701011" });
      const moderate = await read(db, kepala, { level: "moderate" });
      const done = await read(db, kepala, { status: "done" });
      const every = await read(db, kepala, { status: "all" });
      const identified = await read(db, kepala, { status: "identified" });
      const none = await read(db, kepala, { level: "light", status: "done" });

      expect(idsOf(byName)).toEqual([three]);
      expect(idsOf(byNim)).toEqual([inB]);
      expect(idsOf(moderate)).toEqual([inB, two]);
      expect(idsOf(done)).toEqual([one]);
      expect(idsOf(every)).toEqual([one, inB, two, three]);
      expect(idsOf(identified)).toEqual([inB, three]);
      expect(none?.list).toEqual(
        expect.objectContaining({ matching: 0, rows: [] }),
      );
      expect(none?.numbers.identified).toBe(4);
    });
  });

  it("searches an address with the null character as the same search without it", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, inA, inB } = await setting(db);
      const [one = "", two = "", three = ""] = inA;
      const asked = (cari: string) =>
        readCoachingBoard(db, kepala, readCoachingParams({ cari }), TODAY);

      const byName = await asked("pembinaan\0 a 3\0");
      const nothing = await asked("\0 \0");

      expect(idsOf(byName)).toEqual([three]);
      expect(idsOf(nothing)).toEqual([one, inB, two, three]);
    });
  });

  it("gives Ketua Program Studi the numbers and rows of their own program only, and the readers no change", async () => {
    await inTestDatabase(async (db) => {
      const { programA } = await setting(db);
      const kaprodi = await reader(db, ["head_of_program"], programA);
      const director = await reader(db, ["director"]);

      const own = await read(db, kaprodi);
      const outside = await read(db, kaprodi, { query: "9987701011" });
      const all = await read(db, director);

      expect(own?.numbers.identified).toBe(3);
      expect(own?.list.matching).toBe(3);
      expect(outside?.list.matching).toBe(0);
      expect(all?.list.matching).toBe(4);
      const rows = [...(own?.list.rows ?? []), ...(all?.list.rows ?? [])];
      expect(rows.every((row) => !row.mayChange)).toBe(true);
      expect(await readOpenCoachingCount(db, kaprodi)).toBe(3);
    });
  });

  it("gives Pengasuh their own mentees only, to change, and says so", async () => {
    await inTestDatabase(async (db) => {
      const { inA, programA } = await setting(db);
      const [one = "", two = ""] = inA;
      const mentor = await reader(db, ["mentor"]);
      await addPenaltyGroup(db, programA, [one, two], mentor.id);

      const board = await read(db, mentor);
      const outside = await read(db, mentor, { query: "9987701003" });

      expect(idsOf(board)).toEqual([one, two]);
      expect(board?.numbers.identified).toBe(2);
      expect(board?.list.rows.every((row) => row.mayChange)).toBe(true);
      expect(board?.menteesOnly).toBe(true);
      expect(outside?.list.matching).toBe(0);
      expect(await readOpenCoachingCount(db, mentor)).toBe(2);
    });
  });

  it("gives a Ketua Program Studi who is also Pengasuh the program to read and only the mentees to change", async () => {
    await inTestDatabase(async (db) => {
      const { inA, inB, programA } = await setting(db);
      const [one = ""] = inA;
      const both = await reader(db, ["head_of_program", "mentor"], programA);
      await addPenaltyGroup(db, programA, [one, inB], both.id);

      const board = await read(db, both);

      const changeable = board?.list.rows
        .filter((row) => row.mayChange)
        .map((row) => row.studentId);
      expect(board?.list.matching).toBe(4);
      expect(changeable?.sort()).toEqual([one, inB].sort());
      expect(board?.menteesOnly).toBe(false);
    });
  });

  it.each([
    "discipline_officer",
    "student",
    "counsellor",
    "assessor",
    "upk_staff",
    "dorm_manager",
    "bam_bphk",
    "bam_health",
  ] as const)("reads nothing for %s", async (role) => {
    await inTestDatabase(async (db) => {
      await setting(db);
      const other = await reader(db, [role]);

      expect(await read(db, other)).toBeNull();
      expect(await readOpenCoachingCount(db, other)).toBe(0);
    });
  });

  it("shows 25 students a page, and the last page for a page past the end", async () => {
    await inTestDatabase(async (db) => {
      const { kepala, periodId } = await setting(db);
      const nims = Array.from(
        { length: 23 },
        (_, place) => `99877010${String(place + 30).padStart(2, "0")}`,
      );
      const more = await addNoteStudents(
        db,
        "Prodi Uji Pembinaan C",
        "Mahasiswa Uji Pembinaan C",
        nims,
      );
      for (const studentId of more.studentIds) {
        await addCoachingAssessment(
          db,
          studentId,
          kepala.id,
          periodId,
          LIGHT,
          LATER,
        );
      }

      const first = await read(db, kepala);
      const second = await read(db, kepala, { page: 2 });
      const beyond = await read(db, kepala, { page: 9 });

      expect(first?.list.rows).toHaveLength(25);
      expect(first?.list.matching).toBe(27);
      expect(second?.list.rows).toHaveLength(2);
      expect(beyond?.list.page).toBe(2);
    });
  });
});
