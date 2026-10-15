// Sample Tahun akademik of this file: 3300 to 3300.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { type AccountForAccess, rowLimitForPage } from "@/auth/access";
import type { RoleId } from "@/auth/role-ids";
import { visibleTo } from "@/auth/visible-students";
import type { Scores } from "@/character-scores/assessment-score";
import type { Database } from "@/db/connect";
import {
  characterAssessments,
  mentorGroupMembers,
  mentorGroupMentors,
  mentorGroups,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { readCohortCounts, readScoreGroups } from "./stored-student-numbers";
import { tahapScores } from "./tahap-scores";
import { addTestActor, addTestPeriod } from "./test-records";

const inTestDatabase = withTestDatabase();

/** The angkatan only this file adds students to. */
const COHORT = 3300;

async function countOfCohort(db: Database): Promise<number | undefined> {
  const counts = await readCohortCounts(db);
  return counts.find((cohort) => cohort.cohortYear === COHORT)?.students;
}

describe("readCohortCounts", () => {
  it("counts the Aktif students of every program, not those on Cuti, Non aktif or removed", async () => {
    await inTestDatabase(async (db) => {
      const one = await addTestProgram(db, "Prodi Uji Kurikulum A");
      const other = await addTestProgram(db, "Prodi Uji Kurikulum B");
      const add = (programId: number, nim: string, more = {}) =>
        addTestStudent(db, programId, {
          nim,
          name: `Mahasiswa Uji ${nim}`,
          cohortYear: COHORT,
          ...more,
        });
      await add(one, "9988700001");
      await add(other, "9988700002");
      await add(one, "9988700003", { status: "on_leave" });
      await add(one, "9988700004", { status: "inactive" });
      const removed = await add(one, "9988700005");
      await db
        .update(students)
        .set({ deletedAt: new Date() })
        .where(eq(students.id, removed));

      expect(await countOfCohort(db)).toBe(2);
    });
  });

  it("gives no row for an angkatan without an Aktif student", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "Prodi Uji Kurikulum A");
      await addTestStudent(db, program, {
        nim: "9988700006",
        name: "Mahasiswa Uji Cuti",
        cohortYear: COHORT,
        status: "on_leave",
      });

      expect(await countOfCohort(db)).toBeUndefined();
    });
  });
});

/** The period in which angkatan 3300 is in semester 1, tahap 1. */
const PERIOD = { startYear: COHORT, term: "odd" } as const;

function same(score: number): Scores {
  return { M: score, E: score, D: score, A: score, L: score, I: score };
}

async function addGroup(
  db: Database,
  programId: number,
  mentorId: string,
  studentId: string,
): Promise<void> {
  const startsOn = `${COHORT}-08-01`;
  const [group] = await db
    .insert(mentorGroups)
    .values({
      studyProgramId: programId,
      cohortYear: COHORT,
      entryPath: "regular",
      number: 1,
      startsOn,
    })
    .returning();
  if (!group) throw new Error("The group was not added.");
  await db.insert(mentorGroupMembers).values({ studentId, groupId: group.id });
  await db
    .insert(mentorGroupMentors)
    .values({ groupId: group.id, mentorId, startsOn });
}

/**
 * Assessed students of angkatan 3300: in program A, an anak asuh of the
 * mentor (84, after an earlier 50), one with no mentor (70), one on Cuti
 * (40) and one never assessed; in program B, an anak asuh of another
 * mentor (90).
 */
async function addAssessed(db: Database) {
  const periodId = await addTestPeriod(db, COHORT);
  const assessor = await addTestActor(db, "Penilai Uji", ["assessor"]);
  const mentor = await addTestActor(db, "Pengasuh Uji", ["mentor"]);
  const otherMentor = await addTestActor(db, "Pengasuh Uji Lain", ["mentor"]);
  const programA = await addTestProgram(db, "Prodi Uji Kurikulum A");
  const programB = await addTestProgram(db, "Prodi Uji Kurikulum B");
  const add = (programId: number, nim: string, more = {}) =>
    addTestStudent(db, programId, {
      nim,
      name: `Mahasiswa Uji ${nim}`,
      cohortYear: COHORT,
      ...more,
    });
  const assess = (studentId: string, scores: Scores, day: string) =>
    db.insert(characterAssessments).values({
      id: crypto.randomUUID(),
      studentId,
      scoreM: scores.M,
      scoreE: scores.E,
      scoreD: scores.D,
      scoreA: scores.A,
      scoreL: scores.L,
      scoreI: scores.I,
      source: "mentor_observation",
      note: "",
      periodId,
      enteredBy: assessor.id,
      enteredAt: new Date(`2026-${day}T03:00:00Z`),
    });

  const mentee = await add(programA, "9988700011");
  const ownProgram = await add(programA, "9988700012");
  const onLeave = await add(programA, "9988700013", { status: "on_leave" });
  await add(programA, "9988700014");
  const otherProgram = await add(programB, "9988700015");
  await addGroup(db, programA, mentor.id, mentee);
  await addGroup(db, programB, otherMentor.id, otherProgram);
  await assess(mentee, same(50), "09-01");
  await assess(mentee, same(84), "10-01");
  await assess(ownProgram, same(70), "10-02");
  await assess(onLeave, same(40), "10-03");
  await assess(otherProgram, same(90), "10-04");
  return { mentor, programA };
}

function viewer(
  id: string,
  roles: RoleId[],
  studyProgramId: number | null = null,
): AccountForAccess {
  return { id, roles, studyProgramId, studentId: null };
}

/** The scores of tahap 1 as the viewer of Kurikulum gets them. */
async function scoresFor(db: Database, account: AccountForAccess) {
  const visible = visibleTo(rowLimitForPage(account, "curriculum"));
  const groups = await readScoreGroups(db, visible);
  const ours = groups.filter((group) => group.cohortYear === COHORT);
  return tahapScores(ours, PERIOD, 1);
}

describe("readScoreGroups", () => {
  it("gives Kepala Unit the latest scores of every assessed Aktif student", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addAssessed(db);

      const scores = await scoresFor(db, viewer(mentor.id, ["head_of_unit"]));

      expect(scores).toEqual({ values: same(81.3), rerata: 81.3 });
    });
  });

  it("gives Ketua Program Studi only the students of their program", async () => {
    await inTestDatabase(async (db) => {
      const { mentor, programA } = await addAssessed(db);
      const head = viewer(mentor.id, ["head_of_program"], programA);

      const scores = await scoresFor(db, head);

      expect(scores).toEqual({ values: same(77), rerata: 77 });
    });
  });

  it("gives Pengasuh only their own anak asuh, by their latest assessment", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addAssessed(db);

      const scores = await scoresFor(db, viewer(mentor.id, ["mentor"]));

      expect(scores).toEqual({ values: same(84), rerata: 84 });
    });
  });

  it("adds no rows to Pengasuh from a role that does not open Kurikulum", async () => {
    await inTestDatabase(async (db) => {
      const { mentor } = await addAssessed(db);

      const scores = await scoresFor(
        db,
        viewer(mentor.id, ["mentor", "counsellor"]),
      );

      expect(scores).toEqual({ values: same(84), rerata: 84 });
    });
  });
});
