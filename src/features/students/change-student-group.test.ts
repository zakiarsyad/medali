// Sample NIMs of this file: 9900003400 to 9900003499.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS, type RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { mentorGroupMembers, mentorGroups, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { findAddedStudent } from "./added-students";
import {
  changeStudent,
  removeStudent,
  STUDENT_CHANGED,
} from "./change-student";
import { GROUP_DOES_NOT_FIT, GROUP_NOT_AVAILABLE } from "./fitting-group";
import { inputStudent, NOT_ALLOWED } from "./input-student";
import type { StudentInput } from "./student-input";
import { readStudentMentorGroup } from "./student-mentor-group";
import {
  isSeenBy,
  memberCount,
  membersOf,
  placementsOf,
} from "./test-group-reads";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const ALLOWED: RoleId[] = ["head_of_unit", "upk_staff", "dorm_manager"];
const OTHERS = ROLE_IDS.filter((role) => !ALLOWED.includes(role));
const SAVED = { ok: true, value: null };

function studentOf(nim: string, studyProgramId: number): StudentInput {
  return {
    nim,
    name: "Pindah Uji",
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

async function idOf(db: Database, nim: string): Promise<string> {
  const [found] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.nim, nim));
  if (!found) throw new Error("The student was not added.");
  return found.id;
}

/**
 * A student put in through the tab into the first of two groups of their
 * angkatan, program studi and jalur, each with a mentor of its own.
 */
async function addPlacedStudent(db: Database, nim: string) {
  const program = await addTestProgram(db, `Prodi Pindah ${nim}`);
  const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
  const oldMentor = await addTestActor(db, "Pengasuh Lama", ["mentor"]);
  const newMentor = await addTestActor(db, "Pengasuh Baru", ["mentor"]);
  const oldGroup = await addTestMentorGroup(db, program, {
    number: 1,
    memberIds: [],
    mentorId: oldMentor.id,
  });
  const newGroup = await addTestMentorGroup(db, program, {
    number: 2,
    memberIds: [],
    mentorId: newMentor.id,
  });
  const student = studentOf(nim, program);
  const added = await inputStudent(db, staff, student, oldGroup);
  if (!added.ok) throw new Error(added.error);
  const studentId = await idOf(db, nim);
  return {
    program,
    staff,
    oldMentor,
    newMentor,
    oldGroup,
    newGroup,
    student,
    studentId,
  };
}

describe("changeStudent with a kelompok pengasuhan chosen", () => {
  it.each(ALLOWED)(
    "lets %s move a student to another group: out of the old list and count, into the new, unseen by the old mentor, and logged",
    async (role) => {
      await inTestDatabase(async (db) => {
        const made = await addPlacedStudent(db, "9900003401");
        const mover = await addTestActor(db, "Pemindah Uji", [role]);

        const moved = await changeStudent(db, mover, made.student, {
          mentorGroupId: made.newGroup,
          openedGroupId: made.oldGroup,
          version: 1,
        });

        expect(moved).toEqual(SAVED);
        expect(await membersOf(db, made.oldGroup)).toEqual([]);
        expect(await memberCount(db, made.oldGroup)).toBe(0);
        expect(await membersOf(db, made.newGroup)).toEqual([made.studentId]);
        expect(await memberCount(db, made.newGroup)).toBe(1);
        expect(await isSeenBy(db, made.oldMentor.id, made.studentId)).toBe(
          false,
        );
        expect(await isSeenBy(db, made.newMentor.id, made.studentId)).toBe(
          true,
        );
        const shown = await readStudentMentorGroup(db, made.studentId);
        expect(shown).toMatchObject({ id: made.newGroup });
        expect(await placementsOf(db, made.studentId)).toContainEqual([
          made.oldGroup,
          made.newGroup,
          mover.id,
        ]);
      });
    },
  );

  it("takes a student back to no group, unseen by the mentor, and logs it", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003402");

      const changed = await changeStudent(db, made.staff, made.student, {
        mentorGroupId: null,
        openedGroupId: made.oldGroup,
        version: 1,
      });

      expect(changed).toEqual(SAVED);
      expect(await membersOf(db, made.oldGroup)).toEqual([]);
      expect(await isSeenBy(db, made.oldMentor.id, made.studentId)).toBe(false);
      expect(await readStudentMentorGroup(db, made.studentId)).toBeNull();
      const inForm = await findAddedStudent(db, made.student.nim);
      expect(inForm?.mentorGroupId).toBeNull();
      expect(await placementsOf(db, made.studentId)).toContainEqual([
        made.oldGroup,
        null,
        made.staff.id,
      ]);
    });
  });

  it("puts a student who had no group in one, and logs it", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003403");
      const late = studentOf("9900003404", made.program);
      await inputStudent(db, made.staff, late);

      const changed = await changeStudent(db, made.staff, late, {
        mentorGroupId: made.newGroup,
        openedGroupId: null,
        version: 1,
      });

      expect(changed).toEqual(SAVED);
      const lateId = await idOf(db, late.nim);
      expect(await membersOf(db, made.newGroup)).toEqual([lateId]);
      expect(await placementsOf(db, lateId)).toEqual([
        [null, made.newGroup, made.staff.id],
      ]);
    });
  });

  it("logs nothing when the group stays the same and other data changes", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003405");
      const renamed = { ...made.student, name: "Pindah Uji Baru" };

      const changed = await changeStudent(db, made.staff, renamed, {
        mentorGroupId: made.oldGroup,
        openedGroupId: made.oldGroup,
        version: 1,
      });

      expect(changed).toEqual(SAVED);
      expect(await membersOf(db, made.oldGroup)).toEqual([made.studentId]);
      expect(await placementsOf(db, made.studentId)).toHaveLength(1);
      const inForm = await findAddedStudent(db, made.student.nim);
      expect(inForm?.name).toBe("Pindah Uji Baru");
    });
  });

  it("refuses a group of another angkatan, program studi or jalur, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003406");
      const otherProgram = await addTestProgram(db, "Prodi Pindah Kedua");
      const groupOf = (other: object) =>
        addTestMentorGroup(db, made.program, {
          number: 3,
          memberIds: [],
          mentorId: made.newMentor.id,
          ...other,
        });
      const otherGroups = [
        await groupOf({ cohortYear: 2025 }),
        await groupOf({ entryPath: "transfer" }),
        await addTestMentorGroup(db, otherProgram, {
          number: 1,
          memberIds: [],
          mentorId: made.newMentor.id,
        }),
      ];
      const renamed = { ...made.student, name: "Tidak Tersimpan" };

      for (const mentorGroupId of otherGroups) {
        const changed = await changeStudent(db, made.staff, renamed, {
          mentorGroupId,
          openedGroupId: made.oldGroup,
          version: 1,
        });
        expect(changed).toEqual(GROUP_DOES_NOT_FIT);
      }

      expect(await membersOf(db, made.oldGroup)).toEqual([made.studentId]);
      const inForm = await findAddedStudent(db, made.student.nim);
      expect(inForm?.name).toBe("Pindah Uji");
    });
  });

  it("refuses the student's own group once their angkatan is changed away from it", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003407");
      const otherYear = { ...made.student, cohortYear: 2025 };

      const changed = await changeStudent(db, made.staff, otherYear, {
        mentorGroupId: made.oldGroup,
        openedGroupId: made.oldGroup,
        version: 1,
      });

      expect(changed).toEqual(GROUP_DOES_NOT_FIT);
      const inForm = await findAddedStudent(db, made.student.nim);
      expect(inForm).toMatchObject({
        cohortYear: 2026,
        mentorGroupId: made.oldGroup,
      });
    });
  });

  it("refuses a group whose penetapan was cancelled, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003408");
      await db
        .update(mentorGroups)
        .set({ endedAt: new Date(), endedBy: made.staff.id })
        .where(eq(mentorGroups.id, made.newGroup));

      const changed = await changeStudent(db, made.staff, made.student, {
        mentorGroupId: made.newGroup,
        openedGroupId: made.oldGroup,
        version: 1,
      });

      expect(changed).toEqual(GROUP_NOT_AVAILABLE);
      expect(await membersOf(db, made.oldGroup)).toEqual([made.studentId]);
    });
  });

  it.each(OTHERS)(
    "refuses %s, and the student stays in their group",
    async (role) => {
      await inTestDatabase(async (db) => {
        const made = await addPlacedStudent(db, "9900003409");
        const other = await addTestActor(db, "Akun Lain", [role]);

        const changed = await changeStudent(db, other, made.student, {
          mentorGroupId: made.newGroup,
          openedGroupId: made.oldGroup,
          version: 1,
        });

        expect(changed).toEqual(NOT_ALLOWED);
        expect(await membersOf(db, made.oldGroup)).toEqual([made.studentId]);
        expect(await membersOf(db, made.newGroup)).toEqual([]);
      });
    },
  );
});

describe("changeStudent from a form opened before the student's group changed", () => {
  it("refuses the change of a student given a group since, who stays in it, with nothing changed or logged", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003414");
      const late = studentOf("9900003415", made.program);
      await inputStudent(db, made.staff, late);
      const lateId = await idOf(db, late.nim);
      await db
        .insert(mentorGroupMembers)
        .values({ studentId: lateId, groupId: made.newGroup });

      const changed = await changeStudent(
        db,
        made.staff,
        { ...late, name: "Tidak Tersimpan" },
        { mentorGroupId: null, openedGroupId: null, version: 1 },
      );

      expect(changed).toEqual(STUDENT_CHANGED);
      expect(await membersOf(db, made.newGroup)).toEqual([lateId]);
      expect(await findAddedStudent(db, late.nim)).toMatchObject({
        name: "Pindah Uji",
        version: 1,
      });
      expect(await placementsOf(db, lateId)).toEqual([]);
    });
  });

  it("refuses the change of a student taken out of their group since, who is not put back", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003416");
      await db
        .delete(mentorGroupMembers)
        .where(eq(mentorGroupMembers.studentId, made.studentId));

      const changed = await changeStudent(
        db,
        made.staff,
        { ...made.student, name: "Tidak Tersimpan" },
        {
          mentorGroupId: made.oldGroup,
          openedGroupId: made.oldGroup,
          version: 1,
        },
      );

      expect(changed).toEqual(STUDENT_CHANGED);
      expect(await membersOf(db, made.oldGroup)).toEqual([]);
      expect(await findAddedStudent(db, made.student.nim)).toMatchObject({
        name: "Pindah Uji",
        mentorGroupId: null,
        version: 1,
      });
      expect(await placementsOf(db, made.studentId)).toEqual([
        [null, made.oldGroup, made.staff.id],
      ]);
    });
  });
});

describe("removeStudent for a student in a kelompok pengasuhan", () => {
  it("takes the student out of the group's list and count, and logs which group they left", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003410");
      const remover = await addTestActor(db, "Penghapus Uji", ["head_of_unit"]);

      const removed = await removeStudent(db, remover, made.student.nim);

      expect(removed.ok).toBe(true);
      expect(await membersOf(db, made.oldGroup)).toEqual([]);
      expect(await memberCount(db, made.oldGroup)).toBe(0);
      expect(await isSeenBy(db, made.oldMentor.id, made.studentId)).toBe(false);
      expect(await placementsOf(db, made.studentId)).toContainEqual([
        made.oldGroup,
        null,
        remover.id,
      ]);
    });
  });

  it("logs no placement for a removed student who was in no group", async () => {
    await inTestDatabase(async (db) => {
      const made = await addPlacedStudent(db, "9900003411");
      const late = studentOf("9900003412", made.program);
      await inputStudent(db, made.staff, late);
      const lateId = await idOf(db, late.nim);

      await removeStudent(db, made.staff, late.nim);

      expect(await placementsOf(db, lateId)).toEqual([]);
    });
  });

  it.each(OTHERS)(
    "refuses %s, and the student stays in their group",
    async (role) => {
      await inTestDatabase(async (db) => {
        const made = await addPlacedStudent(db, "9900003413");
        const other = await addTestActor(db, "Akun Lain", [role]);

        const removed = await removeStudent(db, other, made.student.nim);

        expect(removed).toEqual(NOT_ALLOWED);
        expect(await membersOf(db, made.oldGroup)).toEqual([made.studentId]);
      });
    },
  );
});
