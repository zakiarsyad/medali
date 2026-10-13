// Sample NIMs of this file: 9900003200 to 9900003299.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { countStudents, listAddedStudents } from "./added-students";
import { removeStudent } from "./change-student";
import { inputStudent } from "./input-student";
import type { StudentInput } from "./student-input";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

function newStudent(
  nim: string,
  studyProgramId: number,
  status: StudentInput["status"] = "active",
): StudentInput {
  return {
    nim,
    name: `Daftar ${nim}`,
    email: null,
    studyProgramId,
    entryPath: "regular",
    sex: "female",
    cohortYear: 2026,
    className: null,
    province: null,
    originAgency: null,
    status,
    isAffirmation: false,
    isSeedling: false,
    isInternational: false,
    isBlended: false,
  };
}

/** A program studi with one group and its mentor, and a staff account. */
async function addGroup(db: Database, code: string) {
  const program = await addTestProgram(db, code);
  const staff = await addTestActor(db, "Pegawai Daftar", ["upk_staff"]);
  const mentor = await addTestActor(db, "Pengasuh Daftar", ["mentor"]);
  const earlier = await addTestActor(db, "Pengasuh Dulu", ["mentor"]);
  const groupId = await addTestMentorGroup(db, program, {
    number: 4,
    memberIds: [],
    mentorId: mentor.id,
    earlierMentorId: earlier.id,
  });
  return { program, staff, groupId };
}

describe("listAddedStudents", () => {
  it("names the group of each student once, with its mentor of today, and none for a student in no group", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff, groupId } = await addGroup(db, "DAFTARKP");
      await inputStudent(db, staff, newStudent("9900003201", program), groupId);
      await inputStudent(db, staff, newStudent("9900003202", program));

      const listed = await listAddedStudents(db, "99000032", []);

      const groups = listed.students.map(({ nim, group }) => [nim, group]);
      expect(groups.sort()).toEqual([
        [
          "9900003201",
          {
            cohortYear: 2026,
            entryPath: "regular",
            number: 4,
            programCode: "DAFTARKP",
            mentorName: "Pengasuh Daftar",
          },
        ],
        ["9900003202", null],
      ]);
      expect(listed.matching).toBe(2);
    });
  });
});

describe("countStudents", () => {
  it("counts as without a group the Aktif students put in here who are in none", async () => {
    await inTestDatabase(async (db) => {
      const { program, staff, groupId } = await addGroup(db, "HITUNGKP");
      const before = await countStudents(db, []);
      await inputStudent(db, staff, newStudent("9900003211", program), groupId);
      await inputStudent(db, staff, newStudent("9900003212", program));
      await inputStudent(db, staff, newStudent("9900003213", program));
      await inputStudent(
        db,
        staff,
        newStudent("9900003214", program, "on_leave"),
      );
      await inputStudent(
        db,
        staff,
        newStudent("9900003215", program, "inactive"),
      );
      await addTestStudent(db, program, { nim: "9900003216", name: "Induk" });
      await removeStudent(db, staff, "9900003213");

      const after = await countStudents(db, []);

      expect(after.addedWithoutGroup - before.addedWithoutGroup).toBe(1);
      expect(after.total - before.total).toBe(5);
      expect(after.added - before.added).toBe(4);
    });
  });
});
