import { describe, expect, it } from "vitest";
import { withTestDatabase } from "@/db/test-database";
import type { FormedGroup } from "./form-groups";
import { numberAfterLive, readHighestNumbers } from "./number-groups";
import { addTestLiveGroup, addTestProgram } from "./test-records";

const inTestDatabase = withTestDatabase();

function formed(more: Partial<FormedGroup>): FormedGroup {
  return {
    studyProgramId: 1,
    entryPath: "regular",
    number: 1,
    studentIds: [],
    ...more,
  };
}

describe("numberAfterLive", () => {
  it("keeps the numbers from 1 when no group is in force", () => {
    const groups = [formed({ number: 1 }), formed({ number: 2 })];

    const numbered = numberAfterLive(groups, []);

    expect(numbered.map((group) => group.number)).toEqual([1, 2]);
  });

  it("goes on after the highest number of the same program and jalur", () => {
    const live = [
      { studyProgramId: 1, entryPath: "regular", highest: 3 } as const,
    ];
    const groups = [
      formed({ number: 1 }),
      formed({ number: 2 }),
      formed({ number: 1, entryPath: "transfer" }),
      formed({ number: 1, studyProgramId: 2 }),
    ];

    const numbered = numberAfterLive(groups, live);

    expect(numbered.map((group) => group.number)).toEqual([4, 5, 1, 1]);
  });
});

describe("readHighestNumbers", () => {
  it("gives the highest number of each program and jalur of the angkatan, without ended groups", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJINOMOR");
      await addTestLiveGroup(db, program, { cohortYear: 2041, number: 1 });
      await addTestLiveGroup(db, program, { cohortYear: 2041, number: 2 });
      await addTestLiveGroup(db, program, { cohortYear: 2042, number: 7 });
      await addTestLiveGroup(db, program, {
        cohortYear: 2041,
        number: 9,
        isEnded: true,
      });

      const highest = await readHighestNumbers(db, 2041);

      expect(highest).toEqual([
        { studyProgramId: program, entryPath: "regular", highest: 2 },
      ]);
    });
  });
});
