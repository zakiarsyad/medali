import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import { maySeeGroup } from "./visible-groups";

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

describe("maySeeGroup", () => {
  it("shows every group to an account that sees every row", () => {
    expect(maySeeGroup({ kind: "all" }, 7)).toBe(true);
  });

  it("shows a head of a study program the groups of that program", () => {
    expect(maySeeGroup(onlyPrograms([7]), 7)).toBe(true);
  });

  it("refuses a head of a study program the group of another program", () => {
    expect(maySeeGroup(onlyPrograms([7]), 8)).toBe(false);
  });

  it("refuses every group to an account with no study program", () => {
    expect(maySeeGroup(onlyPrograms([]), 7)).toBe(false);
  });

  it("opens no group through the mentees or the student of an account", () => {
    const limit: RowLimit = {
      kind: "some",
      studyProgramIds: [],
      menteesOf: ["account-1"],
      studentIds: ["student-1"],
    };
    expect(maySeeGroup(limit, 7)).toBe(false);
  });
});
