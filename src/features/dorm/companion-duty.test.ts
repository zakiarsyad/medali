import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestProgram,
  addTestRoom,
  addTestStudent,
} from "@/dorms/test-records";
import { restartCompanion, stopCompanion } from "./companion-duty";
import { addTestCompanion, companionOf } from "./test-records";

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
const NOT_ALLOWED = {
  ok: false,
  error: "Anda tidak berhak mengelola kakak pendamping.",
};
const NOT_FOUND = {
  ok: false,
  error: "Kakak pendamping tidak ditemukan. Muat ulang halaman.",
};
const NO_ROW = "00000000-0000-4000-8000-000000000000";

async function addSenior(db: Database): Promise<string> {
  const program = await addTestProgram(db, "Prodi Uji Tugas Kakak");
  return addTestStudent(db, program, {
    nim: "9934240001",
    name: "Sinta Uji",
    cohortYear: 2024,
  });
}

/** An active kakak pendamping in a room. */
async function addPlaced(db: Database) {
  const studentId = await addSenior(db);
  const roomId = await addTestRoom(db, { number: "KT101" });
  await addTestCompanion(db, studentId, { roomId });
  return { studentId, roomId };
}

async function addStopped(db: Database): Promise<string> {
  const studentId = await addSenior(db);
  await addTestCompanion(db, studentId, { isActive: false });
  return studentId;
}

describe("stopCompanion", () => {
  it("sets Tidak aktif and takes the kakak pendamping out of the room", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, roomId } = await addPlaced(db);

      const stopped = await stopCompanion(db, MANAGER, { studentId, roomId });

      expect(stopped).toEqual({
        ok: true,
        value: "Kakak pendamping dinonaktifkan dan dikeluarkan dari kamar.",
      });
      expect(await companionOf(db, studentId)).toMatchObject({
        isActive: false,
        roomId: null,
      });
    });
  });

  it("stops one who has no room", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);
      await addTestCompanion(db, studentId);

      const stopped = await stopCompanion(db, MANAGER, {
        studentId,
        roomId: "",
      });

      expect(stopped).toEqual({
        ok: true,
        value: "Kakak pendamping dinonaktifkan.",
      });
      expect((await companionOf(db, studentId))?.isActive).toBe(false);
    });
  });

  it("refuses when the kakak pendamping got a room the screen did not show", async () => {
    await inTestDatabase(async (db) => {
      const { studentId } = await addPlaced(db);

      const stopped = await stopCompanion(db, MANAGER, {
        studentId,
        roomId: "",
      });

      expect(stopped).toEqual({
        ok: false,
        error:
          "Kamar kakak pendamping ini baru saja berubah. Muat ulang halaman, lalu coba lagi.",
      });
      expect((await companionOf(db, studentId))?.isActive).toBe(true);
    });
  });

  it("refuses one who is stopped already", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStopped(db);

      const stopped = await stopCompanion(db, MANAGER, {
        studentId,
        roomId: "",
      });

      expect(stopped).toEqual({
        ok: false,
        error: "Kakak pendamping ini sudah tidak aktif.",
      });
    });
  });

  it.each([NO_ROW, "", "bukan-id"])(
    "refuses the student '%s' who is no kakak pendamping",
    async (studentId) => {
      await inTestDatabase(async (db) => {
        const stopped = await stopCompanion(db, MANAGER, {
          studentId,
          roomId: "",
        });

        expect(stopped).toEqual(NOT_FOUND);
      });
    },
  );

  it.each(MAY_NOT)("refuses %s, and changes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const { studentId, roomId } = await addPlaced(db);

      const stopped = await stopCompanion(
        db,
        { roles: [role] },
        { studentId, roomId },
      );

      expect(stopped).toEqual(NOT_ALLOWED);
      expect(await companionOf(db, studentId)).toMatchObject({
        isActive: true,
        roomId,
      });
    });
  });
});

describe("restartCompanion", () => {
  it("sets Aktif again, without a room", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStopped(db);

      const restarted = await restartCompanion(db, MANAGER, studentId);

      expect(restarted).toEqual({
        ok: true,
        value: "Kakak pendamping diaktifkan kembali.",
      });
      expect(await companionOf(db, studentId)).toMatchObject({
        isActive: true,
        roomId: null,
      });
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "refuses a student whose status is %s",
    async (status) => {
      await inTestDatabase(async (db) => {
        const studentId = await addStopped(db);
        await db
          .update(students)
          .set({ status })
          .where(eq(students.id, studentId));

        const restarted = await restartCompanion(db, MANAGER, studentId);

        expect(restarted).toEqual({
          ok: false,
          error:
            "Mahasiswa ini tidak aktif, jadi tidak bisa diaktifkan sebagai kakak pendamping.",
        });
        expect((await companionOf(db, studentId))?.isActive).toBe(false);
      });
    },
  );

  it("refuses a student who was removed", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStopped(db);
      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, studentId));

      expect(await restartCompanion(db, MANAGER, studentId)).toEqual(NOT_FOUND);
      expect((await companionOf(db, studentId))?.isActive).toBe(false);
    });
  });

  it("refuses one who is active already", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addSenior(db);
      await addTestCompanion(db, studentId);

      expect(await restartCompanion(db, MANAGER, studentId)).toEqual({
        ok: false,
        error: "Kakak pendamping ini sudah aktif.",
      });
    });
  });

  it.each([NO_ROW, "", "bukan-id"])(
    "refuses the student '%s' who is no kakak pendamping",
    async (studentId) => {
      await inTestDatabase(async (db) => {
        expect(await restartCompanion(db, MANAGER, studentId)).toEqual(
          NOT_FOUND,
        );
      });
    },
  );

  it.each(MAY_NOT)("refuses %s, and changes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      const studentId = await addStopped(db);

      const restarted = await restartCompanion(
        db,
        { roles: [role] },
        studentId,
      );

      expect(restarted).toEqual(NOT_ALLOWED);
      expect((await companionOf(db, studentId))?.isActive).toBe(false);
    });
  });
});

describe("restartCompanion for a student who no longer fits the duty", () => {
  /*
   * A period far from those of any other file of checks, so these wait
   * for none of them. Angkatan 2064 is in semester 1 in it, angkatan 2063
   * in semester 3.
   */
  const ODD_2064 = {
    startYear: 2064,
    term: "odd",
    startsOn: "2064-08-01",
    endsOn: "2065-01-31",
  } as const;
  const DAY = "2064-10-12";

  type Facts = Partial<typeof students.$inferInsert>;

  /** A stopped kakak pendamping of Dana Rakca: a woman of semester 3, unless told otherwise. */
  async function addStoppedWith(db: Database, facts: Facts): Promise<string> {
    await db.insert(academicPeriods).values(ODD_2064);
    const program = await addTestProgram(db, "Prodi Uji Aktifkan Kakak");
    const studentId = await addTestStudent(db, program, {
      nim: "9939630001",
      name: "Sinta Uji",
      cohortYear: 2063,
      ...facts,
    });
    await addTestCompanion(db, studentId, { isActive: false });
    return studentId;
  }

  it("still restarts a student who fits it", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStoppedWith(db, {});

      const restarted = await restartCompanion(db, MANAGER, studentId, DAY);

      expect(restarted.ok).toBe(true);
      expect((await companionOf(db, studentId))?.isActive).toBe(true);
    });
  });

  it("refuses a Reguler student in semester 1, who lives in Dana Rakca now", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStoppedWith(db, { cohortYear: 2064 });

      const restarted = await restartCompanion(db, MANAGER, studentId, DAY);

      expect(restarted).toEqual({
        ok: false,
        error:
          "Mahasiswa ini sekarang penghuni Asrama Dana Rakca atau Asrama Cipta Bakti, jadi tidak bisa diaktifkan sebagai kakak pendamping.",
      });
      expect((await companionOf(db, studentId))?.isActive).toBe(false);
    });
  });

  it.each([
    ["Pembibitan", { isSeedling: true }],
    ["Internasional", { isInternational: true }],
  ] as [string, Facts][])(
    "restarts a student who lives in Wismantara now: %s",
    async (_who, facts) => {
      await inTestDatabase(async (db) => {
        const studentId = await addStoppedWith(db, facts);

        const restarted = await restartCompanion(db, MANAGER, studentId, DAY);

        expect(restarted.ok).toBe(true);
        expect((await companionOf(db, studentId))?.isActive).toBe(true);
      });
    },
  );

  it("refuses a student whose jenis kelamin does not fit the dorm they served", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addStoppedWith(db, { sex: "male" });

      const restarted = await restartCompanion(db, MANAGER, studentId, DAY);

      expect(restarted).toEqual({
        ok: false,
        error:
          "Asrama Dana Rakca hanya untuk mahasiswa perempuan, jadi kakak pendamping ini tidak bisa diaktifkan.",
      });
      expect((await companionOf(db, studentId))?.isActive).toBe(false);
    });
  });
});
