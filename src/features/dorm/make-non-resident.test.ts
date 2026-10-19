// Sample Tahun akademik of this file: 3503 to 3503.
// Sample NIMs of this file: 9935000400 to 9935000499.
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
import { addResident } from "./add-resident";
import { makeNonResident } from "./make-non-resident";
import { NO_PERIOD } from "./place-resident";
import { RESIDENTS_NOT_ALLOWED } from "./resident-choice-messages";
import { readStudentDorm } from "./student-dorm";
import {
  addTestActor,
  addTestCompanion,
  residentsOfRoom,
} from "./test-records";

const inTestDatabase = withTestDatabase();

/** Angkatan 3503 is in semester 1 in it, angkatan 3502 in semester 3. */
const ODD_3503 = {
  startYear: 3503,
  term: "odd",
  startsOn: "3503-08-01",
  endsOn: "3504-01-31",
} as const;
const DAY = "3503-10-12";
const BEFORE_ANY_PERIOD = "3503-01-01";

const MAY_NOT: RoleId[] = [
  "bam_household",
  "head_of_unit",
  "director",
  "bam_bphk",
  "student",
];

type TestStudent = Partial<typeof students.$inferInsert>;

/** A Reguler woman of semester 1, a resident of Dana Rakca, unless told otherwise. */
async function addFirstYear(db: Database, nim: string, more: TestStudent = {}) {
  await db.insert(academicPeriods).values(ODD_3503).onConflictDoNothing();
  const program = await addTestProgram(db, `Prodi Uji Non Asrama ${nim}`);
  return addTestStudent(db, program, {
    nim,
    name: `Uji ${nim}`,
    cohortYear: 3503,
    ...more,
  });
}

function addManager(db: Database, roles: RoleId[] = ["dorm_manager"]) {
  return addTestActor(db, "Pengelola Uji", roles);
}

async function logOf(db: Database, studentId: string) {
  const lines = await db
    .select()
    .from(dormResidentChoiceChanges)
    .where(eq(dormResidentChoiceChanges.studentId, studentId));
  return lines.map((line) => [line.dormBefore, line.dormAfter, line.changedBy]);
}

describe("makeNonResident", () => {
  it("takes a resident out of their room and the dorm, and logs it", async () => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000401");
      const roomId = await addTestRoom(db, { number: "TN401" });
      await placeTestResident(db, roomId, id);
      const manager = await addManager(db);

      const made = await makeNonResident(db, manager, id, DAY);

      expect(made).toEqual({
        ok: true,
        value: "Uji 9935000401 dijadikan non asrama.",
      });
      expect(await readStudentDorm(db, id, DAY)).toBeNull();
      expect(await residentsOfRoom(db, roomId)).toEqual([]);
      expect(await logOf(db, id)).toEqual([["dana_rakca", null, manager.id]]);
    });
  });

  it.each([
    ["Internasional", { isInternational: true, cohortYear: 3502 }],
    ["Pembibitan", { isSeedling: true, cohortYear: 3502, sex: "male" }],
  ] as const)("works for a student of %s", async (_, more) => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000402", more);
      const manager = await addManager(db);

      expect((await makeNonResident(db, manager, id, DAY)).ok).toBe(true);

      expect(await readStudentDorm(db, id, DAY)).toBeNull();
    });
  });

  it("lets a student made Non asrama be added again with Tambah penghuni", async () => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000403");
      const manager = await addManager(db);
      await makeNonResident(db, manager, id, DAY);

      const added = await addResident(
        db,
        manager,
        { studentId: id, dorm: "wismantara_putri", note: "" },
        DAY,
      );

      expect(added.ok).toBe(true);
      expect(await readStudentDorm(db, id, DAY)).toBe("wismantara_putri");
      expect(await logOf(db, id)).toEqual([
        ["dana_rakca", null, manager.id],
        [null, "wismantara_putri", manager.id],
      ]);
    });
  });

  it("refuses an Aktif kakak pendamping, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000404", { cohortYear: 3502 });
      await addTestCompanion(db, id);
      const manager = await addManager(db);

      const made = await makeNonResident(db, manager, id, DAY);

      expect(made).toEqual({
        ok: false,
        error:
          "Mahasiswa ini kakak pendamping aktif. Nonaktifkan dulu di menu Kakak pendamping.",
      });
      expect(await readStudentDorm(db, id, DAY)).toBe("dana_rakca");
      expect(await logOf(db, id)).toEqual([]);
    });
  });

  it("lets a resident whose duty was stopped be made Non asrama", async () => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000405", {
        cohortYear: 3502,
        isInternational: true,
      });
      await addTestCompanion(db, id, { isActive: false });
      const manager = await addManager(db);

      expect((await makeNonResident(db, manager, id, DAY)).ok).toBe(true);
    });
  });

  it.each(MAY_NOT)("refuses %s, and changes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000406");
      const roomId = await addTestRoom(db, { number: "TN406" });
      await placeTestResident(db, roomId, id);
      const actor = await addManager(db, [role]);

      const made = await makeNonResident(db, actor, id, DAY);

      expect(made).toEqual(RESIDENTS_NOT_ALLOWED);
      expect(await readStudentDorm(db, id, DAY)).toBe("dana_rakca");
      expect(await residentsOfRoom(db, roomId)).toEqual([id]);
      expect(await logOf(db, id)).toEqual([]);
      const choices = await db
        .select()
        .from(dormResidentChoices)
        .where(eq(dormResidentChoices.studentId, id));
      expect(choices).toEqual([]);
    });
  });

  it("tells a student who already lives in no dorm", async () => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000407", { cohortYear: 3502 });
      const manager = await addManager(db);

      expect(await makeNonResident(db, manager, id, DAY)).toEqual({
        ok: false,
        error:
          "Uji 9935000407 sudah non asrama. Muat ulang halaman untuk melihat daftar terbaru.",
      });
      expect(await logOf(db, id)).toEqual([]);
    });
  });

  it("refuses a student who is not active", async () => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000408", { status: "on_leave" });
      const manager = await addManager(db);

      expect((await makeNonResident(db, manager, id, DAY)).ok).toBe(false);
      expect(await logOf(db, id)).toEqual([]);
    });
  });

  it("refuses while no academic period runs, and a student id not understood", async () => {
    await inTestDatabase(async (db) => {
      const id = await addFirstYear(db, "9935000409");
      const manager = await addManager(db);

      expect(await makeNonResident(db, manager, id, BEFORE_ANY_PERIOD)).toEqual(
        NO_PERIOD,
      );
      expect(await makeNonResident(db, manager, "bukan-id", DAY)).toEqual({
        ok: false,
        error: "Pilih mahasiswa.",
      });
    });
  });
});
