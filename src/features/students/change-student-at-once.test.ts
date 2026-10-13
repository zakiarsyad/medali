// Sample NIMs of this file: 9900003600 to 9900003699.
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { findAddedStudent } from "./added-students";
import { changeStudent, STUDENT_CHANGED } from "./change-student";
import { inputStudent } from "./input-student";
import type { StudentInput } from "./student-input";
import { membersOf, placementsOf } from "./test-group-reads";
import {
  addTestActor,
  addTestMentorGroup,
  addTestProgram,
} from "./test-records";

/*
 * The placement log cannot be emptied, so no rows are removed after a
 * check: each one uses a program studi and a NIM of its own, and the
 * database is dropped at the end.
 */
const own = withOwnTestDatabase("ubahmhs");

const SAVED = { ok: true, value: null };
const OPENED_VERSION = 1;

/** A student at version 1 in no group, two groups that fit and two staff. */
async function addStudentAndGroups(db: Database, nim: string) {
  const program = await addTestProgram(db, `Prodi Bareng ${nim}`);
  const first = await addTestActor(db, "Pegawai Pertama", ["upk_staff"]);
  const second = await addTestActor(db, "Pegawai Kedua", ["dorm_manager"]);
  const mentor = await addTestActor(db, "Pengasuh Bareng", ["mentor"]);
  const groupOf = (number: number) =>
    addTestMentorGroup(db, program, {
      number,
      memberIds: [],
      mentorId: mentor.id,
    });
  const student: StudentInput = {
    nim,
    name: "Bareng Uji",
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
  const added = await inputStudent(db, first, student);
  if (!added.ok) throw new Error(added.error);
  const groups = { one: await groupOf(1), two: await groupOf(2) };
  return { first, second, student, groups };
}

describe("two people who change one student at the same moment", () => {
  it("saves the first change: the second waits and is told the record changed", async () => {
    const made = await addStudentAndGroups(own.db, "9900003601");
    const sent = { mentorGroupId: null, version: OPENED_VERSION };

    const both = await own.atOnce(
      (db) =>
        changeStudent(
          db,
          made.first,
          { ...made.student, name: "Bareng Uji Pertama" },
          sent,
        ),
      (db) =>
        changeStudent(
          db,
          made.second,
          { ...made.student, name: "Bareng Uji Kedua" },
          sent,
        ),
    );

    expect(both.sooner).toEqual(SAVED);
    expect(both.later).toEqual(STUDENT_CHANGED);
    expect(await findAddedStudent(own.db, made.student.nim)).toMatchObject({
      name: "Bareng Uji Pertama",
      version: 2,
    });
  });

  it("puts the student in the group of the first: the second waits, moves nobody and logs nothing", async () => {
    const made = await addStudentAndGroups(own.db, "9900003602");

    const both = await own.atOnce(
      (db) =>
        changeStudent(db, made.first, made.student, {
          mentorGroupId: made.groups.one,
          version: OPENED_VERSION,
        }),
      (db) =>
        changeStudent(db, made.second, made.student, {
          mentorGroupId: made.groups.two,
          version: OPENED_VERSION,
        }),
    );

    expect(both.sooner).toEqual(SAVED);
    expect(both.later).toEqual(STUDENT_CHANGED);
    const [studentId] = await membersOf(own.db, made.groups.one);
    if (!studentId) throw new Error("The student is in no group.");
    expect(await membersOf(own.db, made.groups.two)).toEqual([]);
    expect(await placementsOf(own.db, studentId)).toEqual([
      [null, made.groups.one, made.first.id],
    ]);
  });
});
