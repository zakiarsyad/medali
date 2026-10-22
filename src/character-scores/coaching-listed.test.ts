// Sample Tahun akademik of this file: 4476 to 4476.
// Sample NIMs of this file: 9987706000 to 9987706099.
import { inArray, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { academicPeriods, accounts, characterAssessments } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import type { Scores } from "./assessment-score";
import { coachingLevelSql, listedForCoaching } from "./coaching-listed";
import { coachingNeedOf } from "./coaching-need";
import { latestAssessments } from "./latest-assessments";

const inTestDatabase = withTestDatabase();

/** Score sets on both sides of each limit, and the spec's four. */
const SETS: Scores[] = [
  { M: 55, E: 58, D: 60, A: 57, L: 59, I: 61 },
  { M: 62, E: 60, D: 64, A: 58, L: 61, I: 63 },
  { M: 70, E: 72, D: 56, A: 75, L: 74, I: 73 },
  { M: 66, E: 70, D: 58, A: 72, L: 68, I: 71 },
  { M: 59, E: 60, D: 60, A: 60, L: 60, I: 60 },
  { M: 60, E: 60, D: 60, A: 60, L: 60, I: 60 },
  { M: 64, E: 65, D: 65, A: 65, L: 65, I: 65 },
  { M: 65, E: 65, D: 65, A: 65, L: 65, I: 65 },
  { M: 57, E: 80, D: 80, A: 80, L: 80, I: 80 },
];

async function addAssessed(db: Database): Promise<string[]> {
  const [period] = await db
    .insert(academicPeriods)
    .values({
      startYear: 4476,
      term: "odd",
      startsOn: "4476-08-01",
      endsOn: "4477-01-31",
    })
    .returning();
  const [penilai] = await db
    .insert(accounts)
    .values({ name: "Penilai Uji Tingkat Pembinaan" })
    .returning();
  if (!period || !penilai) throw new Error("The records were not added.");
  const programId = await addTestProgram(db, "Prodi Uji Tingkat Pembinaan");
  const ids: string[] = [];
  for (const [place, scores] of SETS.entries()) {
    const studentId = await addTestStudent(db, programId, {
      nim: `99877060${String(place + 1).padStart(2, "0")}`,
      name: `Mahasiswa Uji Tingkat ${place + 1}`,
    });
    await db.insert(characterAssessments).values({
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
      periodId: period.id,
      enteredBy: penilai.id,
      enteredAt: new Date("4476-09-01T03:00:00Z"),
    });
    ids.push(studentId);
  }
  return ids;
}

describe("the level of coaching as the database asks it", () => {
  it("is the level the rule gives every listed student, on both sides of each limit", async () => {
    await inTestDatabase(async (db) => {
      const ids = await addAssessed(db);
      const latest = latestAssessments(db);

      const found = await db
        .select({
          studentId: latest.studentId,
          level: coachingLevelSql(latest),
          listed:
            sql<boolean>`coalesce(${listedForCoaching(latest)}, false)`.mapWith(
              Boolean,
            ),
        })
        .from(latest)
        .where(inArray(latest.studentId, ids));

      for (const [place, scores] of SETS.entries()) {
        const row = found.find((each) => each.studentId === ids[place]);
        const need = coachingNeedOf(scores);
        expect(row?.listed, `set ${place + 1}`).toBe(need !== null);
        if (need !== null)
          expect(row?.level, `set ${place + 1}`).toBe(need.level);
      }
      const levels = found.map((row) => row.level);
      expect(new Set(levels)).toEqual(
        new Set(["intensive", "moderate", "light"]),
      );
    });
  });
});
