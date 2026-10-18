// Sample Tahun akademik of this file: 3153 to 3153.
// Sample NIMs of this file: 9982040000 to 9982040099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { dormCompanions } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestCompanion } from "./test-records";
import { addViolationSetting } from "./test-violations";
import {
  readResidentDorms,
  searchViolationStudents,
} from "./violation-residents";

const inTestDatabase = withTestDatabase();

const TODAY = "3153-10-12";

function setUp(db: Database) {
  return addViolationSetting(db, 3153, "Prodi Uji Cari Pelanggaran", [
    "9982040001",
    "9982040002",
    "9982040003",
    "9982040004",
    "9982040005",
  ]);
}

describe("searchViolationStudents", () => {
  it("finds the residents of every dorm by name or NIM, by name, and nobody who lives in no dorm", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);

      const found = await searchViolationStudents(
        db,
        "Uji Pelanggaran",
        null,
        TODAY,
      );
      const byNim = await searchViolationStudents(db, "998204000", null, TODAY);

      expect(found.map((pick) => [pick.name, pick.dorm])).toEqual([
        ["Ani Uji Pelanggaran", "dana_rakca"],
        ["Bea Uji Pelanggaran", "dana_rakca"],
        ["Cici Uji Pelanggaran", "dana_rakca"],
        ["Dodi Uji Pelanggaran", "cipta_bakti"],
      ]);
      expect(byNim).toHaveLength(4);
    });
  });

  it("finds an Aktif kakak pendamping as a resident of the dorm they serve, and not once the duty is stopped", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      await addTestCompanion(db, setting.outsider);

      const found = await searchViolationStudents(db, "Euis", null, TODAY);
      await db
        .update(dormCompanions)
        .set({ isActive: false })
        .where(eq(dormCompanions.studentId, setting.outsider));
      const stopped = await searchViolationStudents(db, "Euis", null, TODAY);

      expect(found.map((pick) => [pick.name, pick.dorm])).toEqual([
        ["Euis Uji Pelanggaran", "dana_rakca"],
      ]);
      expect(stopped).toEqual([]);
    });
  });

  it("never offers the student of the account that searches", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const [ani = ""] = setting.residents;

      const found = await searchViolationStudents(
        db,
        "Uji Pelanggaran",
        ani,
        TODAY,
      );

      expect(found.map((pick) => pick.id)).not.toContain(ani);
      expect(found).toHaveLength(3);
    });
  });

  it("finds nobody for an empty text or what is no text", async () => {
    await inTestDatabase(async (db) => {
      await setUp(db);

      expect(await searchViolationStudents(db, " ", null, TODAY)).toEqual([]);
      expect(await searchViolationStudents(db, 42, null, TODAY)).toEqual([]);
    });
  });
});

describe("readResidentDorms", () => {
  it("gives the dorm of each resident, and leaves out a student who lives in none", async () => {
    await inTestDatabase(async (db) => {
      const setting = await setUp(db);
      const [ani = ""] = setting.residents;

      const dorms = await readResidentDorms(
        db,
        [ani, setting.otherDorm, setting.outsider],
        TODAY,
      );

      expect([...dorms.entries()].sort()).toEqual(
        [
          [ani, "dana_rakca"],
          [setting.otherDorm, "cipta_bakti"],
        ].sort(),
      );
    });
  });
});
