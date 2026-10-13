import { describe, expect, it } from "vitest";
import { matchingMentees } from "./mentee-search";

const MENTEES = [
  { id: "a", name: "Adi Nugraha", nim: "9961000101" },
  { id: "b", name: "Bunga Lestari", nim: "9961000102" },
  { id: "c", name: "Citra Adiningsih", nim: "9961000113" },
];

function namesFound(query: string): string[] {
  return matchingMentees(MENTEES, query).map((mentee) => mentee.name);
}

describe("matchingMentees", () => {
  it("finds by a part of the name, whatever the capitals", () => {
    expect(namesFound("adi")).toEqual(["Adi Nugraha", "Citra Adiningsih"]);
    expect(namesFound("  LESTARI ")).toEqual(["Bunga Lestari"]);
  });

  it("finds by a part of the NIM", () => {
    expect(namesFound("99610001")).toEqual([
      "Adi Nugraha",
      "Bunga Lestari",
      "Citra Adiningsih",
    ]);
    expect(namesFound("113")).toEqual(["Citra Adiningsih"]);
  });

  it("finds nobody for a text no mentee holds", () => {
    expect(namesFound("zzz")).toEqual([]);
  });

  it("offers nobody before anything is typed", () => {
    expect(namesFound("")).toEqual([]);
    expect(namesFound("   ")).toEqual([]);
  });
});
