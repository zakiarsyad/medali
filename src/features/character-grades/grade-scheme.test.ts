import { describe, expect, it } from "vitest";
import { accounts, characterGradeSchemes } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readGradeScheme } from "./grade-scheme";
import { STARTING_SCHEME } from "./scheme-ids";

const inTestDatabase = withTestDatabase();

describe("readGradeScheme", () => {
  it("gives the prototype's scheme, not changed yet, while none is saved", async () => {
    await inTestDatabase(async (db) => {
      expect(await readGradeScheme(db)).toEqual({
        scheme: {
          weights: { attendance: 25, mentoring: 25, siku: 25, skpm: 25 },
          lowerLimits: { A: 85, B: 70, C: 60, D: 50 },
          passLetter: "B",
        },
        version: "start",
        set: null,
      });
    });
  });

  it("gives the latest setting, with who set it and when", async () => {
    await inTestDatabase(async (db) => {
      const [kepala] = await db
        .insert(accounts)
        .values({ name: "Kepala Uji Baca Skema" })
        .returning();
      if (!kepala) throw new Error("The account was not added.");
      const [first] = await db
        .insert(characterGradeSchemes)
        .values({
          attendanceWeight: 40,
          mentoringWeight: 20,
          sikuWeight: 20,
          skpmWeight: 20,
          aFrom: 85,
          bFrom: 70,
          cFrom: 60,
          dFrom: 50,
          passLetter: "B",
          before: STARTING_SCHEME,
          setBy: kepala.id,
          setAt: new Date("3230-01-01T00:00:00Z"),
        })
        .returning();
      if (!first) throw new Error("The setting was not added.");
      const [second] = await db
        .insert(characterGradeSchemes)
        .values({
          attendanceWeight: 10,
          mentoringWeight: 30,
          sikuWeight: 30,
          skpmWeight: 30,
          aFrom: 90,
          bFrom: 75,
          cFrom: 65,
          dFrom: 0,
          passLetter: "C",
          before: STARTING_SCHEME,
          replaces: first.id,
          setBy: kepala.id,
          setAt: new Date("3230-01-02T00:00:00Z"),
        })
        .returning();
      if (!second) throw new Error("The setting was not added.");

      expect(await readGradeScheme(db)).toEqual({
        scheme: {
          weights: { attendance: 10, mentoring: 30, siku: 30, skpm: 30 },
          lowerLimits: { A: 90, B: 75, C: 65, D: 0 },
          passLetter: "C",
        },
        version: second.id,
        set: {
          at: new Date("3230-01-02T00:00:00Z"),
          by: "Kepala Uji Baca Skema",
        },
      });
    });
  });
});
