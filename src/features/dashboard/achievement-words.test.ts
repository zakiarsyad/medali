import { describe, expect, it } from "vitest";
import type { Recap } from "./achievement-recap";
import {
  averageWords,
  cardLine,
  changeWords,
  medalCaption,
  rerataLine,
} from "./achievement-words";

const SCORES = { M: 80, E: 80, D: 80, A: 80, L: 80, I: 80 };

const RECAP: Recap = {
  students: 1240,
  assessed: 1100,
  rerata: 81.7,
  spread: { gold: 300, silver: 600, bronze: 150, guidance: 50 },
  averages: SCORES,
  change: null,
};

describe("the words of Capaian karakter", () => {
  it("says on the card how many are assessed of how many, and how many are Emas and Perlu pembinaan", () => {
    expect(cardLine(RECAP)).toBe(
      "Hasil asesmen 1.100 dari 1.240 mahasiswa. 300 emas, 50 perlu pembinaan.",
    );
  });

  it("writes an average to one decimal", () => {
    expect(averageWords(81.666)).toBe("81,7");
    expect(averageWords(80)).toBe("80,0");
  });

  it("writes the change since last semester with its sign, or Semester pertama", () => {
    expect(changeWords(1.24)).toBe("+1,2 dari semester lalu");
    expect(changeWords(-0.46)).toBe("-0,5 dari semester lalu");
    expect(changeWords(-0.02)).toBe("+0,0 dari semester lalu");
    expect(changeWords(null)).toBe("Semester pertama");
  });

  it("names the predikat of the Rerata under the medal", () => {
    expect(rerataLine(81.7)).toBe("Rerata 81,7 · Perak");
    expect(rerataLine(85)).toBe("Rerata 85,0 · Emas");
  });

  it("speaks of the dashed line only when it is drawn", () => {
    expect(medalCaption(RECAP)).toBe(
      "1.100 dari 1.240 mahasiswa sudah diasesmen.",
    );
    expect(
      medalCaption({ ...RECAP, change: { changes: SCORES, last: SCORES } }),
    ).toBe(
      "1.100 dari 1.240 mahasiswa sudah diasesmen. Garis putus-putus menunjukkan semester lalu.",
    );
  });
});
