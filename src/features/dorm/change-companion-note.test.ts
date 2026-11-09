import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { changeCompanionNote } from "./change-companion-note";
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
const CHANGED = { ok: true, value: "Keterangan kakak pendamping diubah." };
const NOT_FOUND = {
  ok: false,
  error: "Kakak pendamping tidak ditemukan. Muat ulang halaman.",
};
const NO_ROW = "00000000-0000-4000-8000-000000000000";

/** A kakak pendamping with the Keterangan "Lantai 2", Aktif unless told. */
async function addNoted(db: Database, isActive = true): Promise<string> {
  const program = await addTestProgram(db, "Prodi Uji Keterangan Kakak");
  const studentId = await addTestStudent(db, program, {
    nim: "9934240101",
    name: "Rina Uji",
    cohortYear: 2024,
  });
  await addTestCompanion(db, studentId, { note: "Lantai 2", isActive });
  return studentId;
}

async function noteOf(db: Database, studentId: string) {
  return (await companionOf(db, studentId))?.note;
}

describe("changeCompanionNote", () => {
  it("saves the new Keterangan without spaces around it", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addNoted(db);

      const changed = await changeCompanionNote(db, MANAGER, {
        studentId,
        note: "  Pendamping lantai 3 ",
      });

      expect(changed).toEqual(CHANGED);
      expect(await noteOf(db, studentId)).toBe("Pendamping lantai 3");
    });
  });

  it("keeps an emptied Keterangan as none", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addNoted(db);

      const changed = await changeCompanionNote(db, MANAGER, {
        studentId,
        note: "   ",
      });

      expect(changed).toEqual(CHANGED);
      expect(await noteOf(db, studentId)).toBe(null);
    });
  });

  it("changes a kakak pendamping who is Tidak aktif too", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addNoted(db, false);

      const changed = await changeCompanionNote(db, MANAGER, {
        studentId,
        note: "Cuti satu semester",
      });

      expect(changed).toEqual(CHANGED);
      expect(await noteOf(db, studentId)).toBe("Cuti satu semester");
    });
  });

  it("refuses a Keterangan longer than 100 characters and keeps the old one", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addNoted(db);

      const changed = await changeCompanionNote(db, MANAGER, {
        studentId,
        note: "a".repeat(101),
      });

      expect(changed).toEqual({
        ok: false,
        error: "Keterangan paling panjang 100 karakter.",
      });
      expect(await noteOf(db, studentId)).toBe("Lantai 2");
    });
  });

  it("takes a Keterangan of exactly 100 characters", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addNoted(db);

      const changed = await changeCompanionNote(db, MANAGER, {
        studentId,
        note: "a".repeat(100),
      });

      expect(changed).toEqual(CHANGED);
      expect(await noteOf(db, studentId)).toBe("a".repeat(100));
    });
  });

  it.each(MAY_NOT)("refuses %s and keeps the old Keterangan", async (role) => {
    await inTestDatabase(async (db) => {
      const studentId = await addNoted(db);

      const changed = await changeCompanionNote(
        db,
        { roles: [role] },
        { studentId, note: "Diubah tanpa hak" },
      );

      expect(changed).toEqual({
        ok: false,
        error: "Anda tidak berhak mengelola kakak pendamping.",
      });
      expect(await noteOf(db, studentId)).toBe("Lantai 2");
    });
  });

  it("refuses a student who is no kakak pendamping", async () => {
    await inTestDatabase(async (db) => {
      const changed = await changeCompanionNote(db, MANAGER, {
        studentId: NO_ROW,
        note: "Lantai 2",
      });

      expect(changed).toEqual(NOT_FOUND);
    });
  });

  it("refuses an id that is no id", async () => {
    await inTestDatabase(async (db) => {
      const changed = await changeCompanionNote(db, MANAGER, {
        studentId: "bukan-id",
        note: "Lantai 2",
      });

      expect(changed).toEqual(NOT_FOUND);
    });
  });

  it("refuses a kakak pendamping whose student was removed", async () => {
    await inTestDatabase(async (db) => {
      const studentId = await addNoted(db);
      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, studentId));

      const changed = await changeCompanionNote(db, MANAGER, {
        studentId,
        note: "Lantai 4",
      });

      expect(changed).toEqual(NOT_FOUND);
      expect(await noteOf(db, studentId)).toBe("Lantai 2");
    });
  });
});
