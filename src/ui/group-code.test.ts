import { describe, expect, it } from "vitest";
import { groupCode } from "./group-code";

const GROUP = {
  cohortYear: 2024,
  programCode: "D3PJK",
  entryPath: "regular",
  number: 1,
} as const;

describe("groupCode", () => {
  it("joins the angkatan, the program code and the number", () => {
    expect(groupCode(GROUP)).toBe("KP 24-D3PJK-01");
  });

  it("marks a group of the alih program jalur with AJ", () => {
    expect(groupCode({ ...GROUP, entryPath: "transfer" })).toBe(
      "KP 24-D3PJK-AJ-01",
    );
  });

  it("writes the angkatan and the number with two digits each", () => {
    const group = { ...GROUP, cohortYear: 2005, programCode: "ASP" };
    expect(groupCode({ ...group, number: 7 })).toBe("KP 05-ASP-07");
    expect(groupCode({ ...group, number: 12 })).toBe("KP 05-ASP-12");
  });
});
