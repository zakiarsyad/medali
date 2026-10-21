import { type SQL, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { scorePercent } from "@/features/activities/attendance-score";
import { letterOf } from "@/features/character-grades/grade-letter";
import {
  GRADE_LETTERS,
  type GradeScheme,
  STARTING_SCHEME,
} from "@/features/character-grades/scheme-ids";
import { sikuOf } from "@/features/siku/siku-score";
import { skpmScoreOf } from "@/features/skpm/skpm-score";
import { finalScoreOf, gradeOf } from "./character-grade";
import {
  finalSql,
  letterSql,
  passesSql,
  percentSql,
  sikuSql,
  skpmSql,
} from "./grade-sql";

const inTestDatabase = withTestDatabase();

/** A column of the values the database is given. */
function given(name: string): SQL {
  return sql`given.${sql.identifier(name)}`;
}

/**
 * What the database gives `expression` for each set of values, in order.
 * `columns` names the values and their types, as the expression reads them.
 */
async function evaluated(
  db: Database,
  values: readonly Record<string, number | null>[],
  columns: string,
  expression: SQL,
): Promise<unknown[]> {
  const rows = values.map((each, place) => ({ ...each, place }));
  const result = await db.execute<{ value: unknown }>(
    sql`select ${expression} as value from jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) as given(${sql.raw(columns)}, place integer) order by given.place`,
  );
  return result.map((row) => row.value);
}

function range(from: number, to: number, step = 1): number[] {
  const values: number[] = [];
  for (let value = from; value <= to; value += step) values.push(value);
  return values;
}

/** Every attended of every counted up to 60, nothing counted among them. */
function attendances() {
  const values: { attended: number; counted: number }[] = [];
  for (const counted of range(0, 60)) {
    for (const attended of range(0, counted))
      values.push({ attended, counted });
  }
  return values;
}

/** Scores to one decimal over 0–100, as Kehadiran and SKPM are. */
const TENTHS = range(0, 1000).map((tenths) => tenths / 10);

const SCHEMES: GradeScheme[] = [
  STARTING_SCHEME,
  {
    weights: { attendance: 40, mentoring: 20, siku: 20, skpm: 20 },
    lowerLimits: { A: 90, B: 75, C: 55, D: 40 },
    passLetter: "C",
  },
  {
    weights: { attendance: 33, mentoring: 33, siku: 33, skpm: 1 },
    lowerLimits: { A: 80, B: 80, C: 61, D: 0 },
    passLetter: "A",
  },
  {
    weights: { attendance: 15, mentoring: 35, siku: 45, skpm: 5 },
    lowerLimits: { A: 100, B: 66, C: 50, D: 49 },
    passLetter: "E",
  },
];

/** Parts of many grades: each a step along its own range. */
function partSets() {
  const sets: Record<"attendance" | "mentoring" | "siku" | "skpm", number>[] =
    [];
  for (let place = 0; place < 4000; place += 1) {
    sets.push({
      attendance: TENTHS[(place * 7) % TENTHS.length] ?? 0,
      mentoring: (place * 13) % 101,
      siku: (place * 17) % 101,
      skpm: TENTHS[(place * 31) % TENTHS.length] ?? 0,
    });
  }
  return sets;
}

describe("the grade rules in the database", { timeout: 20_000 }, () => {
  it("give Kehadiran as the server does, to one decimal, and none with nothing counted", async () => {
    await inTestDatabase(async (db) => {
      const values = attendances();

      const found = await evaluated(
        db,
        values,
        "attended integer, counted integer",
        percentSql(given("attended"), given("counted")),
      );

      expect(found).toEqual(values.map((each) => scorePercent(each)));
    });
  });

  it("give SIKU akhir as the server does, held within 0–100", async () => {
    await inTestDatabase(async (db) => {
      const values = [];
      for (const gains of range(0, 120, 7)) {
        for (const losses of range(0, 120, 9)) values.push({ gains, losses });
      }

      for (const base of [0, 65, 100]) {
        const found = await evaluated(
          db,
          values,
          "gains bigint, losses bigint",
          sikuSql(base, given("gains"), given("losses")),
        );

        expect(found).toEqual(values.map((each) => sikuOf(base, each)));
      }
    });
  });

  it("give Nilai SKPM as the server does, at most 100, to one decimal", async () => {
    await inTestDatabase(async (db) => {
      const values = range(0, 15000, 7).map((cents) => ({
        total: cents / 100,
      }));

      for (const pointsForHundred of [1, 50, 70, 333]) {
        const found = await evaluated(
          db,
          values,
          "total numeric",
          skpmSql(given("total"), pointsForHundred),
        );

        expect(found).toEqual(
          values.map((each) => skpmScoreOf(each.total, pointsForHundred)),
        );
      }
    });
  });

  it("give Nilai akhir, the letter and the pass as the server does", async () => {
    await inTestDatabase(async (db) => {
      const values = partSets();
      const parts = {
        attendance: given("attendance"),
        mentoring: given("mentoring"),
        siku: given("siku"),
        skpm: given("skpm"),
      };
      const columns =
        "attendance float8, mentoring smallint, siku integer, skpm float8";

      for (const scheme of SCHEMES) {
        const final = finalSql(parts, scheme.weights);
        const finals = await evaluated(db, values, columns, final);
        const letters = await evaluated(
          db,
          values,
          columns,
          letterSql(final, scheme),
        );
        const passing = await evaluated(
          db,
          values,
          columns,
          passesSql(final, scheme),
        );

        const grades = values.map((each) => gradeOf(each, scheme));
        expect(finals).toEqual(
          values.map((each) => finalScoreOf(each, scheme.weights)),
        );
        expect(letters).toEqual(
          grades.map((grade) => (grade.complete ? grade.letter : null)),
        );
        expect(passing).toEqual(
          grades.map((grade) => (grade.complete ? grade.passes : null)),
        );
      }
    });
  });

  it("give every letter at its lower limit, and E below the last", async () => {
    await inTestDatabase(async (db) => {
      const values = TENTHS.map((final) => ({ final }));

      for (const scheme of SCHEMES) {
        const found = await evaluated(
          db,
          values,
          "final float8",
          letterSql(given("final"), scheme),
        );

        expect(found).toEqual(
          values.map((each) => letterOf(each.final, scheme)),
        );
        expect(new Set(found).size).toBeGreaterThan(1);
      }
      expect(GRADE_LETTERS).toContain("E");
    });
  });

  it("leave Nilai akhir, the letter and the pass out while a part is missing", async () => {
    await inTestDatabase(async (db) => {
      const values = [
        { attendance: null, mentoring: 80, siku: 70, skpm: 60 },
        { attendance: 80, mentoring: null, siku: 70, skpm: 60 },
        { attendance: 80, mentoring: 80, siku: null, skpm: 60 },
        { attendance: 80, mentoring: 80, siku: 70, skpm: null },
      ];
      const parts = {
        attendance: given("attendance"),
        mentoring: given("mentoring"),
        siku: given("siku"),
        skpm: given("skpm"),
      };
      const columns =
        "attendance float8, mentoring smallint, siku integer, skpm float8";
      const final = finalSql(parts, STARTING_SCHEME.weights);

      for (const expression of [
        final,
        letterSql(final, STARTING_SCHEME),
        passesSql(final, STARTING_SCHEME),
      ]) {
        const found = await evaluated(db, values, columns, expression);
        expect(found).toEqual([null, null, null, null]);
      }
    });
  });
});
