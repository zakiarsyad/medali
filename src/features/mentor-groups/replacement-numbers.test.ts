import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestReplacement,
  testReplacementsOf,
} from "@/mentoring/test-replacements";
import {
  countReplacementsThisYear,
  readReplacementNumbers,
} from "./replacement-numbers";
import { countsThisYear } from "./replacement-year";
import { countReserveMentors } from "./spare-mentors";
import { addTestHeldGroup } from "./test-evaluations";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMentor,
  addTestMentorLine,
  addTestMentorRole,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const TODAY = "2088-10-13";
const EVERY_ROW: RowLimit = { kind: "all" };

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

/** A held group of a program of its own, with what a replacement of it needs. */
async function addReplaced(db: Database, program: string) {
  const held = await addTestHeldGroup(db, program, `Lama ${program}`);
  const newMentorId = await addTestMentor(db, { name: `Baru ${program}` });
  const replacement = {
    groupId: held.groupId,
    oldMentorId: held.mentorId,
    newMentorId,
  };
  return { held, replacement, limit: onlyPrograms([held.studyProgramId]) };
}

const CARRIED_OUT = { carriedOutAt: new Date("2088-01-01T03:00:00Z") };

describe("countReplacementsThisYear", () => {
  it("counts the replacements of this calendar year that are not cancelled, one that waits among them", async () => {
    await inTestDatabase(async (db) => {
      const { held, replacement, limit } = await addReplaced(db, "UJITAHUNINI");
      const days = ["2087-12-31", "2088-01-01", "2088-12-31", "2089-01-01"];
      for (const startsOn of days) {
        await addTestReplacement(db, {
          ...replacement,
          ...CARRIED_OUT,
          startsOn,
        });
      }
      await addTestReplacement(db, { ...replacement, startsOn: "2088-11-02" });
      await addTestReplacement(db, {
        ...replacement,
        startsOn: "2088-11-03",
        cancelledBy: held.mentorId,
        cancelledAt: new Date("2088-10-13T03:00:00Z"),
      });

      const counted = await countReplacementsThisYear(db, limit, TODAY);

      expect(counted).toBe(3);
      const stored = await testReplacementsOf(db, held.groupId);
      expect(stored).toHaveLength(6);
      expect(stored.filter((one) => countsThisYear(one, TODAY))).toHaveLength(
        counted,
      );
    });
  });

  it("counts for a head of a study program the replacements of their own groups only, and none of an ended group", async () => {
    await inTestDatabase(async (db) => {
      const own = await addReplaced(db, "UJITAHUNSATU");
      const other = await addReplaced(db, "UJITAHUNDUA");
      const ended = await addTestEndedGroup(db, own.held.studyProgramId, {
        number: 2,
      });
      const day = { ...CARRIED_OUT, startsOn: "2088-03-10" };
      await addTestReplacement(db, { ...own.replacement, ...day });
      await addTestReplacement(db, { ...other.replacement, ...day });
      await addTestReplacement(db, {
        ...own.replacement,
        ...day,
        groupId: ended,
      });
      const both = onlyPrograms([
        own.held.studyProgramId,
        other.held.studyProgramId,
      ]);

      expect(await countReplacementsThisYear(db, own.limit, TODAY)).toBe(1);
      expect(await countReplacementsThisYear(db, both, TODAY)).toBe(2);
      expect(await countReplacementsThisYear(db, onlyPrograms([]), TODAY)).toBe(
        0,
      );
    });
  });
});

describe("countReserveMentors", () => {
  it("counts a mentor with the role and no group, also one kept for a replacement that waits, and not one who holds a group", async () => {
    await inTestDatabase(async (db) => {
      const { held, replacement } = await addReplaced(db, "UJIHITUNGCDG");
      const before = await countReserveMentors(db);

      const free = await addTestMentor(db, { name: "Uji Hitung Bebas" });
      await addTestMentorRole(db, free);
      await addTestMentorRole(db, replacement.newMentorId);
      await addTestReplacement(db, { ...replacement, startsOn: "2088-11-02" });
      const holding = await addTestMentor(db, { name: "Uji Hitung Mengasuh" });
      await addTestMentorRole(db, holding);
      const second = await addTestGroup(db, held.studyProgramId, { number: 2 });
      await addTestMentorLine(db, second, holding);

      expect(await countReserveMentors(db)).toBe(before + 2);
    });
  });
});

describe("readReplacementNumbers", () => {
  it("gives an account that sees every mentor the count of spare mentors", async () => {
    await inTestDatabase(async (db) => {
      const numbers = await readReplacementNumbers(db, EVERY_ROW, EVERY_ROW);

      expect(numbers.spares).toBe(await countReserveMentors(db));
    });
  });

  it("gives no count of spare mentors to a head of a study program, nor to an account that sees no mentors", async () => {
    await inTestDatabase(async (db) => {
      const { limit } = await addReplaced(db, "UJIANGKAGANTI");

      expect(await readReplacementNumbers(db, limit, limit)).toEqual({
        thisYear: 0,
        spares: null,
      });
      expect(await readReplacementNumbers(db, limit, null)).toEqual({
        thisYear: 0,
        spares: null,
      });
    });
  });
});
