// Sample Tahun akademik of this file: 7401 to 7401.
// Sample NIMs of this file: 9961000700 to 9961000799.
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { type AccountForAccess, may } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { coachingStatuses, mentoringNotes } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readGroupPage } from "./group-page";
import {
  addTestGroup,
  addTestMembers,
  addTestMentor,
  addTestMentorLine,
  addTestProgram,
  addTestStudent,
} from "./test-records";
import { addTestAssessor, addTestScoredMember, allScores } from "./test-scores";
import { groupRowsFor } from "./visible-groups";

const inTestDatabase = withTestDatabase();

const TODAY = "2026-10-13";

/** A group of one program with a member who has two notes of this month. */
async function addRecords(db: Database) {
  const programId = await addTestProgram(db, "UJIHALAMANKELOMPOK");
  const otherProgramId = await addTestProgram(db, "UJIHALAMANKELOMPOK-LAIN");
  const groupId = await addTestGroup(db, programId);
  const mentorId = await addTestMentor(db, { name: "Pengasuh Uji Halaman" });
  await addTestMentorLine(db, groupId, mentorId);
  const member = await addTestStudent(db, programId, {
    nim: "9961000701",
    name: "Anggota Uji Halaman",
  });
  await addTestMembers(db, groupId, [member]);
  for (const happenedOn of ["2026-10-01", TODAY]) {
    await db.insert(mentoringNotes).values({
      id: randomUUID(),
      studentId: member,
      writtenBy: mentorId,
      kind: "appreciation",
      happenedOn,
      valueKeys: ["E"],
      note: "Catatan uji.",
      followUp: "none",
    });
  }
  return { programId, otherProgramId, groupId };
}

/** What the screen is given for a group, as an account with these roles asks. */
function pageFor(
  db: Database,
  groupId: string,
  roles: RoleId[],
  studyProgramId: number | null = null,
) {
  const account: AccountForAccess = {
    id: "0b4f6c1e-6f0e-4f55-9d0a-0d3c1e2f8001",
    roles,
    studyProgramId,
    studentId: null,
  };
  const limit = groupRowsFor(account);
  if (limit === null) throw new Error("This account may not see groups.");
  return readGroupPage(db, limit, groupId, null, 1, TODAY);
}

describe("readGroupPage", () => {
  it("gives Pegawai UPK, who has no right to read a note, the group with its count", async () => {
    await inTestDatabase(async (db) => {
      const { groupId } = await addRecords(db);

      const page = await pageFor(db, groupId, ["upk_staff"]);

      expect(page).toMatchObject({
        kind: "found",
        group: { id: groupId },
        recentNotes: 2,
        needsCoaching: { students: 0, percent: 0 },
      });
      expect(may(["upk_staff"], "view_mentoring_notes")).toBe(false);
      expect(may(["upk_staff"], "view_student_detail")).toBe(false);
    });
  });

  it.each(["head_of_unit", "director"] as const)(
    "gives %s the group with the same count",
    (role) => {
      return inTestDatabase(async (db) => {
        const { groupId } = await addRecords(db);

        const page = await pageFor(db, groupId, [role]);

        expect(page).toMatchObject({ kind: "found", recentNotes: 2 });
      });
    },
  );

  it("gives Ketua Program Studi the group of their own program with its count", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, programId } = await addRecords(db);

      const page = await pageFor(db, groupId, ["head_of_program"], programId);

      expect(page).toMatchObject({ kind: "found", recentNotes: 2 });
    });
  });

  it("gives Perlu pembinaan out of the Aktif members, leaving out one on Cuti", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, programId } = await addRecords(db);
      const group = {
        id: groupId,
        programId,
        by: await addTestAssessor(db, 7401),
      };
      const listed = allScores(60);
      await addTestScoredMember(db, group, "9961000702", listed);
      const done = await addTestScoredMember(db, group, "9961000703", listed);
      await db.insert(coachingStatuses).values({
        studentId: done,
        status: "done",
        changedBy: group.by.enteredBy,
        changedAt: new Date(),
      });
      await addTestScoredMember(db, group, "9961000704", allScores(80));
      await addTestScoredMember(db, group, "9961000705", listed, {
        status: "on_leave",
      });

      const page = await pageFor(db, groupId, ["head_of_program"], programId);

      expect(page).toMatchObject({
        kind: "found",
        needsCoaching: { students: 1, percent: 25 },
      });
    });
  });

  it("refuses Ketua Program Studi a group outside their program, with no count", async () => {
    await inTestDatabase(async (db) => {
      const { groupId, otherProgramId } = await addRecords(db);

      const page = await pageFor(
        db,
        groupId,
        ["head_of_program"],
        otherProgramId,
      );

      expect(page).toEqual({ kind: "refused" });
      expect(page).not.toHaveProperty("recentNotes");
      expect(page).not.toHaveProperty("needsCoaching");
    });
  });

  it("answers for what is no group as not found, with no count", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      const page = await pageFor(db, randomUUID(), ["upk_staff"]);

      expect(page).toEqual({ kind: "not_found" });
    });
  });
});
