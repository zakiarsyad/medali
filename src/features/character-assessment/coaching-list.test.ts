// Sample Tahun akademik of this file: 4430 to 4430.
// Sample NIMs of this file: 9986080000 to 9986080099.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Scores } from "@/character-scores/assessment-score";
import {
  COACHING_LEVELS,
  coachingNeedOf,
} from "@/character-scores/coaching-need";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestStudent } from "@/dorms/test-records";
import { START_PARAMS } from "./assessment-address";
import { assessmentVisibleTo } from "./assessment-readers";
import { readCoachingList } from "./coaching-list";
import {
  addTestActor,
  addTestAssessment,
  addTestGroup,
  addTestPeriod,
  addTestStudents,
} from "./test-assessments";

const inTestDatabase = withTestDatabase();

const EARLIER = new Date("4430-09-01T03:00:00Z");
const LATER = new Date("4430-10-01T03:00:00Z");

/** The four score sets of the spec, with what each gives. */
const INTENSIVE: Scores = { M: 55, E: 58, D: 60, A: 57, L: 59, I: 61 };
const MODERATE: Scores = { M: 62, E: 60, D: 64, A: 58, L: 61, I: 63 };
const LIGHT: Scores = { M: 70, E: 72, D: 56, A: 75, L: 74, I: 73 };
const NOT_LISTED: Scores = { M: 66, E: 70, D: 58, A: 72, L: 68, I: 71 };

/** Total 389, Rerata 64.8: listed, by the Rerata alone. */
const JUST_BELOW: Scores = { M: 65, E: 65, D: 65, A: 65, L: 65, I: 64 };
/** Total 390, Rerata 65.0, every score 58 or more: not listed. */
const JUST_AT: Scores = { M: 65, E: 65, D: 65, A: 65, L: 65, I: 65 };
/** One score of 57 with a high Rerata: listed, Ringan. */
const ONE_LOW: Scores = { M: 90, E: 90, D: 57, A: 90, L: 90, I: 90 };

const SETS = [INTENSIVE, MODERATE, LIGHT, NOT_LISTED, JUST_BELOW, JUST_AT];

function nim(place: number): string {
  return `99860800${String(place).padStart(2, "0")}`;
}

async function addRecords(db: Database, count: number) {
  const period = await addTestPeriod(db, 4430);
  const nims = Array.from({ length: count }, (_, place) => nim(place + 1));
  const { programId, studentIds } = await addTestStudents(
    db,
    "Prodi Uji Pembinaan",
    4430,
    nims,
  );
  const penilai = await addTestActor(db, "Penilai Uji Pembinaan", ["assessor"]);
  const ofProgram = eq(students.studyProgramId, programId);
  return { period, programId, studentIds, penilai, ofProgram };
}

describe("Teridentifikasi perlu pembinaan", () => {
  it("lists by the database exactly whom the rule lists, for the spec's four score sets and both edges", async () => {
    await inTestDatabase(async (db) => {
      const { period, studentIds, penilai, ofProgram } = await addRecords(
        db,
        SETS.length,
      );
      for (const [place, scores] of SETS.entries()) {
        await addTestAssessment(db, penilai, {
          studentId: studentIds[place] ?? "",
          periodId: period,
          enteredAt: EARLIER,
          scores,
        });
      }

      const list = await readCoachingList(db, ofProgram, START_PARAMS);

      const byRule = SETS.flatMap((scores, place) =>
        coachingNeedOf(scores) === null ? [] : [studentIds[place]],
      );
      const listed = list.rows.map((row) => row.id);
      expect([...listed].sort()).toEqual([...byRule].sort());
      expect(list.matching).toBe(4);
      expect(listed).not.toContain(studentIds[3]);
      expect(listed).not.toContain(studentIds[5]);
      expect(list.rows.map((row) => row.need.level)).toEqual([
        "intensive",
        "moderate",
        "moderate",
        "light",
      ]);
    });
  });

  it("goes by the latest assessment alone, never lists a student with none, and leaves out a student who is not Aktif", async () => {
    await inTestDatabase(async (db) => {
      const { period, programId, studentIds, penilai, ofProgram } =
        await addRecords(db, 3);
      const [better, worse, none] = studentIds;
      if (!better || !worse || !none) throw new Error("Students missing.");
      const onLeave = await addTestStudent(db, programId, {
        nim: nim(9),
        name: "Mahasiswa Uji Pembinaan Cuti",
        cohortYear: 4430,
        status: "on_leave",
      });
      const assessed = [
        { studentId: better, enteredAt: EARLIER, scores: INTENSIVE },
        { studentId: better, enteredAt: LATER, scores: NOT_LISTED },
        { studentId: worse, enteredAt: EARLIER, scores: NOT_LISTED },
        { studentId: worse, enteredAt: LATER, scores: ONE_LOW },
        { studentId: onLeave, enteredAt: EARLIER, scores: INTENSIVE },
      ];
      for (const one of assessed) {
        await addTestAssessment(db, penilai, { ...one, periodId: period });
      }

      const list = await readCoachingList(db, ofProgram, START_PARAMS);

      expect(list.rows).toEqual([
        {
          id: worse,
          name: "Mahasiswa Uji Asesmen 2",
          nim: nim(2),
          program: "Prodi Uji Pembinaan",
          scores: ONE_LOW,
          need: { level: "light", weakest: "D" },
        },
      ]);
    });
  });

  it("puts Intensif, Sedang, then Ringan, the lowest Rerata first, and shows the first 10 then 25 a page", async () => {
    await inTestDatabase(async (db) => {
      const { period, studentIds, penilai, ofProgram } = await addRecords(
        db,
        30,
      );
      // Rerata rising with the place: the first are Intensif, the last Ringan.
      for (const [place, studentId] of studentIds.entries()) {
        const low = 50 + place;
        await addTestAssessment(db, penilai, {
          studentId,
          periodId: period,
          enteredAt: EARLIER,
          scores: { M: low, E: low, D: low, A: low, L: low, I: 57 },
        });
      }

      const first = await readCoachingList(db, ofProgram, START_PARAMS);
      const all = { ...START_PARAMS, coachingAll: true };
      const second = await readCoachingList(db, ofProgram, {
        ...all,
        coachingPage: 2,
      });
      const beyond = await readCoachingList(db, ofProgram, {
        ...all,
        coachingPage: 9,
      });

      expect(first.matching).toBe(30);
      expect(first.showsAll).toBe(false);
      expect(first.rows.map((row) => row.id)).toEqual(studentIds.slice(0, 10));
      expect(second.rows.map((row) => row.id)).toEqual(studentIds.slice(25));
      expect(second.page).toBe(2);
      expect(beyond.page).toBe(2);
      const firstOfAll = await readCoachingList(db, ofProgram, all);
      const levels = [...firstOfAll.rows, ...second.rows].map(
        (row) => row.need.level,
      );
      const order = levels.map((level) => COACHING_LEVELS.indexOf(level));
      expect(order).toEqual([...order].sort((a, b) => a - b));
      expect(new Set(levels)).toEqual(
        new Set(["intensive", "moderate", "light"]),
      );
    });
  });

  it("names the first value as Aspek terlemah when two scores are equal lowest", async () => {
    await inTestDatabase(async (db) => {
      const { period, studentIds, penilai, ofProgram } = await addRecords(
        db,
        1,
      );
      await addTestAssessment(db, penilai, {
        studentId: studentIds[0] ?? "",
        periodId: period,
        enteredAt: EARLIER,
        scores: { M: 70, E: 55, D: 70, A: 70, L: 55, I: 70 },
      });

      const list = await readCoachingList(db, ofProgram, START_PARAMS);

      expect(list.rows[0]?.need.weakest).toBe("E");
    });
  });
});

describe("Teridentifikasi perlu pembinaan for a role that sees only some students", () => {
  async function addListed(db: Database) {
    const records = await addRecords(db, 3);
    for (const studentId of records.studentIds) {
      await addTestAssessment(db, records.penilai, {
        studentId,
        periodId: records.period,
        enteredAt: EARLIER,
        scores: INTENSIVE,
      });
    }
    return records;
  }

  it("shows Ketua Program Studi only the students of their own program", async () => {
    await inTestDatabase(async (db) => {
      const { programId, studentIds } = await addListed(db);
      const kaprodi = await addTestActor(
        db,
        "Kaprodi Uji Pembinaan",
        ["head_of_program"],
        { studyProgramId: programId },
      );
      const otherKaprodi = await addTestActor(
        db,
        "Kaprodi Uji Pembinaan Lain",
        ["head_of_program"],
        { studyProgramId: null },
      );

      const own = await readCoachingList(
        db,
        assessmentVisibleTo(kaprodi),
        START_PARAMS,
      );
      const other = await readCoachingList(
        db,
        assessmentVisibleTo(otherKaprodi),
        START_PARAMS,
      );

      expect(own.rows.map((row) => row.id)).toEqual(studentIds);
      expect(other.matching).toBe(0);
    });
  });

  it("shows Pengasuh only their own mentees, and a student nobody", async () => {
    await inTestDatabase(async (db) => {
      const { programId, studentIds } = await addListed(db);
      const [ani, budi] = studentIds;
      if (!ani || !budi) throw new Error("Students missing.");
      const pengasuh = await addTestActor(db, "Pengasuh Uji Pembinaan", [
        "mentor",
      ]);
      await addTestGroup(db, { programId, year: 4430 }, pengasuh.id, [
        ani,
        budi,
      ]);
      const student = await addTestActor(db, "Mahasiswa Uji Pembinaan", [
        "student",
      ]);

      const mentees = await readCoachingList(
        db,
        assessmentVisibleTo(pengasuh),
        START_PARAMS,
      );
      const own = await readCoachingList(
        db,
        assessmentVisibleTo(student),
        START_PARAMS,
      );

      expect(mentees.rows.map((row) => row.id)).toEqual([ani, budi]);
      expect(own.matching).toBe(0);
    });
  });
});
