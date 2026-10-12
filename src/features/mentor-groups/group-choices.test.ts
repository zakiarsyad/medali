import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import { withTestDatabase } from "@/db/test-database";
import { listGroupChoices } from "./group-choices";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

describe("listGroupChoices", () => {
  it("offers the program studi by name and the angkatan newest first, each once", async () => {
    await inTestDatabase(async (db) => {
      const later = await addTestProgram(db, "UJIPILIH B");
      const first = await addTestProgram(db, "UJIPILIH A");
      await addTestGroup(db, later, { cohortYear: 2024 });
      await addTestGroup(db, later, { cohortYear: 2025 });
      await addTestGroup(db, first, { cohortYear: 2025 });
      await addTestGroup(db, first, { cohortYear: 2025, number: 2 });

      const choices = await listGroupChoices(db, onlyPrograms([later, first]));

      expect(choices).toEqual({
        programs: [
          { id: first, name: "UJIPILIH A" },
          { id: later, name: "UJIPILIH B" },
        ],
        cohortYears: [2025, 2024],
      });
    });
  });

  it("offers a head of a study program what their own groups hold", async () => {
    await inTestDatabase(async (db) => {
      const own = await addTestProgram(db, "UJIPILIH A");
      const other = await addTestProgram(db, "UJIPILIH B");
      await addTestGroup(db, own, { cohortYear: 2025 });
      await addTestGroup(db, other, { cohortYear: 2024 });

      const choices = await listGroupChoices(db, onlyPrograms([own]));

      expect(choices).toEqual({
        programs: [{ id: own, name: "UJIPILIH A" }],
        cohortYears: [2025],
      });
    });
  });

  it("offers nothing that only an ended group holds", async () => {
    await inTestDatabase(async (db) => {
      const live = await addTestProgram(db, "UJIPILIH A");
      const ended = await addTestProgram(db, "UJIPILIH B");
      await addTestGroup(db, live, { cohortYear: 2025 });
      await addTestEndedGroup(db, ended, { cohortYear: 2024 });

      const choices = await listGroupChoices(db, onlyPrograms([live, ended]));

      expect(choices).toEqual({
        programs: [{ id: live, name: "UJIPILIH A" }],
        cohortYears: [2025],
      });
    });
  });

  it("offers nothing to an account with no study program", async () => {
    await inTestDatabase(async (db) => {
      const program = await addTestProgram(db, "UJIPILIH A");
      await addTestGroup(db, program);

      const choices = await listGroupChoices(db, onlyPrograms([]));

      expect(choices).toEqual({ programs: [], cohortYears: [] });
    });
  });
});
