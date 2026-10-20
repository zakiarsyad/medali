// Sample NIMs of this file: 9988600500 to 9988600599.
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readCampusScreenedCount } from "./screening-count";
import { addTestActor, addTestPeople } from "./test-consents";
import { addTestScreening } from "./test-screenings";

const inTestDatabase = withTestDatabase();

const COUNTERS: RoleId[] = [
  "head_of_unit",
  "director",
  "head_of_program",
  "mentor",
];

/** Screened students, the first of them twice. */
async function addScreened(db: Database, nims: string[]) {
  const people = await addTestPeople(db, "Prodi Uji Hitung Asesmen", nims);
  const by = people.counsellor.id;
  for (const studentId of people.studentIds) {
    await addTestScreening(db, studentId, by);
  }
  const [first = ""] = people.studentIds;
  await addTestScreening(db, first, by, { screenedOn: "2026-10-13" });
}

async function countsOf(db: Database): Promise<(string | null)[]> {
  const counts: (string | null)[] = [];
  for (const role of COUNTERS) {
    const actor = await addTestActor(db, "Penghitung Uji", [role]);
    counts.push(await readCampusScreenedCount(db, actor));
  }
  return counts;
}

describe("Sudah diasesmen for the whole campus", () => {
  it("is 0 when nobody is screened", async () => {
    await inTestDatabase(async (db) => {
      expect(await countsOf(db)).toEqual(["0", "0", "0", "0"]);
    });
  });

  it("sends <5 and no smaller number for 1 to 4 screened students, the same to all four roles", async () => {
    await inTestDatabase(async (db) => {
      await addScreened(db, ["9988600501", "9988600502", "9988600503"]);
      expect(await countsOf(db)).toEqual(["<5", "<5", "<5", "<5"]);
    });
  });

  it("counts each student once from 5 on", async () => {
    await inTestDatabase(async (db) => {
      await addScreened(db, [
        "9988600511",
        "9988600512",
        "9988600513",
        "9988600514",
        "9988600515",
      ]);
      expect(await countsOf(db)).toEqual(["5", "5", "5", "5"]);
    });
  });

  it.each<RoleId>([
    "counsellor",
    "assessor",
    "upk_staff",
    "dorm_manager",
    "bam_health",
    "discipline_officer",
    "student",
  ])("is not sent to %s", async (role) => {
    await inTestDatabase(async (db) => {
      await addScreened(db, ["9988600521"]);
      const other = await addTestActor(db, "Bukan Penghitung", [role]);
      expect(await readCampusScreenedCount(db, other)).toBeNull();
    });
  });
});
