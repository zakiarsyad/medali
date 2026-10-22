import { describe, expect, it } from "vitest";
import { everyoneLine, groupsLine, intensiveLine } from "./mentoring-words";

describe("the words of Pendampingan", () => {
  it("says how many Aktif students there are without the filter only while one is in use", () => {
    expect(everyoneLine(null)).toBeUndefined();
    expect(everyoneLine(1250)).toBe("dari 1.250 mahasiswa aktif");
  });

  it("names the groups and the Intensif students", () => {
    expect(groupsLine(8)).toBe("8 kelompok pengasuhan");
    expect(intensiveLine(0)).toBe("0 di antaranya intensif");
  });
});
