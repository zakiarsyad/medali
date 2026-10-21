// Sample NIMs of this file: 9986700000 to 9986700099.
import { eq, inArray, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addTestProgram, addTestStudent } from "@/dorms/test-records";
import { isLimitedSql, limitedScoreSql, limitedStudents } from "./limit-sql";
import type { PenaltyKind } from "./penalty-kinds";
import { readLimitsOf } from "./read-limits";
import { limitedScore, limitOf } from "./score-limit";
import {
  addTestPenaltyOf,
  addTestRecorder,
  TEST_DESCRIPTION,
} from "./test-penalties";

const inTestDatabase = withTestDatabase();

/** Each student of the check, with the penalties they get. */
const PENALTIES: PenaltyKind[][] = [
  [],
  [{ category: "light", level: 1 }],
  [
    { category: "light", level: 3 },
    { category: "medium", level: 2 },
  ],
  [{ category: "heavy", level: 1 }],
  [
    { category: "heavy", level: 2 },
    { category: "light", level: 2 },
  ],
];

const SCORES = [40, 69, 70, 71, 86, 100];
const FINALS = [0, 65.5, 70, 70.1, 82.4, 100];

describe("the limit as the database asks it", () => {
  it("limits the same students as limitOf, and gives each score and final as limitedScore does", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addTestProgram(db, "Prodi Uji Batas Nilai");
      const recorder = await addTestRecorder(db);
      const ids: string[] = [];
      for (const [place, penalties] of PENALTIES.entries()) {
        const id = await addTestStudent(db, programId, {
          nim: `99867000${String(place).padStart(2, "0")}`,
          name: `Mahasiswa Uji Batas ${place + 1}`,
        });
        ids.push(id);
        for (const kind of penalties) {
          await addTestPenaltyOf(db, id, recorder, kind);
        }
      }
      const scores = sql.join(
        SCORES.map((score) => sql`(${score}::integer)`),
        sql`, `,
      );
      const finals = sql.join(
        FINALS.map((final) => sql`(${final}::float8)`),
        sql`, `,
      );
      const limitedOnes = limitedStudents(db);
      const limited = isLimitedSql(limitedOnes);
      const rows = await db
        .select({
          id: students.id,
          limited,
          scores: sql<
            number[]
          >`(select array_agg(${limitedScoreSql(sql`s.v`, limited)} order by s.v) from (values ${scores}) as s(v))`,
          finals: sql<
            number[]
          >`(select array_agg(${limitedScoreSql(sql`f.v`, limited)} order by f.v) from (values ${finals}) as f(v))`,
        })
        .from(students)
        .leftJoin(limitedOnes, eq(limitedOnes.studentId, students.id))
        .where(inArray(students.id, ids));

      for (const [place, penalties] of PENALTIES.entries()) {
        const row = rows.find((each) => each.id === ids[place]);
        const isLimited = limitOf(penalties) !== null;
        expect(row?.limited).toBe(isLimited);
        expect(row?.scores.map(Number)).toEqual(
          SCORES.map((score) => limitedScore(score, isLimited)),
        );
        expect(row?.finals.map(Number)).toEqual(
          FINALS.map((final) => limitedScore(final, isLimited)),
        );
      }
    });
  });

  it("keeps a missing final missing for a limited student", async () => {
    await inTestDatabase(async (db) => {
      const [row] = await db.execute<{ final: number | null }>(
        sql`select ${limitedScoreSql(sql`null::float8`, sql`true`)} as final`,
      );
      expect(row?.final).toBeNull();
    });
  });
});

describe("readLimitsOf", () => {
  it("gives the highest Ringan or Sedang penalty of each limited student asked for, without its Uraian", async () => {
    await inTestDatabase(async (db) => {
      const programId = await addTestProgram(db, "Prodi Uji Baca Batas");
      const recorder = await addTestRecorder(db);
      const ids: string[] = [];
      for (const [place, penalties] of PENALTIES.entries()) {
        const id = await addTestStudent(db, programId, {
          nim: `99867000${String(place + 50).padStart(2, "0")}`,
          name: `Mahasiswa Uji Baca Batas ${place + 1}`,
        });
        ids.push(id);
        for (const kind of penalties) {
          await addTestPenaltyOf(db, id, recorder, kind);
        }
      }

      const limits = await readLimitsOf(db, ids);

      expect([...limits.keys()].sort()).toEqual(
        [ids[1], ids[2], ids[4]].sort(),
      );
      expect(limits.get(ids[1] ?? "")).toEqual({
        category: "light",
        level: 1,
      });
      expect(limits.get(ids[2] ?? "")).toEqual({
        category: "medium",
        level: 2,
      });
      expect(limits.get(ids[4] ?? "")).toEqual({
        category: "light",
        level: 2,
      });
      expect(JSON.stringify([...limits])).not.toContain(TEST_DESCRIPTION);
      expect(await readLimitsOf(db, [])).toEqual(new Map());
    });
  });
});
