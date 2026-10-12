import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { listCandidates } from "./companion-candidates";
import {
  addTestCompanion,
  addTestProgram,
  addTestStudent,
  EVERYONE,
} from "./test-records";

const inTestDatabase = withTestDatabase();

/** The angkatan in a semester that lives in the dorm. */
const DORM_COHORTS = [2026];

interface TestRows {
  ownProgram: number;
}

/**
 * Two seniors who can be named, and one of every kind who cannot: a
 * resident, one on leave, one not active, one removed, and two who are
 * kakak pendamping already.
 */
async function addTestRows(db: Database): Promise<TestRows> {
  const ownProgram = await addTestProgram(db, "Prodi Uji Calon Sendiri");
  const otherProgram = await addTestProgram(db, "Prodi Uji Calon Lain");
  const senior = { cohortYear: 2024 };
  await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9933240002",
    name: "Sinta Calon Uji",
  });
  await addTestStudent(db, otherProgram, {
    ...senior,
    nim: "9933240001",
    name: "Bima Calon Uji",
    sex: "male",
  });
  await addTestStudent(db, ownProgram, {
    nim: "9933260003",
    name: "Penghuni Calon Uji",
  });
  await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9933240004",
    name: "Cuti Calon Uji",
    status: "on_leave",
  });
  await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9933240005",
    name: "Nonaktif Calon Uji",
    status: "inactive",
  });
  await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9933240006",
    name: "Dihapus Calon Uji",
    deletedAt: new Date(),
  });
  const named = await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9933240007",
    name: "Kakak Calon Uji",
  });
  await addTestCompanion(db, named);
  const stopped = await addTestStudent(db, ownProgram, {
    ...senior,
    nim: "9933240008",
    name: "Berhenti Calon Uji",
  });
  await addTestCompanion(db, stopped, { isActive: false });
  return { ownProgram };
}

function list(db: Database, query = "Calon Uji", visible = EVERYONE) {
  return listCandidates(db, { dormCohorts: DORM_COHORTS, visible }, query);
}

describe("listCandidates", () => {
  it("offers only active students who live in no dorm and are not kakak pendamping, by name", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      const candidates = await list(db);

      expect(candidates.shown).toEqual([
        {
          id: expect.any(String),
          name: "Bima Calon Uji",
          nim: "9933240001",
          sex: "male",
        },
        {
          id: expect.any(String),
          name: "Sinta Calon Uji",
          nim: "9933240002",
          sex: "female",
        },
      ]);
      expect(candidates.matching).toBe(2);
    });
  });

  it("finds a student by a part of the name or of the NIM", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      const byName = await list(db, "sinta calon");
      const byNim = await list(db, "9933240001");

      expect(byName.shown.map((one) => one.name)).toEqual(["Sinta Calon Uji"]);
      expect(byNim.shown.map((one) => one.name)).toEqual(["Bima Calon Uji"]);
    });
  });

  it("offers only the students the account may see", async () => {
    await inTestDatabase(async (db) => {
      const { ownProgram } = await addTestRows(db);
      const visible = and(EVERYONE, eq(students.studyProgramId, ownProgram));
      if (!visible) throw new Error("The condition was not made.");

      const candidates = await list(db, "Calon Uji", visible);

      expect(candidates.shown.map((one) => one.name)).toEqual([
        "Sinta Calon Uji",
      ]);
      expect(candidates.matching).toBe(1);
    });
  });

  it("offers nobody when nobody matches", async () => {
    await inTestDatabase(async (db) => {
      await addTestRows(db);

      expect(await list(db, "Tidak Ada Calon Uji")).toEqual({
        shown: [],
        matching: 0,
      });
    });
  });
});
