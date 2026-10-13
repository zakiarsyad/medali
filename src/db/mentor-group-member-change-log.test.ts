// Sample NIMs of this file: 9900002900 to 9900002999.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "./connect";
import {
  accounts,
  mentorGroupMemberChanges,
  mentorGroups,
  students,
  studyPrograms,
} from "./schema";
import { withTestDatabase } from "./test-database";

const inTestDatabase = withTestDatabase();

/** A student, a group and an account that a log line may name. */
async function addNamed(db: Database, nim: string) {
  const [account] = await db
    .insert(accounts)
    .values({ name: "Akun Uji" })
    .returning();
  const [program] = await db
    .insert(studyPrograms)
    .values({ name: `Prodi Log ${nim}`, code: `LOG${nim}` })
    .returning();
  if (!account || !program) throw new Error("The records were not added.");
  const cohort = {
    studyProgramId: program.id,
    cohortYear: 2026,
    entryPath: "regular" as const,
  };
  const [student] = await db
    .insert(students)
    .values({ ...cohort, nim, name: "Log Uji", sex: "female" })
    .returning();
  const [group] = await db
    .insert(mentorGroups)
    .values({ ...cohort, number: 1, startsOn: "2026-09-01" })
    .returning();
  if (!student || !group) throw new Error("The records were not added.");
  return { studentId: student.id, groupId: group.id, changedBy: account.id };
}

async function addLogLine(db: Database, nim: string): Promise<string> {
  const { studentId, groupId, changedBy } = await addNamed(db, nim);
  const [line] = await db
    .insert(mentorGroupMemberChanges)
    .values({ studentId, groupBefore: null, groupAfter: groupId, changedBy })
    .returning();
  if (!line) throw new Error("The log line was not added.");
  return line.id;
}

describe("the log of placements in a kelompok pengasuhan", () => {
  it("refuses to change a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db, "9900002901");
      const change = db
        .update(mentorGroupMemberChanges)
        .set({ groupAfter: null })
        .where(eq(mentorGroupMemberChanges.id, id));
      await expect(change).rejects.toThrow();
    });
  });

  it("refuses to delete a line", async () => {
    await inTestDatabase(async (db) => {
      const id = await addLogLine(db, "9900002902");
      const removal = db
        .delete(mentorGroupMemberChanges)
        .where(eq(mentorGroupMemberChanges.id, id));
      await expect(removal).rejects.toThrow();
    });
  });

  it("refuses to be emptied", async () => {
    await inTestDatabase(async (db) => {
      await addLogLine(db, "9900002903");
      const emptied = db.execute(sql`truncate mentor_group_member_changes`);
      await expect(emptied).rejects.toThrow();
    });
  });

  it("refuses a line for a student who stayed where they were", async () => {
    await inTestDatabase(async (db) => {
      const { studentId, groupId, changedBy } = await addNamed(
        db,
        "9900002904",
      );
      const unchanged = db.insert(mentorGroupMemberChanges).values({
        studentId,
        groupBefore: groupId,
        groupAfter: groupId,
        changedBy,
      });
      await expect(unchanged).rejects.toThrow();
    });
  });
});
