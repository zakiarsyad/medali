// Sample NIMs of this file: 9986200500 to 9986200599.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { mentorGroups, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readFitnessGroupChoices, readGroupMembers } from "./fitness-groups";
import {
  addTestActor,
  addTestGroup,
  addTestScores,
  addTestStudents,
} from "./test-fitness";

const inTestDatabase = withTestDatabase();

describe("readGroupMembers", () => {
  it("gives the Aktif members of the group by name, each with Skor saat ini", async () => {
    await inTestDatabase(async (db) => {
      const { programId, studentIds } = await addTestStudents(
        db,
        "Prodi Uji Kelompok Jasmani",
        ["9986200501", "9986200502", "9986200503"],
      );
      const [ani = "", budi = "", citra = ""] = studentIds;
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, citra));
      const groupId = await addTestGroup(db, programId, studentIds);
      const penilai = await addTestActor(db, "Penilai Uji Kelompok", [
        "assessor",
      ]);
      await addTestScores(db, penilai, {
        groupId,
        testedOn: "2026-10-01",
        enteredAt: new Date("2026-10-01T03:00:00Z"),
        scores: [{ studentId: budi, score: 66 }],
      });

      expect(await readGroupMembers(db, penilai, groupId)).toEqual([
        {
          id: ani,
          name: "Mahasiswa Uji Jasmani 1",
          nim: "9986200501",
          latestScore: null,
        },
        {
          id: budi,
          name: "Mahasiswa Uji Jasmani 2",
          nim: "9986200502",
          latestScore: 66,
        },
      ]);
    });
  });

  it("gives nobody for a group that is not in force, or for what is no key", async () => {
    await inTestDatabase(async (db) => {
      const { programId, studentIds } = await addTestStudents(
        db,
        "Prodi Uji Kelompok Jasmani",
        ["9986200511"],
      );
      const groupId = await addTestGroup(db, programId, studentIds);
      const penilai = await addTestActor(db, "Penilai Uji Kelompok", [
        "assessor",
      ]);
      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: penilai.id })
        .where(eq(mentorGroups.id, groupId));

      expect(await readGroupMembers(db, penilai, groupId)).toEqual([]);
      expect(await readGroupMembers(db, penilai, "bukan-kunci")).toEqual([]);
    });
  });

  it("gives nobody to an account without the right Penilaian jasmani", async () => {
    await inTestDatabase(async (db) => {
      const { programId, studentIds } = await addTestStudents(
        db,
        "Prodi Uji Kelompok Jasmani",
        ["9986200521"],
      );
      const mentor = await addTestActor(db, "Pengasuh Uji Kelompok", [
        "mentor",
      ]);
      const groupId = await addTestGroup(db, programId, studentIds, {
        mentorId: mentor.id,
      });

      expect(await readGroupMembers(db, mentor, groupId)).toEqual([]);
    });
  });
});

describe("readFitnessGroupChoices", () => {
  it("offers the groups in force that hold an Aktif student, with how many", async () => {
    await inTestDatabase(async (db) => {
      const { programId, studentIds } = await addTestStudents(db, "PUKJ", [
        "9986200531",
        "9986200532",
      ]);
      const [ani = "", budi = ""] = studentIds;
      const withTwo = await addTestGroup(db, programId, [ani, budi]);
      const empty = await addTestGroup(db, programId, [], { number: 2 });

      const choices = await readFitnessGroupChoices(db);

      expect(choices).toContainEqual({
        id: withTwo,
        code: "KP 26-PUKJ-01",
        members: 2,
      });
      expect(choices.map((choice) => choice.id)).not.toContain(empty);
    });
  });
});
