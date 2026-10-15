import { describe, expect, it } from "vitest";
import { readOnlyNote, shownOneDecimal, shownPoints } from "./skpm-words";

describe("the numbers of Data SKPM", () => {
  it("shows a score with one decimal, and a dash for none", () => {
    expect(shownOneDecimal(60)).toBe("60,0");
    expect(shownOneDecimal(33.3)).toBe("33,3");
    expect(shownOneDecimal(null)).toBe("-");
  });

  it("shows points whole, or with their decimals", () => {
    expect(shownPoints(8)).toBe("8");
    expect(shownPoints(7.5)).toBe("7,5");
    expect(shownPoints(1000)).toBe("1.000");
  });

  it("tells a role that only reads who uploads and how many points equal 100", () => {
    expect(readOnlyNote(40)).toBe(
      "Data SKPM diunggah oleh Kepala Unit Pembangunan Karakter dan Penilai Mahasiswa. Nilai SKPM dihitung dari total poin: 40 poin setara nilai 100.",
    );
  });
});
