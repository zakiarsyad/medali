// Sample NIMs of this file: 9944410000 to 9944410099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestPenalty,
  NO_SOCIAL_WORK,
} from "@/features/guidance/test-discipline-penalties";
import {
  addNoteActor,
  addNoteStudents,
} from "@/features/guidance/test-violation-notes";
import { readSanctions } from "./read-sanctions";

const inTestDatabase = withTestDatabase();

const SUSPENDED = {
  category: "heavy",
  level: 1,
  status: "serving",
  socialWorkEndsOn: "2027-04-30",
} as const;

const DISMISSED = {
  category: "heavy",
  level: 3,
  status: "set",
  ...NO_SOCIAL_WORK,
} as const;

async function setting(db: Database) {
  const a = await addNoteStudents(db, "Prodi Uji Sanksi A", "Uji Sanksi A", [
    "9944410001",
    "9944410002",
    "9944410003",
  ]);
  const b = await addNoteStudents(db, "Prodi Uji Sanksi B", "Uji Sanksi B", [
    "9944410011",
  ]);
  const officer = await addNoteActor(db, "Pembina Uji Sanksi", [
    "discipline_officer",
  ]);
  const [suspended = "", dismissed = "", light = ""] = a.studentIds;
  const inB = b.studentIds[0] ?? "";
  await addTestPenalty(db, suspended, officer.id, "2026-09-01", SUSPENDED);
  await addTestPenalty(db, dismissed, officer.id, "2026-09-01", DISMISSED);
  await addTestPenalty(db, light, officer.id, "2026-09-01");
  await addTestPenalty(db, inB, officer.id, "2026-09-01", DISMISSED);
  return {
    officer,
    ids: [suspended, dismissed, light, inB],
    suspended,
    dismissed,
    light,
    inB,
    programA: a.programId,
  };
}

function reader(db: Database, roles: RoleId[], programId?: number) {
  return addNoteActor(db, "Pembaca Uji Sanksi", roles, programId ?? null);
}

describe("readSanctions", () => {
  it("gives the badge of each student of the page with a Berat penalty, in one read, and none for a Ringan one", async () => {
    await inTestDatabase(async (db) => {
      const { ids, suspended, dismissed, inB } = await setting(db);

      const found = await readSanctions(
        db,
        await reader(db, ["head_of_unit"]),
        ids,
      );

      expect(found).toEqual(
        new Map([
          [suspended, "suspended"],
          [dismissed, "dismissed"],
          [inB, "dismissed"],
        ]),
      );
    });
  });

  it("ends Diberhentikan sementara once Selesai dijalani, but not for a student with an Instansi asal", async () => {
    await inTestDatabase(async (db) => {
      const { officer, programA } = await setting(db);
      const { studentIds } = await addNoteStudents(
        db,
        "Prodi Uji Sanksi C",
        "Uji Sanksi C",
        ["9944410021", "9944410022"],
      );
      const [plain = "", agency = ""] = studentIds;
      await db
        .update(students)
        .set({ originAgency: "Instansi Uji" })
        .where(eq(students.id, agency));
      for (const id of studentIds) {
        await addTestPenalty(db, id, officer.id, "2026-09-01", {
          ...SUSPENDED,
          status: "served",
        });
      }

      const found = await readSanctions(
        db,
        await reader(db, ["director"], programA),
        studentIds,
      );

      expect(found.get(plain)).toBeUndefined();
      expect(found.get(agency)).toBe("suspended");
    });
  });

  it("keeps Ketua Program Studi to their own program", async () => {
    await inTestDatabase(async (db) => {
      const { ids, suspended, dismissed, programA } = await setting(db);

      const found = await readSanctions(
        db,
        await reader(db, ["head_of_program"], programA),
        ids,
      );

      expect([...found.keys()].sort()).toEqual([suspended, dismissed].sort());
    });
  });

  it.each([
    "counsellor",
    "assessor",
    "upk_staff",
    "dorm_manager",
    "bam_bphk",
    "student",
  ] as const)("gives %s no badge at all", async (role) => {
    await inTestDatabase(async (db) => {
      const { ids } = await setting(db);

      const found = await readSanctions(db, await reader(db, [role]), ids);

      expect(found.size).toBe(0);
    });
  });

  it("gives Pembina Disiplin Mahasiswa the badges, and nothing for an empty page or a text that is no id", async () => {
    await inTestDatabase(async (db) => {
      const { officer, ids } = await setting(db);

      expect((await readSanctions(db, officer, ids)).size).toBe(3);
      expect((await readSanctions(db, officer, [])).size).toBe(0);
      expect((await readSanctions(db, officer, ["bukan-id"])).size).toBe(0);
    });
  });
});
