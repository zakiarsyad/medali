// Sample NIMs of this file: 9900003000 to 9900003099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { mentorGroups } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { listGroupChoices } from "./mentor-group-choices";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

describe("listGroupChoices", () => {
  it("gives each group in force once, with its mentor of today and its Aktif members", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "PILIHKP");
      const earlier = await addTestActor(db, "Pengasuh Lama", ["mentor"]);
      const mentor = await addTestActor(db, "Pengasuh Kini", ["mentor"]);
      const active = await addTestStudent(db, program, {
        nim: "9900003001",
        name: "Aktif",
      });
      const onLeave = await addTestStudent(db, program, {
        nim: "9900003002",
        name: "Cuti",
        status: "on_leave",
      });
      const groupId = await addTestMentorGroup(db, program, {
        number: 3,
        memberIds: [active, onLeave],
        mentorId: mentor.id,
        earlierMentorId: earlier.id,
      });

      const choices = await listGroupChoices(db);

      expect(choices.filter((choice) => choice.id === groupId)).toEqual([
        {
          id: groupId,
          studyProgramId: program,
          cohortYear: 2026,
          entryPath: "regular",
          number: 3,
          programCode: "PILIHKP",
          mentorName: "Pengasuh Kini",
          members: 1,
        },
      ]);
    });
  });

  it("leaves out a group whose penetapan was cancelled", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "PILIHBATAL");
      const mentor = await addTestActor(db, "Pengasuh Batal", ["mentor"]);
      const groupId = await addTestMentorGroup(db, program, {
        number: 1,
        memberIds: [],
        mentorId: mentor.id,
      });
      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: mentor.id })
        .where(eq(mentorGroups.id, groupId));

      const choices = await listGroupChoices(db);

      expect(choices.some((choice) => choice.id === groupId)).toBe(false);
    });
  });
});
