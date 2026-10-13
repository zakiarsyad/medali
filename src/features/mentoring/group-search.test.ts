import { describe, expect, it } from "vitest";
import {
  choiceWords,
  type GroupChoice,
  groupChoiceOf,
  matchingGroups,
} from "./group-search";

describe("groupChoiceOf", () => {
  const group = {
    id: "1",
    cohortYear: 2024,
    entryPath: "regular",
    number: 1,
    programCode: "D3PJK",
  } as const;

  it("names a group by its code and its mentor of today with the gelar", () => {
    const mentor = { id: "m", name: "Pengasuh Uji Satu", title: "M.Si." };

    expect(groupChoiceOf({ ...group, mentor })).toEqual({
      id: "1",
      code: "KP 24-D3PJK-01",
      mentor: "Pengasuh Uji Satu, M.Si.",
    });
  });

  it("shows a dash for a group that has no mentor today", () => {
    expect(groupChoiceOf({ ...group, mentor: null }).mentor).toBe("-");
  });
});

const TAX: GroupChoice = {
  id: "1",
  code: "KP 24-D3PJK-01",
  mentor: "Pengasuh Uji Satu, M.Si.",
};
const CUSTOMS: GroupChoice = {
  id: "2",
  code: "KP 25-D3KBC-AJ-02",
  mentor: "Pengasuh Uji Dua",
};
const WITHOUT_MENTOR: GroupChoice = {
  id: "3",
  code: "KP 26-D4AKT-01",
  mentor: "-",
};
const GROUPS = [TAX, CUSTOMS, WITHOUT_MENTOR];

describe("matchingGroups", () => {
  it("finds a group by a part of its code", () => {
    expect(matchingGroups(GROUPS, "d3kbc")).toEqual([CUSTOMS]);
    expect(matchingGroups(GROUPS, "24-")).toEqual([TAX]);
  });

  it("finds a group by a part of its mentor's name, whatever the capitals", () => {
    expect(matchingGroups(GROUPS, "uji SATU")).toEqual([TAX]);
    expect(matchingGroups(GROUPS, "pengasuh uji")).toEqual([TAX, CUSTOMS]);
  });

  it("leaves out the blanks around what was typed", () => {
    expect(matchingGroups(GROUPS, "  D4AKT ")).toEqual([WITHOUT_MENTOR]);
  });

  it("offers every group, in the order given, while nothing is typed", () => {
    expect(matchingGroups(GROUPS, "  ")).toEqual(GROUPS);
  });

  it("finds nothing for a text no group holds", () => {
    expect(matchingGroups(GROUPS, "tidak ada")).toEqual([]);
  });
});

describe("choiceWords", () => {
  it("names a group by its code and its mentor", () => {
    expect(choiceWords(TAX)).toBe("KP 24-D3PJK-01 · Pengasuh Uji Satu, M.Si.");
    expect(choiceWords(WITHOUT_MENTOR)).toBe("KP 26-D4AKT-01 · -");
  });
});
