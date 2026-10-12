import { describe, expect, it } from "vitest";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { brokenRule, refusalAfterError } from "./broken-rule";

const inTestDatabase = withTestDatabase();

const ODD_2026 = {
  startYear: 2026,
  term: "odd",
  startsOn: "2026-08-01",
  endsOn: "2027-01-31",
} as const;

async function refusalOf(save: () => Promise<unknown>): Promise<unknown> {
  try {
    await save();
  } catch (error) {
    return error;
  }
  throw new Error("The database took the period.");
}

describe("brokenRule", () => {
  it("names the same year and term kept twice", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const error = await refusalOf(() =>
        db.transaction((tx) =>
          tx.insert(academicPeriods).values({
            ...ODD_2026,
            startsOn: "2028-08-01",
            endsOn: "2029-01-31",
          }),
        ),
      );

      expect(brokenRule(error)).toBe("same_year_and_term");
    });
  });

  it("names days that overlap another period", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const error = await refusalOf(() =>
        db.transaction((tx) =>
          tx.insert(academicPeriods).values({
            startYear: 2026,
            term: "even",
            startsOn: "2027-01-31",
            endsOn: "2027-07-31",
          }),
        ),
      );

      expect(brokenRule(error)).toBe("overlap");
    });
  });

  it("names nothing for any other error", () => {
    expect(brokenRule(new Error("The database is away."))).toBeNull();
    expect(brokenRule(null)).toBeNull();
  });
});

describe("refusalAfterError", () => {
  const EVEN_2026 = {
    startYear: 2026,
    term: "even",
    startsOn: "2027-01-31",
    endsOn: "2027-07-31",
  } as const;

  it("answers a save the database refused as a period that exists", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const again = {
        ...ODD_2026,
        startsOn: "2028-08-01",
        endsOn: "2029-01-31",
      };
      const error = await refusalOf(() =>
        db.transaction((tx) => tx.insert(academicPeriods).values(again)),
      );

      expect(await refusalAfterError(db, error, again)).toEqual({
        ok: false,
        error: "Periode Ganjil 2026/2027 sudah ada.",
      });
    });
  });

  it("answers a save the database refused for its days with the period in the way", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values(ODD_2026);
      const error = await refusalOf(() =>
        db.transaction((tx) => tx.insert(academicPeriods).values(EVEN_2026)),
      );

      expect(await refusalAfterError(db, error, EVEN_2026)).toEqual({
        ok: false,
        error:
          "Tanggal bertumpuk dengan periode Ganjil 2026/2027 (1 Agu 2026 – 31 Jan 2027). Pilih tanggal di luar periode itu.",
      });
    });
  });

  it("throws any other error again", async () => {
    await inTestDatabase(async (db) => {
      const error = new Error("The database is away.");

      await expect(refusalAfterError(db, error, EVEN_2026)).rejects.toBe(error);
    });
  });
});
