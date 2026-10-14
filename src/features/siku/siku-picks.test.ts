// Sample Tahun akademik of this file: 2904 to 2904.
// Sample NIMs of this file: 9964000500 to 9964000599.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { mentorGroups, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  readGroupChoices,
  readGroupPicks,
  searchSikuStudents,
} from "./siku-picks";
import {
  addTestActor,
  addTestEntry,
  addTestGroup,
  addTestStudents,
  addTestYear,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

async function addRecords(db: Database) {
  const periods = await addTestYear(db, 2904);
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Pilih SIKU",
    2904,
    ["9964000501", "9964000502", "9964000503"],
  );
  const [ani, budi, citra] = studentIds;
  if (!ani || !budi || !citra) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Pilih", ["assessor"]);
  await addTestEntry(db, penilai, {
    kind: "gain",
    reason: "peer_mentoring",
    points: 4,
    day: "2904-10-12",
    periodId: periods.odd,
    studentIds: [ani],
  });
  const mentor = await addTestActor(db, "Pengasuh Uji Pilih", ["mentor"]);
  const groupId = await addTestGroup(
    db,
    { programId, year: 2904, number: 1 },
    mentor.id,
    [ani, budi, citra],
  );
  await db
    .update(students)
    .set({ status: "on_leave" })
    .where(eq(students.id, citra));
  return { ani, budi, citra, groupId };
}

describe("searchSikuStudents", () => {
  it("finds Aktif students by NIM, with the points they hold now", async () => {
    await inTestDatabase(async (db) => {
      const { ani } = await addRecords(db);

      const found = await searchSikuStudents(db, "996400050");

      expect(found.map((pick) => [pick.nim, pick.gains, pick.losses])).toEqual([
        ["9964000501", 4, 0],
        ["9964000502", 0, 0],
      ]);
      expect(found[0]?.id).toBe(ani);
    });
  });

  it("finds nobody for an empty text or what is no text", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      expect(await searchSikuStudents(db, " ")).toEqual([]);
      expect(await searchSikuStudents(db, 42)).toEqual([]);
    });
  });
});

describe("readGroupPicks", () => {
  it("gives the Aktif members of a group in force, and nobody for an ended group or no group", async () => {
    await inTestDatabase(async (db) => {
      const { ani, budi, groupId } = await addRecords(db);

      const picks = await readGroupPicks(db, groupId);

      expect(picks.map((pick) => pick.id)).toEqual([ani, budi]);
      expect(await readGroupPicks(db, "bukan-kunci")).toEqual([]);
      const ender = await addTestActor(db, "Pengakhir Uji Pilih", [
        "head_of_unit",
      ]);
      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: ender.id })
        .where(eq(mentorGroups.id, groupId));
      expect(await readGroupPicks(db, groupId)).toEqual([]);
    });
  });
});

describe("readGroupChoices", () => {
  it("offers a group in force by its code, with how many Aktif students it holds", async () => {
    await inTestDatabase(async (db) => {
      const { groupId } = await addRecords(db);

      const choices = await readGroupChoices(db);

      expect(choices.find((choice) => choice.id === groupId)).toEqual({
        id: groupId,
        code: "KP 04-Prodi Uji Pilih SIKU-01",
        members: 2,
      });
    });
  });
});
