// Sample NIMs of this file: 9963000001 to 9966000199, and 9974000001 to
// 9974000199.
import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { accounts, mentorGroupMembers, students } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { findAddedStudent } from "@/features/students/added-students";
import {
  changeStudent,
  removeStudent,
  STUDENT_CHANGED,
} from "@/features/students/change-student";
import { placementsOf } from "@/features/students/test-group-reads";
import { waitForOtherMentorChanges } from "@/mentoring/mentor-change-lock";
import { fixAssignment } from "./fix-assignment";
import { addCompleteTestDraft, testDraftOf } from "./test-drafts";
import { testLiveGroupsOf } from "./test-live-groups";
import { addTestActor, addTestLiveGroup } from "./test-records";

/*
 * The log of a penetapan cannot be emptied, so no rows are removed after
 * a check: each one uses an angkatan of its own, and the database is
 * dropped at the end.
 */
const own = withOwnTestDatabase("tetapkanmhs");

const DONE = { ok: true, value: null };

/** A complete draft stands at version 2: formed, then its mentors filled. */
function decreeOf(cohortYear: number) {
  return {
    cohortYear,
    version: 2,
    decreeNumber: `KEP-${cohortYear}/UJI`,
    effectiveOn: `${cohortYear}-09-01`,
  };
}

/**
 * A complete draft with its Kepala Unit, whose student with the first
 * NIM is one put in through Pengguna baru mahasiswa, with their account:
 * only such a student is changed or removed there.
 */
async function addDraftWithAddedStudent(
  db: Database,
  cohortYear: number,
  firstNim: number,
  tag: string,
) {
  const draft = await addCompleteTestDraft(db, cohortYear, firstNim, tag);
  const head = await addTestActor(db, ["head_of_unit"], `Kepala ${tag}`);
  const nim = String(firstNim);
  const [student] = await db
    .update(students)
    .set({ inputAt: new Date(), inputBy: draft.actor.id, inputSource: "form" })
    .where(eq(students.nim, nim))
    .returning({ id: students.id, name: students.name });
  if (!student) throw new Error("The draft has no student with this NIM.");
  await db
    .insert(accounts)
    .values({ name: student.name, studentId: student.id });
  return { staff: draft.actor, head, nim, student, program: draft.large };
}

/** The record and what the change form of a student opens with. */
async function openForm(db: Database, nim: string) {
  const stored = await findAddedStudent(db, nim);
  if (!stored) throw new Error("The student was not put in here.");
  const { mentorGroupId, version, ...record } = stored;
  return { record, openedGroupId: mentorGroupId, version };
}

/** The kelompok pengasuhan that store a student as a member. */
async function groupsHolding(db: Database, studentId: string) {
  const members = await db
    .select({ groupId: mentorGroupMembers.groupId })
    .from(mentorGroupMembers)
    .where(eq(mentorGroupMembers.studentId, studentId));
  return members.map((member) => member.groupId);
}

describe("a penetapan fixed while one of its students is given a group", () => {
  it("is refused whole when the student save was first: it waits, then counts the student as placed", async () => {
    const year = 2063;
    const made = await addDraftWithAddedStudent(
      own.db,
      year,
      9963000001,
      "UJISIMPANDULU",
    );
    const chosen = await addTestLiveGroup(own.db, made.program, {
      cohortYear: year,
      number: 9,
    });
    const form = await openForm(own.db, made.nim);

    const both = await own.atOnce(
      (db) =>
        changeStudent(db, made.staff, form.record, {
          mentorGroupId: chosen,
          openedGroupId: form.openedGroupId,
          version: form.version,
        }),
      (db) => fixAssignment(db, made.head, decreeOf(year)),
    );

    expect(both.sooner).toEqual(DONE);
    expect(both.later).toEqual({
      ok: false,
      error:
        "1 mahasiswa pada draf sudah punya kelompok pengasuhan atau sudah pindah angkatan. Bentuk ulang kelompok, lalu tetapkan lagi.",
    });
    expect(await groupsHolding(own.db, made.student.id)).toEqual([chosen]);
    const live = await testLiveGroupsOf(own.db, year);
    expect(live.map((group) => group.id)).toEqual([chosen]);
    const draft = await testDraftOf(own.db, year);
    expect(draft).toMatchObject({ status: "draft", version: 2 });
    expect(draft.log.filter((line) => line.action === "fixed")).toEqual([]);
  });

  it("places the student itself when it was first: the student save waits and is told the record changed", async () => {
    const year = 2064;
    const made = await addDraftWithAddedStudent(
      own.db,
      year,
      9964000001,
      "UJITETAPDULU",
    );
    const chosen = await addTestLiveGroup(own.db, made.program, {
      cohortYear: year,
      number: 9,
    });
    const form = await openForm(own.db, made.nim);

    const both = await own.atOnce(
      (db) => fixAssignment(db, made.head, decreeOf(year)),
      (db) =>
        changeStudent(
          db,
          made.staff,
          { ...form.record, name: "Uji Tetap Dulu Diubah" },
          {
            mentorGroupId: chosen,
            openedGroupId: form.openedGroupId,
            version: form.version,
          },
        ),
    );

    expect(both.sooner).toEqual(DONE);
    expect(both.later).toEqual(STUDENT_CHANGED);
    const holding = await groupsHolding(own.db, made.student.id);
    expect(holding).toHaveLength(1);
    expect(holding).not.toContain(chosen);
    expect(await testLiveGroupsOf(own.db, year)).toHaveLength(4);
    expect(await findAddedStudent(own.db, made.nim)).toMatchObject({
      name: made.student.name,
      version: form.version,
    });
  });
});

/** How many members the kelompok pengasuhan of an angkatan store in all. */
async function storedMembers(db: Database, cohortYear: number) {
  const live = await testLiveGroupsOf(db, cohortYear);
  return live.reduce((sum, group) => sum + group.studentIds.length, 0);
}

describe("a penetapan fixed while one of its students is removed", () => {
  it("places the others when the removal was first: it waits, then leaves the removed student out", async () => {
    const year = 2065;
    const made = await addDraftWithAddedStudent(
      own.db,
      year,
      9965000001,
      "UJIHAPUSDULU",
    );

    const both = await own.atOnce<unknown>(
      (db) => removeStudent(db, made.staff, made.nim),
      (db) => fixAssignment(db, made.head, decreeOf(year)),
    );

    expect(both.sooner).toEqual({ ok: true, value: made.student.name });
    expect(both.later).toEqual(DONE);
    expect(await groupsHolding(own.db, made.student.id)).toEqual([]);
    expect(await testLiveGroupsOf(own.db, year)).toHaveLength(3);
    expect(await storedMembers(own.db, year)).toBe(79);
    const fixed = await testDraftOf(own.db, year);
    expect(fixed.status).toBe("fixed");
    const actions = fixed.log.map((line) => line.action);
    expect(actions).toContain("members_dropped");
  });

  it("makes the removal wait when it was first: the student leaves the group they were just given", async () => {
    const year = 2066;
    const made = await addDraftWithAddedStudent(
      own.db,
      year,
      9966000001,
      "UJITETAPLALUHAPUS",
    );

    const both = await own.atOnce<unknown>(
      (db) => fixAssignment(db, made.head, decreeOf(year)),
      (db) => removeStudent(db, made.staff, made.nim),
    );

    expect(both.sooner).toEqual(DONE);
    expect(both.later).toEqual({ ok: true, value: made.student.name });
    expect(await groupsHolding(own.db, made.student.id)).toEqual([]);
    expect(await storedMembers(own.db, year)).toBe(79);
    expect(await placementsOf(own.db, made.student.id)).toEqual([
      [expect.any(String), null, made.staff.id],
    ]);
  });
});

describe("a penetapan that waits for a save of one of its students", () => {
  it("does not make a change of mentors wait meanwhile, which that save may itself wait for", async () => {
    const year = 2074;
    const made = await addDraftWithAddedStudent(
      own.db,
      year,
      9974000001,
      "UJITUNGGUMHS",
    );
    let fixing: Promise<unknown> | undefined;

    const removed = await own.db.transaction(async (tx) => {
      const answer = await removeStudent(tx, made.staff, made.nim);
      fixing = fixAssignment(own.otherDb, made.head, decreeOf(year));
      // Kept from failing the check before it is awaited below.
      fixing.catch(() => {});
      // Long enough for the penetapan to reach the student and wait.
      await tx.execute(sql`select pg_sleep(0.4)`);
      // A penetapan that already makes changes of mentors wait and this
      // save would each wait for the other: the database gives one of
      // them up, and where it does not notice, this save fails here.
      await tx.execute(sql`set local lock_timeout = '2s'`);
      await waitForOtherMentorChanges(tx);
      return answer;
    });

    expect(removed).toEqual({ ok: true, value: made.student.name });
    expect(await fixing).toEqual(DONE);
  });
});
