// Sample NIMs of this file: 9900002600 to 9900002699.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { mentorGroupMemberChanges, mentorGroupMembers } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { moveToGroup } from "./move-to-group";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
  addTestStudent,
} from "./test-records";

const inTestDatabase = withTestDatabase();

/** A student in no group, two groups that could take them, and a staff account. */
async function addStudentAndGroups(db: Database, nim: string) {
  const program = await addTestProgram(db, `Prodi Pindah ${nim}`);
  const staff = await addTestActor(db, "Pegawai Pindah", ["upk_staff"]);
  const mentor = await addTestActor(db, "Pengasuh Pindah", ["mentor"]);
  const studentId = await addTestStudent(db, program, { nim, name: "Pindah" });
  const first = await addTestMentorGroup(db, program, {
    number: 1,
    memberIds: [],
    mentorId: mentor.id,
  });
  const second = await addTestMentorGroup(db, program, {
    number: 2,
    memberIds: [],
    mentorId: mentor.id,
  });
  return { staff, studentId, first, second };
}

async function groupOf(db: Database, studentId: string) {
  const [member] = await db
    .select()
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.studentId, studentId));
  return member?.groupId ?? null;
}

/** The log lines of one student, the oldest first: before, after and who. */
async function linesOf(db: Database, studentId: string) {
  const lines = await db
    .select()
    .from(mentorGroupMemberChanges)
    .where(eq(mentorGroupMemberChanges.studentId, studentId))
    .orderBy(asc(mentorGroupMemberChanges.changedAt));
  return lines.map((line) => [
    line.groupBefore,
    line.groupAfter,
    line.changedBy,
  ]);
}

describe("moveToGroup", () => {
  it("lets a student join a group, logged with none before", async () => {
    await inTestDatabase(async (db) => {
      const made = await addStudentAndGroups(db, "9900002601");

      await moveToGroup(db, made.studentId, made.first, made.staff.id);

      expect(await groupOf(db, made.studentId)).toBe(made.first);
      expect(await linesOf(db, made.studentId)).toEqual([
        [null, made.first, made.staff.id],
      ]);
    });
  });

  it("moves a student to another group, logged with both", async () => {
    await inTestDatabase(async (db) => {
      const made = await addStudentAndGroups(db, "9900002602");
      await moveToGroup(db, made.studentId, made.first, made.staff.id);

      await moveToGroup(db, made.studentId, made.second, made.staff.id);

      expect(await groupOf(db, made.studentId)).toBe(made.second);
      expect(await linesOf(db, made.studentId)).toContainEqual([
        made.first,
        made.second,
        made.staff.id,
      ]);
    });
  });

  it("takes a student back to no group, logged with none after", async () => {
    await inTestDatabase(async (db) => {
      const made = await addStudentAndGroups(db, "9900002603");
      await moveToGroup(db, made.studentId, made.first, made.staff.id);

      await moveToGroup(db, made.studentId, null, made.staff.id);

      expect(await groupOf(db, made.studentId)).toBeNull();
      expect(await linesOf(db, made.studentId)).toContainEqual([
        made.first,
        null,
        made.staff.id,
      ]);
    });
  });

  it("logs nothing for a student who stays where they are", async () => {
    await inTestDatabase(async (db) => {
      const made = await addStudentAndGroups(db, "9900002604");

      await moveToGroup(db, made.studentId, null, made.staff.id);
      await moveToGroup(db, made.studentId, made.first, made.staff.id);
      await moveToGroup(db, made.studentId, made.first, made.staff.id);

      expect(await groupOf(db, made.studentId)).toBe(made.first);
      expect(await linesOf(db, made.studentId)).toHaveLength(1);
    });
  });
});
