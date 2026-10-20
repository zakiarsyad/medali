import { describe, expect, it } from "vitest";
import { shownFinal, shownOneDecimal, shownPart } from "./grade-words";

describe("shownPart", () => {
  it("shows a whole score as it is, another with one decimal, and a dash for none", () => {
    expect(shownPart(80)).toBe("80");
    expect(shownPart(87.5)).toBe("87,5");
    expect(shownPart(null)).toBe("-");
  });
});

describe("shownFinal", () => {
  it("shows Nilai akhir with one decimal, or Belum lengkap", () => {
    expect(
      shownFinal({ complete: true, final: 77, letter: "B", passes: true }),
    ).toBe("77,0");
    expect(shownFinal({ complete: false })).toBe("Belum lengkap");
  });
});

describe("shownOneDecimal", () => {
  it("shows one decimal, or a dash for none", () => {
    expect(shownOneDecimal(58.5)).toBe("58,5");
    expect(shownOneDecimal(null)).toBe("-");
  });
});
