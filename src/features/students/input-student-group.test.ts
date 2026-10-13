// Sample NIMs of this file: 9900002700 to 9900002799.
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  mentorGroupMemberChanges,
  mentorGroupMembers,
  mentorGroups,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { findAddedStudent } from "./added-students";
import { GROUP_DOES_NOT_FIT, GROUP_NOT_AVAILABLE } from "./fitting-group";
import { inputStudent, NOT_ALLOWED } from "./input-student";
import { listGroupChoices } from "./mentor-group-choices";
import type { StudentInput } from "./student-input";
import { readStudentMentorGroup } from "./student-mentor-group";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
} from "./test-records";
import { visibleTo } from "./visible-students";

const inTestDatabase = withTestDatabase();

const ALLOWED: RoleId[] = ["head_of_unit", "upk_staff", "dorm_manager"];
const OTHERS = ROLE_IDS.filter((role) => !ALLOWED.includes(role));
const SAVED = { ok: true, value: null };

function newStudent(nim: string, studyProgramId: number): StudentInput {
  return {
    nim,
    name: "Susulan Uji",
    email: null,
    studyProgramId,
    entryPath: "regular",
    sex: "female",
    cohortYear: 2026,
    className: null,
    province: null,
    originAgency: null,
    status: "active",
    isAffirmation: false,
    isSeedling: false,
    isInternational: false,
    isBlended: false,
  };
}

/** A program studi with one group of angkatan 2026 reguler and its mentor. */
async function addGroup(db: Database, tag: string) {
  const program = await addTestProgram(db, `Prodi Susulan ${tag}`);
  const mentor = await addTestActor(db, `Pengasuh ${tag}`, ["mentor"]);
  const groupId = await addTestMentorGroup(db, program, {
    number: 1,
    memberIds: [],
    mentorId: mentor.id,
  });
  return { program, mentor, groupId };
}

async function idOf(db: Database, nim: string): Promise<string | undefined> {
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.nim, nim));
  return found?.id;
}

/** The students stored as members of a group, whatever their status. */
async function membersOf(db: Database, groupId: string): Promise<string[]> {
  const members = await db
    .select({ studentId: mentorGroupMembers.studentId })
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.groupId, groupId));
  return members.map((member) => member.studentId);
}

/** How many members the group's page counts: the Aktif ones. */
async function memberCount(db: Database, groupId: string): Promise<number> {
  const groups = await listGroupChoices(db);
  return groups.find((group) => group.id === groupId)?.members ?? 0;
}

/** Whether the mentor's own read of students holds the student. */
async function isSeenBy(db: Database, mentorId: string, studentId: string) {
  const mentees = visibleTo({
    kind: "some",
    studyProgramIds: [],
    menteesOf: [mentorId],
    studentIds: [],
  });
  const seen = await db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), mentees));
  return seen.length === 1;
}

describe("inputStudent with a kelompok pengasuhan chosen", () => {
  it.each(ALLOWED)(
    "lets %s put the new student in a group that fits",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { program, mentor, groupId } = await addGroup(db, "Masuk");
        const actor = await addTestActor(db, "Pegawai Uji", [role]);
        const student = newStudent("9900002701", program);

        const added = await inputStudent(db, actor, student, groupId);

        expect(added).toEqual(SAVED);
        const studentId = await idOf(db, student.nim);
        if (!studentId) throw new Error("The student was not added.");
        expect(await memberCount(db, groupId)).toBe(1);
        expect(await isSeenBy(db, mentor.id, studentId)).toBe(true);
        const inForm = await findAddedStudent(db, student.nim);
        expect(inForm?.mentorGroupId).toBe(groupId);
        const shown = await readStudentMentorGroup(db, studentId);
        expect(shown).toMatchObject({
          id: groupId,
          mentor: { name: "Pengasuh Masuk" },
        });
        const lines = await db
          .select()
          .from(mentorGroupMemberChanges)
          .where(eq(mentorGroupMemberChanges.studentId, studentId));
        expect(lines).toMatchObject([
          { groupBefore: null, groupAfter: groupId, changedBy: actor.id },
        ]);
      });
    },
  );

  it.each(OTHERS)("refuses %s, and adds nobody to the group", async (role) => {
    await inTestDatabase(async (db) => {
      const { program, groupId } = await addGroup(db, "Tolak");
      const actor = await addTestActor(db, "Akun Lain", [role]);
      const student = newStudent("9900002702", program);

      const added = await inputStudent(db, actor, student, groupId);

      expect(added).toEqual(NOT_ALLOWED);
      expect(await idOf(db, student.nim)).toBeUndefined();
      expect(await membersOf(db, groupId)).toEqual([]);
    });
  });

  it("refuses a group of another angkatan, program studi or jalur, and adds nobody", async () => {
    await inTestDatabase(async (db) => {
      const { program, mentor, groupId } = await addGroup(db, "Beda");
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const otherProgram = await addTestProgram(db, "Prodi Susulan Kedua");
      const otherYear = await addTestMentorGroup(db, program, {
        number: 1,
        memberIds: [],
        mentorId: mentor.id,
        cohortYear: 2025,
      });
      const otherPath = await addTestMentorGroup(db, program, {
        number: 1,
        memberIds: [],
        mentorId: mentor.id,
        entryPath: "transfer",
      });
      const fromOtherProgram = newStudent("9900002703", otherProgram);
      const student = newStudent("9900002704", program);

      const answers = [
        await inputStudent(db, actor, fromOtherProgram, groupId),
        await inputStudent(db, actor, student, otherYear),
        await inputStudent(db, actor, student, otherPath),
      ];

      expect(answers).toEqual([
        GROUP_DOES_NOT_FIT,
        GROUP_DOES_NOT_FIT,
        GROUP_DOES_NOT_FIT,
      ]);
      expect(await idOf(db, fromOtherProgram.nim)).toBeUndefined();
      expect(await idOf(db, student.nim)).toBeUndefined();
    });
  });

  it("refuses a group whose penetapan was cancelled, and adds nobody", async () => {
    await inTestDatabase(async (db) => {
      const { program, groupId } = await addGroup(db, "Berakhir");
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: actor.id })
        .where(eq(mentorGroups.id, groupId));
      const student = newStudent("9900002705", program);

      const added = await inputStudent(db, actor, student, groupId);

      expect(added).toEqual(GROUP_NOT_AVAILABLE);
      expect(await idOf(db, student.nim)).toBeUndefined();
    });
  });

  it("puts nobody in the group when the NIM is already used", async () => {
    await inTestDatabase(async (db) => {
      const { program, groupId } = await addGroup(db, "Terpakai");
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const student = newStudent("9900002706", program);
      await inputStudent(db, actor, student);

      const again = await inputStudent(db, actor, student, groupId);

      expect(again).toEqual({
        ok: false,
        error: "NIM 9900002706 sudah terdaftar.",
      });
      expect(await membersOf(db, groupId)).toEqual([]);
    });
  });

  it.each(["on_leave", "inactive"] as const)(
    "puts a student whose status is %s in a group too, without counting them",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { program, groupId } = await addGroup(db, "Cuti");
        const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
        const student = { ...newStudent("9900002707", program), status };

        const added = await inputStudent(db, actor, student, groupId);

        expect(added).toEqual(SAVED);
        expect(await membersOf(db, groupId)).toHaveLength(1);
        expect(await memberCount(db, groupId)).toBe(0);
      });
    },
  );

  it("adds a student in no group when none is chosen, and logs no placement", async () => {
    await inTestDatabase(async (db) => {
      const { program, groupId } = await addGroup(db, "Kosong");
      const actor = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
      const student = newStudent("9900002708", program);

      const added = await inputStudent(db, actor, student, null);

      expect(added).toEqual(SAVED);
      const studentId = await idOf(db, student.nim);
      if (!studentId) throw new Error("The student was not added.");
      expect(await membersOf(db, groupId)).toEqual([]);
      expect(await readStudentMentorGroup(db, studentId)).toBeNull();
      const lines = await db
        .select()
        .from(mentorGroupMemberChanges)
        .where(eq(mentorGroupMemberChanges.studentId, studentId));
      expect(lines).toEqual([]);
    });
  });
});
