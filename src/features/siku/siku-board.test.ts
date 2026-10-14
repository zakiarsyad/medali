// Sample Tahun akademik of this file: 2902 to 2902.
// Sample NIMs of this file: 9964000200 to 9964000299.
import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { rowLimitForAction } from "@/auth/access";
import type { Database } from "@/db/connect";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { saveBaseScore } from "@/features/curriculum/save-base-score";
import { readBaseScore } from "@/features/curriculum/stored-base-score";
import { visibleTo } from "@/features/students/visible-students";
import { START_PARAMS } from "./siku-address";
import { readSikuList, readSikuNumbers, readSikuRanking } from "./siku-board";
import {
  addTestActor,
  addTestEntry,
  addTestGroup,
  addTestStudents,
  addTestYear,
  type TestActor,
} from "./test-siku";

const inTestDatabase = withTestDatabase();

const YEAR = 2902;

/** The students the account sees through Penilaian SIKU, of this file only. */
function seenBy(actor: TestActor) {
  const visible = visibleTo(rowLimitForAction(actor, "view_siku"));
  return and(visible, eq(students.cohortYear, YEAR)) ?? visible;
}

/**
 * Two programs: Ani gains 4 and Budi loses 3 in the first, Citra has
 * nothing and Dewi, in the second, loses 70. Ani and Budi are the
 * mentees of a Pengasuh.
 */
async function addRecords(db: Database) {
  const periods = await addTestYear(db, YEAR);
  const first = await addTestStudents(db, "Prodi Uji Papan SIKU A", YEAR, [
    "9964000201",
    "9964000202",
    "9964000203",
  ]);
  const second = await addTestStudents(db, "Prodi Uji Papan SIKU B", YEAR, [
    "9964000204",
  ]);
  const [ani, budi, citra] = first.studentIds;
  const [dewi] = second.studentIds;
  if (!ani || !budi || !citra || !dewi) throw new Error("Students missing.");
  const penilai = await addTestActor(db, "Penilai Uji Papan", ["assessor"]);
  const entry = { day: `${YEAR}-10-12`, periodId: periods.odd };
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "gain",
    reason: "peer_mentoring",
    points: 4,
    studentIds: [ani],
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "loss",
    reason: "discipline_penalty",
    points: 3,
    studentIds: [budi],
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "loss",
    reason: "student_violation",
    points: 30,
    studentIds: [dewi],
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "loss",
    reason: "student_violation",
    points: 30,
    studentIds: [dewi],
  });
  await addTestEntry(db, penilai, {
    ...entry,
    kind: "loss",
    reason: "student_violation",
    points: 10,
    studentIds: [dewi],
  });
  const mentor = await addTestActor(db, "Pengasuh Uji Papan", ["mentor"]);
  await addTestGroup(
    db,
    { programId: first.programId, year: YEAR, number: 1 },
    mentor.id,
    [ani, budi],
  );
  const kaprodi = await addTestActor(
    db,
    "Kaprodi Uji Papan",
    ["head_of_program"],
    {
      studyProgramId: first.programId,
    },
  );
  return {
    ids: { ani, budi, citra, dewi },
    programs: [first.programId, second.programId],
    penilai,
    mentor,
    kaprodi,
  };
}

/** Only the students of this file, for a role that sees every student. */
function ofFile<Row extends { nim: string }>(rows: Row[]): Row[] {
  return rows.filter((row) => row.nim.startsWith("99640002"));
}

describe("readSikuList", () => {
  it("shows each student's Nilai dasar, gains, losses and SIKU akhir, held within 0 to 100, the largest rise first", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const visible = seenBy(penilai);

      const list = await readSikuList(db, visible, 65, {
        ...START_PARAMS,
        query: "Mahasiswa Uji SIKU",
      });

      expect(
        ofFile(list.rows).map((row) => [
          row.nim,
          row.gains,
          row.losses,
          row.siku,
        ]),
      ).toEqual([
        ["9964000201", 4, 0, 69],
        ["9964000203", 0, 0, 65],
        ["9964000202", 0, 3, 62],
        ["9964000204", 0, 70, 0],
      ]);
      const ani = list.rows.find((row) => row.nim === "9964000201");
      expect(ani?.last).toEqual({
        day: `${YEAR}-10-12`,
        reason: "peer_mentoring",
      });
    });
  });

  it("narrows to those who gained, those who lost, and those still at Nilai dasar", async () => {
    await inTestDatabase(async (db) => {
      const { penilai } = await addRecords(db);
      const visible = seenBy(penilai);
      const nimsOf = async (filter: "gained" | "lost" | "base") =>
        ofFile(
          (
            await readSikuList(db, visible, 65, {
              ...START_PARAMS,
              query: "9964000",
              filter,
            })
          ).rows,
        ).map((row) => row.nim);

      expect(await nimsOf("gained")).toEqual(["9964000201"]);
      expect(await nimsOf("lost")).toEqual(["9964000202", "9964000204"]);
      expect(await nimsOf("base")).toEqual(["9964000203"]);
    });
  });

  it("keeps Ketua Program Studi to their own program, and Pengasuh to their own mentees", async () => {
    await inTestDatabase(async (db) => {
      const { kaprodi, mentor } = await addRecords(db);

      const ofProgram = await readSikuList(
        db,
        seenBy(kaprodi),
        65,
        START_PARAMS,
      );
      const ofMentor = await readSikuList(db, seenBy(mentor), 65, START_PARAMS);

      expect(ofProgram.rows.map((row) => row.nim).sort()).toEqual([
        "9964000201",
        "9964000202",
        "9964000203",
      ]);
      expect(ofMentor.rows.map((row) => row.nim).sort()).toEqual([
        "9964000201",
        "9964000202",
      ]);
    });
  });

  it("shows nobody to a student who asks for the list of others", async () => {
    await inTestDatabase(async (db) => {
      const { ids } = await addRecords(db);
      const student = await addTestActor(
        db,
        "Mahasiswa Uji Papan",
        ["student"],
        {
          studentId: ids.ani,
        },
      );

      const list = await readSikuList(db, seenBy(student), 65, START_PARAMS);

      expect(list.rows).toEqual([]);
      expect(list.matching).toBe(0);
    });
  });
});

describe("readSikuNumbers", () => {
  it("counts the students seen, their mean SIKU akhir, and who gained and lost", async () => {
    await inTestDatabase(async (db) => {
      const { kaprodi } = await addRecords(db);

      const numbers = await readSikuNumbers(db, seenBy(kaprodi), 65);

      expect(numbers).toEqual({
        students: 3,
        mean: (69 + 62 + 65) / 3,
        gained: 1,
        lost: 1,
      });
    });
  });

  it("follows a new Nilai dasar set in Kurikulum, for every student", async () => {
    await inTestDatabase(async (db) => {
      const { kaprodi, penilai } = await addRecords(db);
      const kepala = await addTestActor(db, "Kepala Uji Papan", [
        "head_of_unit",
      ]);
      await saveBaseScore(db, kepala, "70");
      const base = (await readBaseScore(db)).score;

      const numbers = await readSikuNumbers(db, seenBy(kaprodi), base);
      const list = await readSikuList(db, seenBy(penilai), base, {
        ...START_PARAMS,
        query: "9964000",
      });

      expect(base).toBe(70);
      expect(numbers.mean).toBe((74 + 67 + 70) / 3);
      expect(ofFile(list.rows).map((row) => row.siku)).toEqual([74, 70, 67, 0]);
    });
  });
});

describe("readSikuRanking", () => {
  it("lists the falls and the rises from Nilai dasar, the largest first", async () => {
    await inTestDatabase(async (db) => {
      const { kaprodi } = await addRecords(db);

      const ranking = await readSikuRanking(
        db,
        seenBy(kaprodi),
        65,
        START_PARAMS,
      );

      expect(ranking.falls.map((row) => [row.nim, row.siku])).toEqual([
        ["9964000202", 62],
      ]);
      expect(ranking.rises.map((row) => [row.nim, row.siku])).toEqual([
        ["9964000201", 69],
      ]);
      expect([ranking.fallCount, ranking.riseCount]).toEqual([1, 1]);
    });
  });
});
