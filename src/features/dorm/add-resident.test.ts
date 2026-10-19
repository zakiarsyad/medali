// Sample Tahun akademik of this file: 3501 to 3501.
// Sample NIMs of this file: 9935000200 to 9935000299.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  academicPeriods,
  dormResidentChoiceChanges,
  dormResidentChoices,
  type students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
  placeTestResident,
} from "@/dorms/test-records";
import { addResident, type SentResident } from "./add-resident";
import { listNonResidents } from "./non-residents";
import { NO_PERIOD } from "./place-resident";
import { RESIDENTS_NOT_ALLOWED } from "./resident-choice-messages";
import { listUnplaced } from "./room-list";
import { readStudentDorm } from "./student-dorm";
import { addTestActor, EVERYONE } from "./test-records";

const inTestDatabase = withTestDatabase();

/** Angkatan 3501 is in semester 1 in it, angkatan 3500 in semester 3. */
const ODD_3501 = {
  startYear: 3501,
  term: "odd",
  startsOn: "3501-08-01",
  endsOn: "3502-01-31",
} as const;
const DAY = "3501-10-12";
const BEFORE_ANY_PERIOD = "3501-01-01";
const PROGRAM = "Prodi Uji Tambah Penghuni";

const MAY_NOT: RoleId[] = [
  "bam_household",
  "head_of_unit",
  "director",
  "bam_bphk",
  "student",
];

type TestStudent = Partial<typeof students.$inferInsert>;

/** A Reguler woman of semester 3, who lives in no dorm, unless told otherwise. */
async function addSenior(db: Database, nim: string, more: TestStudent = {}) {
  await db.insert(academicPeriods).values(ODD_3501).onConflictDoNothing();
  const program = await addTestProgram(db, `${PROGRAM} ${nim}`);
  return addTestStudent(db, program, {
    nim,
    name: `Uji ${nim}`,
    cohortYear: 3500,
    ...more,
  });
}

async function addManager(db: Database, roles: RoleId[] = ["dorm_manager"]) {
  return addTestActor(db, "Pengelola Uji", roles);
}

function sent(studentId: string, more: Partial<SentResident> = {}) {
  return { studentId, dorm: "dana_rakca", note: "", ...more };
}

async function logOf(db: Database, studentId: string) {
  const lines = await db
    .select()
    .from(dormResidentChoiceChanges)
    .where(eq(dormResidentChoiceChanges.studentId, studentId));
  return lines.map((line) => [line.dormBefore, line.dormAfter, line.changedBy]);
}

async function unplacedIds(db: Database, dorm: "dana_rakca") {
  const scope = { dorm, dormCohorts: [3501], visible: EVERYONE };
  const unplaced = await listUnplaced(db, scope, "");
  return unplaced.shown.map((resident) => resident.id);
}

describe("addResident", () => {
  it("makes a student who lives in no dorm a resident, waiting in Belum diplot, and logs it", async () => {
    await inTestDatabase(async (db) => {
      const id = await addSenior(db, "9935000201");
      const manager = await addManager(db);

      const added = await addResident(
        db,
        manager,
        sent(id, { note: " Pindahan " }),
        DAY,
      );

      expect(added).toEqual({
        ok: true,
        value: "Uji 9935000201 ditambahkan sebagai penghuni Asrama Dana Rakca.",
      });
      expect(await readStudentDorm(db, id, DAY)).toBe("dana_rakca");
      expect(await unplacedIds(db, "dana_rakca")).toContain(id);
      expect(await logOf(db, id)).toEqual([[null, "dana_rakca", manager.id]]);
      const [choice] = await db
        .select({ note: dormResidentChoices.note })
        .from(dormResidentChoices)
        .where(eq(dormResidentChoices.studentId, id));
      expect(choice?.note).toBe("Pindahan");
    });
  });

  it("refuses an Asrama that does not fit the jenis kelamin, and saves nothing", async () => {
    await inTestDatabase(async (db) => {
      const woman = await addSenior(db, "9935000202");
      const man = await addSenior(db, "9935000203", { sex: "male" });
      const manager = await addManager(db);

      const toMen = await addResident(
        db,
        manager,
        sent(woman, { dorm: "wismantara_putra" }),
        DAY,
      );
      const toWomen = await addResident(
        db,
        manager,
        sent(man, { dorm: "dana_rakca" }),
        DAY,
      );

      expect(toMen).toEqual({
        ok: false,
        error:
          "Asrama Wismantara Putra hanya untuk mahasiswa laki-laki. Pilih asrama lain.",
      });
      expect(toWomen).toEqual({
        ok: false,
        error:
          "Asrama Dana Rakca hanya untuk mahasiswa perempuan. Pilih asrama lain.",
      });
      expect(await readStudentDorm(db, woman, DAY)).toBeNull();
      expect(await logOf(db, woman)).toEqual([]);
      expect(await logOf(db, man)).toEqual([]);
    });
  });

  it.each(MAY_NOT)("refuses %s, and saves nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const id = await addSenior(db, "9935000204");
      const actor = await addManager(db, [role]);

      const added = await addResident(db, actor, sent(id), DAY);

      expect(added).toEqual(RESIDENTS_NOT_ALLOWED);
      expect(await readStudentDorm(db, id, DAY)).toBeNull();
      expect(await logOf(db, id)).toEqual([]);
      const choices = await db
        .select()
        .from(dormResidentChoices)
        .where(eq(dormResidentChoices.studentId, id));
      expect(choices).toEqual([]);
    });
  });

  it("refuses a student who already lives in a dorm", async () => {
    await inTestDatabase(async (db) => {
      const id = await addSenior(db, "9935000205", { cohortYear: 3501 });
      const manager = await addManager(db);

      const added = await addResident(
        db,
        manager,
        sent(id, { dorm: "wismantara_putri" }),
        DAY,
      );

      expect(added).toEqual({
        ok: false,
        error:
          "Uji 9935000205 sudah penghuni Asrama Dana Rakca. Muat ulang halaman untuk melihat daftar terbaru.",
      });
      expect(await logOf(db, id)).toEqual([]);
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "refuses a student whose status is %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const id = await addSenior(db, "9935000206", { status });
        const manager = await addManager(db);

        const added = await addResident(db, manager, sent(id), DAY);

        expect(added.ok).toBe(false);
        expect(await logOf(db, id)).toEqual([]);
      });
    },
  );

  it("makes a student made Non asrama by hand a resident again", async () => {
    await inTestDatabase(async (db) => {
      const id = await addSenior(db, "9935000207", { isSeedling: true });
      const manager = await addManager(db);
      await db.insert(dormResidentChoices).values({
        studentId: id,
        dorm: null,
        setBy: manager.id,
        setAt: new Date(),
      });

      const added = await addResident(
        db,
        manager,
        sent(id, { dorm: "wismantara_putri" }),
        DAY,
      );

      expect(added.ok).toBe(true);
      expect(await readStudentDorm(db, id, DAY)).toBe("wismantara_putri");
    });
  });

  it("puts a student with a place left behind in Belum diplot, not back in that room", async () => {
    await inTestDatabase(async (db) => {
      const id = await addSenior(db, "9935000208");
      const roomId = await addTestRoom(db, { number: "TP201" });
      await placeTestResident(db, roomId, id);
      const manager = await addManager(db);

      await addResident(db, manager, sent(id), DAY);

      expect(await unplacedIds(db, "dana_rakca")).toContain(id);
    });
  });

  it("refuses while no academic period runs", async () => {
    await inTestDatabase(async (db) => {
      const id = await addSenior(db, "9935000209");
      const manager = await addManager(db);

      const added = await addResident(db, manager, sent(id), BEFORE_ANY_PERIOD);

      expect(added).toEqual(NO_PERIOD);
    });
  });

  it.each([
    [{ studentId: "bukan-id" }, "Pilih mahasiswa."],
    [{ dorm: "wismantara" }, "Pilih asrama."],
    [{ note: "a".repeat(101) }, "Keterangan paling panjang 100 karakter."],
  ])("refuses %o", async (more, error) => {
    await inTestDatabase(async (db) => {
      const id = await addSenior(db, "9935000210");
      const manager = await addManager(db);

      const added = await addResident(db, manager, sent(id, more), DAY);

      expect(added).toEqual({ ok: false, error });
    });
  });
});

describe("listNonResidents", () => {
  it("offers the active students who live in no dorm, found by name or NIM", async () => {
    await inTestDatabase(async (db) => {
      const senior = await addSenior(db, "9935000211");
      const resident = await addSenior(db, "9935000212", { cohortYear: 3501 });
      const away = await addSenior(db, "9935000213", { status: "on_leave" });
      const scope = { dormCohorts: [3501], visible: EVERYONE };

      const all = await listNonResidents(db, scope, "993500021");
      const found = await listNonResidents(db, scope, "9935000211");

      const ids = all.shown.map((student) => student.id);
      expect(ids).toContain(senior);
      expect(ids).not.toContain(resident);
      expect(ids).not.toContain(away);
      expect(found.matching).toBe(1);
      expect(found.shown[0]).toMatchObject({ id: senior, sex: "female" });
    });
  });
});
