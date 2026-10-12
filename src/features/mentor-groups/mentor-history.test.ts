import { describe, expect, it } from "vitest";
import { historyWords } from "./mentor-history";

describe("historyWords", () => {
  it("says Pengasuh awal for a group that has had one mentor", () => {
    expect(historyWords(1)).toBe("Pengasuh awal");
  });

  it("says how many times the mentor was replaced", () => {
    expect(historyWords(2)).toBe("1 kali diganti");
    expect(historyWords(4)).toBe("3 kali diganti");
  });

  it("says Pengasuh awal for a group that has had no mentor yet", () => {
    expect(historyWords(0)).toBe("Pengasuh awal");
  });
});
