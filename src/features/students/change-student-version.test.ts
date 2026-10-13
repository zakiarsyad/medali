// Sample NIMs of this file: 9900003500 to 9900003599.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { findAddedStudent } from "./added-students";
import { changeStudent, STUDENT_CHANGED } from "./change-student";
import { inputStudent } from "./input-student";
import type { StudentInput } from "./student-input";
import { membersOf } from "./test-group-reads";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const SAVED = { ok: true, value: null };

/** A student put in through the tab, in no group, and a group that fits. */
async function addStudentAndGroup(db: Database, nim: string) {
  const program = await addTestProgram(db, `Prodi Versi ${nim}`);
  const staff = await addTestActor(db, "Pegawai Uji", ["upk_staff"]);
  const mentor = await addTestActor(db, "Pengasuh Uji", ["mentor"]);
  const groupId = await addTestMentorGroup(db, program, {
    number: 1,
    memberIds: [],
    mentorId: mentor.id,
  });
  const student: StudentInput = {
    nim,
    name: "Versi Uji",
    email: null,
    studyProgramId: program,
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
  const added = await inputStudent(db, staff, student);
  if (!added.ok) throw new Error(added.error);
  return { staff, groupId, student };
}

describe("changeStudent and the version of the record", () => {
  it("starts a new student at version 1, and raises it by one with each change saved", async () => {
    await inTestDatabase(async (db) => {
      const { staff, student } = await addStudentAndGroup(db, "9900003501");
      const opened = await findAddedStudent(db, student.nim);

      const first = await changeStudent(db, staff, student, {
        mentorGroupId: null,
        version: 1,
      });
      const second = await changeStudent(db, staff, student, {
        mentorGroupId: null,
        version: 2,
      });

      expect(opened?.version).toBe(1);
      expect([first, second]).toEqual([SAVED, SAVED]);
      expect((await findAddedStudent(db, student.nim))?.version).toBe(3);
    });
  });

  it("refuses a change sent from an older version, and changes nothing", async () => {
    await inTestDatabase(async (db) => {
      const made = await addStudentAndGroup(db, "9900003502");
      const other = await addTestActor(db, "Pegawai Kedua", ["dorm_manager"]);
      const renamed = { ...made.student, name: "Versi Uji Pertama" };
      await changeStudent(db, made.staff, renamed, {
        mentorGroupId: null,
        version: 1,
      });

      const late = await changeStudent(
        db,
        other,
        { ...made.student, name: "Versi Uji Terlambat" },
        { mentorGroupId: made.groupId, version: 1 },
      );

      expect(late).toEqual(STUDENT_CHANGED);
      expect(await findAddedStudent(db, made.student.nim)).toMatchObject({
        name: "Versi Uji Pertama",
        mentorGroupId: null,
        version: 2,
      });
      expect(await membersOf(db, made.groupId)).toEqual([]);
    });
  });

  it("does not raise the version for a change that is refused", async () => {
    await inTestDatabase(async (db) => {
      const made = await addStudentAndGroup(db, "9900003503");
      const otherYear = { ...made.student, cohortYear: 2025 };

      const refused = await changeStudent(db, made.staff, otherYear, {
        mentorGroupId: made.groupId,
        version: 1,
      });

      expect(refused.ok).toBe(false);
      expect((await findAddedStudent(db, made.student.nim))?.version).toBe(1);
    });
  });
});
