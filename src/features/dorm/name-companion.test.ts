import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, dormCompanions, type students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { nameCompanion, type SentCompanion } from "./name-companion";
import {
  addTestCompanion,
  addTestProgram,
  addTestStudent,
  companionOf,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const MANAGER = { roles: ["dorm_manager"] as RoleId[] };
const MAY_NOT: RoleId[] = [
  "head_of_unit",
  "director",
  "head_of_program",
  "bam_bphk",
  "bam_household",
  "student",
  "mentor",
  "bam_compliance",
];
const NO_ROW = "00000000-0000-4000-8000-000000000000";

/*
 * A period far from those of any other file of checks, so these wait for
 * none of them. Angkatan 2061 is in semester 1 in it, angkatan 2060 in
 * semester 3.
 */
const ODD_2061 = {
  startYear: 2061,
  term: "odd",
  startsOn: "2061-08-01",
  endsOn: "2062-01-31",
} as const;
const DAY = "2061-10-12";
const BEFORE_ANY_PERIOD = "2061-01-01";

type TestStudent = Partial<typeof students.$inferInsert>;

/** A Reguler woman of semester 3, unless told otherwise. */
async function addSenior(db: Database, student: TestStudent = {}) {
  await db.insert(academicPeriods).values(ODD_2061).onConflictDoNothing();
  const program = await addTestProgram(db, "Prodi Uji Tetapkan Kakak");
  return addTestStudent(db, program, {
    nim: "9932600001",
    name: "Sinta Uji",
    cohortYear: 2060,
    ...student,
  });
}

function name(
  db: Database,
  sent: Partial<SentCompanion>,
  actor = MANAGER,
  day = DAY,
) {
  const all = { studentId: "", dorm: "dana_rakca", note: "", ...sent };
  return nameCompanion(db, actor, all, day);
}

async function companionCount(db: Database): Promise<number> {
  return db.$count(dormCompanions);
}

describe("nameCompanion", () => {
  it("names an active student who does not live in a dorm", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);

      const named = await name(db, { studentId, note: "  Lantai 3 " });

      expect(named).toEqual({
        ok: true,
        value:
          "Sinta Uji ditetapkan sebagai kakak pendamping Asrama Dana Rakca.",
      });
      expect(await companionOf(db, studentId)).toEqual({
        studentId,
        dorm: "dana_rakca",
        note: "Lantai 3",
        isActive: true,
        roomId: null,
      });
    });
  });

  it("keeps no keterangan when none is given", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);

      await name(db, { studentId, note: "   " });

      expect((await companionOf(db, studentId))?.note).toBe(null);
    });
  });

  it("names a man for Cipta Bakti", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db, { sex: "male" });

      const named = await name(db, { studentId, dorm: "cipta_bakti" });

      expect(named.ok).toBe(true);
    });
  });

  it("refuses Cipta Bakti for a woman, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);

      const named = await name(db, { studentId, dorm: "cipta_bakti" });

      expect(named).toEqual({
        ok: false,
        error: "Asrama Cipta Bakti hanya untuk mahasiswa laki-laki.",
      });
      expect(await companionCount(db)).toBe(0);
    });
  });

  it("refuses Dana Rakca for a man, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db, { sex: "male" });

      const named = await name(db, { studentId, dorm: "dana_rakca" });

      expect(named).toEqual({
        ok: false,
        error: "Asrama Dana Rakca hanya untuk mahasiswa perempuan.",
      });
      expect(await companionCount(db)).toBe(0);
    });
  });

  it.each(["wismantara_putri", "wismantara_putra", "", "asrama"])(
    "refuses the dorm '%s'",
    async (dorm) => {
      await inTestDatabase(async (db) => {
        const studentId = await addSenior(db);

        const named = await name(db, { studentId, dorm });

        expect(named).toEqual({ ok: false, error: "Pilih asrama." });
        expect(await companionCount(db)).toBe(0);
      });
    },
  );

  it.each(["", "bukan-id"])("refuses the student '%s'", async (studentId) => {
    await inTestDatabase(async (db) => {
      await addSenior(db);

      const named = await name(db, { studentId });

      expect(named).toEqual({ ok: false, error: "Pilih mahasiswa." });
    });
  });

  it("refuses a keterangan that is too long", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);

      const named = await name(db, { studentId, note: "a".repeat(101) });

      expect(named).toEqual({
        ok: false,
        error: "Keterangan paling panjang 100 karakter.",
      });
      expect(await companionCount(db)).toBe(0);
    });
  });

  it.each([
    ["in semester 1", { cohortYear: 2061 }],
    ["Pembibitan", { isSeedling: true }],
    ["Internasional", { isInternational: true }],
  ])("refuses a student who lives in a dorm: %s", async (_who, facts) => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db, facts);

      const named = await name(db, { studentId });

      expect(named).toEqual({
        ok: false,
        error:
          "Mahasiswa ini tinggal di asrama, jadi tidak bisa ditetapkan sebagai kakak pendamping.",
      });
      expect(await companionCount(db)).toBe(0);
    });
  });

  it.each([
    ["on leave", { status: "on_leave" as const }],
    ["not active", { status: "inactive" as const }],
    ["removed", { deletedAt: new Date() }],
  ])("refuses a student who is %s", async (_who, facts) => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db, facts);

      const named = await name(db, { studentId });

      expect(named).toEqual({
        ok: false,
        error:
          "Mahasiswa tidak ditemukan atau tidak aktif. Muat ulang halaman.",
      });
      expect(await companionCount(db)).toBe(0);
    });
  });

  it("refuses a student who does not exist", async () => {
    await inTestDatabase(async (db) => {
      await addSenior(db);

      const named = await name(db, { studentId: NO_ROW });

      expect(named.ok).toBe(false);
    });
  });

  it("saves one kakak pendamping when the same student is named twice", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);

      await name(db, { studentId });
      const again = await name(db, { studentId });

      expect(again).toEqual({
        ok: false,
        error: "Mahasiswa ini sudah menjadi kakak pendamping.",
      });
      expect(await companionCount(db)).toBe(1);
    });
  });

  it("refuses a student whose duty was stopped: that one is restarted", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);
      await addTestCompanion(db, studentId, { isActive: false });

      const named = await name(db, { studentId });

      expect(named.ok).toBe(false);
      expect((await companionOf(db, studentId))?.isActive).toBe(false);
    });
  });

  it("refuses while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);

      const named = await name(db, { studentId }, MANAGER, BEFORE_ANY_PERIOD);

      expect(named).toEqual({
        ok: false,
        error:
          "Belum ada periode akademik yang berjalan, jadi kakak pendamping belum bisa ditetapkan. Minta Kepala Unit mengatur periode akademik.",
      });
      expect(await companionCount(db)).toBe(0);
    });
  });

  it.each(MAY_NOT)("refuses %s, and saves nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);

      const named = await name(db, { studentId }, { roles: [role] });

      expect(named).toEqual({
        ok: false,
        error: "Anda tidak berhak mengelola kakak pendamping.",
      });
      expect(await companionCount(db)).toBe(0);
    });
  });

  it("names for an account that is Pengelola Asrama among other roles", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);
      const actor = { roles: ["mentor", "dorm_manager"] as RoleId[] };

      const named = await name(db, { studentId }, actor);

      expect(named.ok).toBe(true);
      const kept = await db
        .select()
        .from(dormCompanions)
        .where(eq(dormCompanions.studentId, studentId));
      expect(kept).toHaveLength(1);
    });
  });
});
