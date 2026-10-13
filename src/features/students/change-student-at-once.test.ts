// Sample NIMs of this file: 9900003600 to 9900003699.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { mentorGroupMembers, students } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { findAddedStudent } from "./added-students";
import {
  changeStudent,
  removeStudent,
  STUDENT_CHANGED,
} from "./change-student";
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

async function idOf(db: Database, nim: string): Promise<string> {
  const [student] = await db
    .select({ id: students.id })
    .from(students)
    .where(eq(students.nim, nim));
  if (!student) throw new Error("The student was not added.");
  return student.id;
}

describe("a student changed while a penetapan moves the same student", () => {
  it("refuses the change whole when a penetapan fixed first gave the student a group", async () => {
    const made = await addStudentAndGroups(own.db, "9900003603");
    const studentId = await idOf(own.db, made.student.nim);

    const both = await own.atOnce<unknown>(
      (db) =>
        db
          .insert(mentorGroupMembers)
          .values({ studentId, groupId: made.groups.one }),
      (db) =>
        changeStudent(
          db,
          made.second,
          { ...made.student, name: "Bareng Uji Kedua" },
          {
            mentorGroupId: made.groups.two,
            openedGroupId: null,
            version: OPENED_VERSION,
          },
        ),
    );

    expect(both.later).toEqual(STUDENT_CHANGED);
    expect(await membersOf(own.db, made.groups.one)).toEqual([studentId]);
    expect(await membersOf(own.db, made.groups.two)).toEqual([]);
    expect(await placementsOf(own.db, studentId)).toEqual([]);
    expect(await findAddedStudent(own.db, made.student.nim)).toMatchObject({
      name: "Bareng Uji",
      version: OPENED_VERSION,
    });
  });

  it("logs no leaving for a removed student whom a cancelled penetapan took out first", async () => {
    const made = await addStudentAndGroups(own.db, "9900003604");
    const studentId = await idOf(own.db, made.student.nim);
    const joined = await changeStudent(own.db, made.first, made.student, {
      mentorGroupId: made.groups.one,
      openedGroupId: null,
      version: OPENED_VERSION,
    });
    expect(joined).toEqual(SAVED);

    const both = await own.atOnce<unknown>(
      (db) =>
        db
          .delete(mentorGroupMembers)
          .where(eq(mentorGroupMembers.studentId, studentId)),
      (db) => removeStudent(db, made.second, made.student.nim),
    );

    expect(both.later).toEqual({ ok: true, value: made.student.name });
    expect(await placementsOf(own.db, studentId)).toEqual([
      [null, made.groups.one, made.first.id],
    ]);
  });
});

describe("two people who move two students between the same two groups", () => {
  it("lets a student leave a group that an unfinished save of another student holds", async () => {
    const made = await addStudentAndGroups(own.db, "9900003605");
    const leaving = { ...made.student, nim: "9900003606" };
    const added = await inputStudent(
      own.db,
      made.second,
      leaving,
      made.groups.one,
    );
    expect(added).toEqual(SAVED);

    const left = await own.db.transaction(async (tx) => {
      const joined = await changeStudent(tx, made.first, made.student, {
        mentorGroupId: made.groups.one,
        openedGroupId: null,
        version: OPENED_VERSION,
      });
      expect(joined).toEqual(SAVED);
      return own.otherDb.transaction(async (otherTx) => {
        // A save that waits for the group fails here, where it would
        // otherwise wait for a first save that ends only after it.
        await otherTx.execute(sql`set local lock_timeout = '2s'`);
        return changeStudent(otherTx, made.second, leaving, {
          mentorGroupId: made.groups.two,
          openedGroupId: made.groups.one,
          version: OPENED_VERSION,
        });
      });
    });

    expect(left).toEqual(SAVED);
    const [joinedId] = await membersOf(own.db, made.groups.one);
    expect(joinedId).toBe(await idOf(own.db, made.student.nim));
    expect(await membersOf(own.db, made.groups.two)).toEqual([
      await idOf(own.db, leaving.nim),
    ]);
  });
});

describe("two people who change one student at the same moment", () => {
  it("saves the first change: the second waits and is told the record changed", async () => {
    const made = await addStudentAndGroups(own.db, "9900003601");
    const sent = {
      mentorGroupId: null,
      openedGroupId: null,
      version: OPENED_VERSION,
    };

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
          openedGroupId: null,
          version: OPENED_VERSION,
        }),
      (db) =>
        changeStudent(db, made.second, made.student, {
          mentorGroupId: made.groups.two,
          openedGroupId: null,
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
